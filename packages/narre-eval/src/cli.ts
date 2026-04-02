import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadScenarios } from './loader.js';
import { setupDb, teardownDb, startNarreServer, stopNarreServer, getSeededProjectId } from './harness.js';
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
  const resultsDir = join(packageRoot, 'results');

  // Load scenarios
  const scenarios = loadScenarios(scenariosDir, options);
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

      try {
        // Setup
        console.log('  Setting up DB...');
        const projectId = setupDb(scenario.seed);

        console.log('  Starting narre-server...');
        await startNarreServer(options.port);

        // Run
        console.log('  Sending turns...');
        const startTime = Date.now();
        const transcript = await runScenario(scenario.turns, projectId, options.port);
        transcript.scenarioId = scenario.id;
        const durationMs = Date.now() - startTime;

        console.log(`  Completed in ${(durationMs / 1000).toFixed(1)}s (${transcript.totalToolCalls} tool calls)`);

        // Grade
        console.log('  Grading...');
        const result = await gradeScenario(
          scenario.id,
          transcript,
          scenario.assertions,
          projectId,
          durationMs,
          options.judge,
        );

        // Record
        recordResult(resultsDir, result);
        allResults.push(result);
      } catch (error) {
        const errResult: ScenarioResult = {
          scenarioId: scenario.id,
          timestamp: new Date().toISOString(),
          dbAssertions: { passed: 0, total: 0, results: [] },
          responseAssertions: { passed: 0, total: 0, results: [] },
          toolCountCheck: null,
          judgeScores: [],
          judgeAvg: null,
          durationMs: 0,
          transcript: { scenarioId: scenario.id, sessionId: null, turns: [], totalToolCalls: 0 },
          error: (error as Error).message,
        };
        recordResult(resultsDir, errResult);
        allResults.push(errResult);
        console.error(`  ERROR: ${(error as Error).message}`);
      } finally {
        stopNarreServer();
        teardownDb();
      }
    }
  }

  printSummary(allResults);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
