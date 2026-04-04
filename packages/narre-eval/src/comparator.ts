import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ScenarioResult, ComparisonResult, MetricValue } from './types.js';

/**
 * Find a baseline run directory for comparison.
 *
 * Resolution rules:
 * - 'latest' or omitted: most recent run excluding the current one
 *   (directory names are {timestamp}_{runId}, so reverse lexicographic = most recent)
 * - any other string: treated as a run ID substring match against directory names
 *   - if multiple directories match, the most recent one is used
 *   - this is deterministic because directory names sort chronologically
 *
 * Returns null if no matching run exists.
 */
export function findBaselineRunDir(
  runsDir: string,
  currentRunId: string,
  baselineArg?: string,
): string | null {
  if (!existsSync(runsDir)) return null;

  const allEntries = readdirSync(runsDir).sort().reverse();

  if (baselineArg && baselineArg !== 'latest') {
    // Match by run ID substring, pick most recent (first after reverse sort)
    const match = allEntries.find((e) => e.includes(baselineArg));
    return match ? join(runsDir, match) : null;
  }

  // Default: most recent run that is not the current one
  const match = allEntries.find((e) => !e.includes(currentRunId));
  return match ? join(runsDir, match) : null;
}

/**
 * Load a previous scenario result from a run directory.
 */
export function loadBaselineResult(
  baselineRunDir: string,
  scenarioId: string,
): ScenarioResult | null {
  const resultPath = join(baselineRunDir, 'scenarios', scenarioId, 'result.json');
  if (!existsSync(resultPath)) return null;

  try {
    return JSON.parse(readFileSync(resultPath, 'utf-8')) as ScenarioResult;
  } catch {
    return null;
  }
}

/**
 * Compare current result against a baseline result.
 */
export function compareResults(
  current: ScenarioResult,
  baseline: ScenarioResult,
): ComparisonResult {
  const verifyPassedDelta = current.verifyResults.passed - baseline.verifyResults.passed;

  let judgeAvgDelta: number | null = null;
  if (current.judgeAvg != null && baseline.judgeAvg != null) {
    judgeAvgDelta = current.judgeAvg - baseline.judgeAvg;
  }

  const metricDeltas: Record<string, number | null> = {};
  const allKeys = new Set([...Object.keys(current.metrics), ...Object.keys(baseline.metrics)]);
  for (const key of allKeys) {
    const curVal = current.metrics[key]?.value;
    const baseVal = baseline.metrics[key]?.value;
    if (curVal != null && baseVal != null) {
      metricDeltas[key] = curVal - baseVal;
    } else {
      metricDeltas[key] = null;
    }
  }

  return {
    baselineRunId: baseline.runId,
    previousStatus: baseline.status,
    currentStatus: current.status,
    statusChanged: current.status !== baseline.status,
    verifyPassedDelta,
    judgeAvgDelta,
    metricDeltas,
  };
}
