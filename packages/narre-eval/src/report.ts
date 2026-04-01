import { appendFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { ScenarioResult } from './types.js';

const TSV_HEADER = 'timestamp\tscenario_id\tdb_pass\tdb_total\tresponse_pass\tresponse_total\ttool_calls\tjudge_avg\tjudge_scores\tduration_ms\tnotes';

export function recordResult(resultsDir: string, result: ScenarioResult): void {
  const tsvPath = join(resultsDir, 'results.tsv');
  const transcriptDir = join(resultsDir, 'transcripts');
  mkdirSync(transcriptDir, { recursive: true });

  // Append to TSV
  if (!existsSync(tsvPath)) {
    writeFileSync(tsvPath, TSV_HEADER + '\n', 'utf-8');
  }

  const failedAssertions = [
    ...result.dbAssertions.results.filter((r) => !r.passed).map((r) => r.name),
    ...result.responseAssertions.results.filter((r) => !r.passed).map((r) => r.name),
  ];
  const notes = result.error
    ? `error: ${result.error}`
    : failedAssertions.length > 0
      ? failedAssertions.join('; ')
      : '';

  const judgeScoresStr = result.judgeScores.length > 0
    ? `[${result.judgeScores.map((s) => s.score).join(',')}]`
    : '';

  const line = [
    result.timestamp,
    result.scenarioId,
    result.dbAssertions.passed,
    result.dbAssertions.total,
    result.responseAssertions.passed,
    result.responseAssertions.total,
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

  let totalDbPass = 0, totalDbTotal = 0;
  let totalResPass = 0, totalResTotal = 0;

  for (const r of results) {
    const dbStatus = r.dbAssertions.total > 0
      ? `${r.dbAssertions.passed}/${r.dbAssertions.total}`
      : '-';
    const resStatus = r.responseAssertions.total > 0
      ? `${r.responseAssertions.passed}/${r.responseAssertions.total}`
      : '-';
    const judgeStr = r.judgeAvg != null ? r.judgeAvg.toFixed(1) : '-';
    const toolStr = `${r.transcript.totalToolCalls} tools`;
    const timeStr = `${(r.durationMs / 1000).toFixed(1)}s`;

    const allDbPass = r.dbAssertions.passed === r.dbAssertions.total;
    const allResPass = r.responseAssertions.passed === r.responseAssertions.total;
    const status = r.error ? 'ERROR' : (allDbPass && allResPass) ? 'PASS' : 'FAIL';
    const icon = status === 'PASS' ? '[OK]' : status === 'FAIL' ? '[FAIL]' : '[ERR]';

    console.log(`\n  ${icon} ${r.scenarioId}`);
    console.log(`      DB: ${dbStatus}  Response: ${resStatus}  Judge: ${judgeStr}  ${toolStr}  ${timeStr}`);

    if (!allDbPass || !allResPass) {
      const failed = [
        ...r.dbAssertions.results.filter((a) => !a.passed),
        ...r.responseAssertions.results.filter((a) => !a.passed),
      ];
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

    totalDbPass += r.dbAssertions.passed;
    totalDbTotal += r.dbAssertions.total;
    totalResPass += r.responseAssertions.passed;
    totalResTotal += r.responseAssertions.total;
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`  Total: DB ${totalDbPass}/${totalDbTotal}  Response ${totalResPass}/${totalResTotal}  Scenarios ${results.length}`);
  console.log('='.repeat(60) + '\n');
}
