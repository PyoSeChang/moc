import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadScenarios } from './loader.js';
import { setupScenario, teardownScenario, startNarreServer, stopNarreServer } from './harness.js';
import { runScenario } from './runner.js';
import { gradeScenario } from './grader.js';
import { recordResult, printSummary } from './report.js';
import type { EvalOptions, ScenarioResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv: string[]): EvalOptions {
  const args = argv.slice(2);
  const options: EvalOptions = {
    repeat: 1,
    judge: true,
    port: 3199,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--scenario':
        options.scenario = args[++i];
        break;
      case '--tag':
        options.tag = args[++i];
        break;
      case '--repeat':
        options.repeat = parseInt(args[++i], 10);
        break;
      case '--no-judge':
        options.judge = false;
        break;
      case '--port':
        options.port = parseInt(args[++i], 10);
        break;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv);

  // Resolve paths
  const packageRoot = join(__dirname, '..');
  const scenariosDir = join(packageRoot, 'scenarios');

  // Load scenarios (folder-based)
  const scenarios = await loadScenarios(scenariosDir, options);
  if (scenarios.length === 0) {
    console.error('No scenarios found matching filters.');
    process.exit(1);
  }

  console.log(`\nLoaded ${scenarios.length} scenario(s)`);
  if (!options.judge) console.log('LLM judge: disabled');
  if (options.repeat > 1) console.log(`Repeat: ${options.repeat}x`);

  const allResults: ScenarioResult[] = [];

  for (let rep = 0; rep < options.repeat; rep++) {
    if (options.repeat > 1) console.log(`\n--- Run ${rep + 1}/${options.repeat} ---`);

    for (const scenario of scenarios) {
      console.log(`\n> Running: ${scenario.id} — ${scenario.description}`);

      let tempDir: string | null = null;

      try {
        // Setup
        console.log('  Setting up scenario...');
        const setup = await setupScenario(scenario.scenarioDir, scenario.seed);
        tempDir = setup.tempDir;

        console.log('  Starting narre-server...');
        await startNarreServer(options.port);

        // Run
        console.log('  Sending turns...');
        const startTime = Date.now();
        const transcript = await runScenario(scenario, setup.projectId, options.port);
        const durationMs = Date.now() - startTime;

        console.log(`  Completed in ${(durationMs / 1000).toFixed(1)}s (${transcript.totalToolCalls} tool calls)`);

        // Grade
        console.log('  Grading...');
        const result = await gradeScenario(
          scenario.id,
          transcript,
          scenario.verify,
          scenario.qualitative,
          setup.projectId,
          durationMs,
          options.judge,
        );

        // Record in scenario folder
        recordResult(scenario.scenarioDir, result);
        allResults.push(result);
      } catch (error) {
        const errResult: ScenarioResult = {
          scenarioId: scenario.id,
          timestamp: new Date().toISOString(),
          verifyResults: { passed: 0, total: 0, results: [] },
          judgeScores: [],
          judgeAvg: null,
          durationMs: 0,
          transcript: { scenarioId: scenario.id, sessionId: null, turns: [], totalToolCalls: 0 },
          error: (error as Error).message,
        };
        recordResult(scenario.scenarioDir, errResult);
        allResults.push(errResult);
        console.error(`  ERROR: ${(error as Error).message}`);
      } finally {
        stopNarreServer();
        if (tempDir) teardownScenario(tempDir);
      }
    }
  }

  printSummary(allResults);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
