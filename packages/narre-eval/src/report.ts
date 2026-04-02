import { appendFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ScenarioResult } from './types.js';

const TSV_HEADER = 'timestamp\tscenario_id\tverify_pass\tverify_total\ttool_calls\tjudge_avg\tjudge_scores\tduration_ms\tnotes';

export function recordResult(scenarioDir: string, result: ScenarioResult): void {
  const resultsDir = join(scenarioDir, 'results');
  const tsvPath = join(resultsDir, 'results.tsv');
  const transcriptDir = join(resultsDir, 'transcripts');
  mkdirSync(transcriptDir, { recursive: true });

  // Append to TSV
  if (!existsSync(tsvPath)) {
    writeFileSync(tsvPath, TSV_HEADER + '\n', 'utf-8');
  }

  const failedChecks = result.verifyResults.results
    .filter((r) => !r.passed)
    .map((r) => r.name);
  const notes = result.error
    ? `error: ${result.error}`
    : failedChecks.length > 0
      ? failedChecks.join('; ')
      : '';

  const judgeScoresStr = result.judgeScores.length > 0
    ? `[${result.judgeScores.map((s) => s.score).join(',')}]`
    : '';

  const line = [
    result.timestamp,
    result.scenarioId,
    result.verifyResults.passed,
    result.verifyResults.total,
    result.transcript.totalToolCalls,
    result.judgeAvg?.toFixed(1) ?? '',
    judgeScoresStr,
    result.durationMs,
    notes,
  ].join('\t');

  appendFileSync(tsvPath, line + '\n', 'utf-8');

  // Save transcript
  const ts = result.timestamp.replace(/[:.]/g, '-');
  const transcriptPath = join(transcriptDir, `${ts}_${result.scenarioId}.json`);
  writeFileSync(transcriptPath, JSON.stringify(result, null, 2), 'utf-8');
}

export function printSummary(results: ScenarioResult[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('  EVAL RESULTS');
  console.log('='.repeat(60));

  let totalPass = 0, totalTotal = 0;

  for (const r of results) {
    const verifyStatus = r.verifyResults.total > 0
      ? `${r.verifyResults.passed}/${r.verifyResults.total}`
      : '-';
    const judgeStr = r.judgeAvg != null ? r.judgeAvg.toFixed(1) : '-';
    const toolStr = `${r.transcript.totalToolCalls} tools`;
    const timeStr = `${(r.durationMs / 1000).toFixed(1)}s`;

    const allPass = r.verifyResults.passed === r.verifyResults.total;
    const status = r.error ? 'ERROR' : allPass ? 'PASS' : 'FAIL';
    const icon = status === 'PASS' ? '[OK]' : status === 'FAIL' ? '[FAIL]' : '[ERR]';

    console.log(`\n  ${icon} ${r.scenarioId}`);
    console.log(`      Verify: ${verifyStatus}  Judge: ${judgeStr}  ${toolStr}  ${timeStr}`);

    if (!allPass) {
      const failed = r.verifyResults.results.filter((a) => !a.passed);
      for (const f of failed) {
        console.log(`      - ${f.name}: ${f.detail}`);
      }
    }

    if (r.judgeScores.length > 0) {
      for (const s of r.judgeScores) {
        console.log(`      - [${s.score}/5] ${s.rubric}`);
      }
    }

    if (r.error) {
      console.log(`      Error: ${r.error}`);
    }

    totalPass += r.verifyResults.passed;
    totalTotal += r.verifyResults.total;
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`  Total: Verify ${totalPass}/${totalTotal}  Scenarios ${results.length}`);
  console.log('='.repeat(60) + '\n');
}
