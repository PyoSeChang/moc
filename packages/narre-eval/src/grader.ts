import { getDatabase } from '@netior/core';
import Anthropic from '@anthropic-ai/sdk';
import type {
  VerifyItem,
  VerifyResult,
  QualitativeItem,
  Transcript,
  JudgeScore,
  ScenarioResult,
} from './types.js';

export async function gradeScenario(
  scenarioId: string,
  transcript: Transcript,
  verify: VerifyItem[],
  qualitative: QualitativeItem[],
  projectId: string,
  durationMs: number,
  runJudge: boolean,
): Promise<ScenarioResult> {
  const verifyResults = gradeVerify(verify, projectId, transcript);

  let judgeScores: JudgeScore[] = [];
  let judgeAvg: number | null = null;

  if (runJudge && qualitative.length > 0) {
    judgeScores = await runLlmJudge(transcript, qualitative.map((q) => q.rubric));
    judgeAvg = judgeScores.reduce((sum, s) => sum + s.score, 0) / judgeScores.length;
  }

  return {
    scenarioId,
    timestamp: new Date().toISOString(),
    verifyResults: {
      passed: verifyResults.filter((r) => r.passed).length,
      total: verifyResults.length,
      results: verifyResults,
    },
    judgeScores,
    judgeAvg,
    durationMs,
    transcript,
  };
}

// ── Verify ──

function gradeVerify(
  items: VerifyItem[],
  projectId: string,
  transcript: Transcript,
): VerifyResult[] {
  const results: VerifyResult[] = [];

  for (const item of items) {
    if (item.db) {
      results.push(...gradeDb(item.name, item.db, projectId));
    }
    if (item.db_absent) {
      results.push(gradeDbAbsent(item.name, item.db_absent, projectId));
    }
    if (item.tool) {
      results.push(gradeTool(item.name, item.tool, transcript));
    }
    if (item.response) {
      results.push(...gradeResponse(item.name, item.response, transcript));
    }
  }

  return results;
}

function gradeDb(
  name: string,
  spec: NonNullable<VerifyItem['db']>,
  projectId: string,
): VerifyResult[] {
  const db = getDatabase();
  const results: VerifyResult[] = [];

  const condition = spec.condition
    ? spec.condition.replace(/\{\{project_id\}\}/g, projectId)
    : `project_id = '${projectId}'`;

  const rows = db
    .prepare(`SELECT * FROM ${spec.table} WHERE ${condition}`)
    .all() as Record<string, unknown>[];

  if (spec.expect.count !== undefined) {
    results.push({
      name,
      passed: rows.length === spec.expect.count,
      detail: `expected ${spec.expect.count}, got ${rows.length}`,
    });
  }

  if (spec.expect.count_min !== undefined) {
    results.push({
      name,
      passed: rows.length >= spec.expect.count_min,
      detail: `expected >= ${spec.expect.count_min}, got ${rows.length}`,
    });
  }

  if (spec.expect.count_max !== undefined) {
    results.push({
      name,
      passed: rows.length <= spec.expect.count_max,
      detail: `expected <= ${spec.expect.count_max}, got ${rows.length}`,
    });
  }

  if (spec.expect.column_includes) {
    for (const [col, expectedValues] of Object.entries(spec.expect.column_includes)) {
      const actualValues = rows.map((r) => String(r[col]));
      for (const expected of expectedValues) {
        const found = actualValues.includes(expected);
        results.push({
          name: `${name} (${col}="${expected}")`,
          passed: found,
          detail: found ? 'found' : `not found in [${actualValues.join(', ')}]`,
        });
      }
    }
  }

  if (spec.expect.not_null) {
    for (const col of spec.expect.not_null) {
      const allNotNull = rows.every((r) => r[col] != null);
      results.push({
        name: `${name} (${col} not null)`,
        passed: allNotNull,
        detail: allNotNull ? 'all not null' : 'some null values found',
      });
    }
  }

  return results;
}

function gradeDbAbsent(
  name: string,
  spec: NonNullable<VerifyItem['db_absent']>,
  projectId: string,
): VerifyResult {
  const db = getDatabase();

  const condition = spec.condition
    ? `${spec.condition} AND project_id = '${projectId}'`
    : `project_id = '${projectId}'`;

  const row = db
    .prepare(`SELECT COUNT(*) as cnt FROM ${spec.table} WHERE ${condition}`)
    .get() as { cnt: number };

  return {
    name,
    passed: row.cnt === 0,
    detail: row.cnt === 0 ? 'absent (correct)' : `found ${row.cnt} rows`,
  };
}

function gradeTool(
  name: string,
  spec: NonNullable<VerifyItem['tool']>,
  transcript: Transcript,
): VerifyResult {
  const allToolCalls = transcript.turns.flatMap((t) => t.toolCalls);
  const matchingCalls = allToolCalls.filter((tc) => tc.tool === spec.name);
  const count = matchingCalls.length;

  const minOk = spec.expect.count_min === undefined || count >= spec.expect.count_min;
  const maxOk = spec.expect.count_max === undefined || count <= spec.expect.count_max;

  const range = `${spec.expect.count_min ?? 0}-${spec.expect.count_max ?? '∞'}`;

  return {
    name,
    passed: minOk && maxOk,
    detail: `${spec.name} called ${count} times (range: ${range})`,
  };
}

function gradeResponse(
  name: string,
  spec: NonNullable<VerifyItem['response']>,
  transcript: Transcript,
): VerifyResult[] {
  const results: VerifyResult[] = [];
  const fullResponse = transcript.turns.map((t) => t.assistant).join('\n');

  if (spec.contains_all) {
    for (const keyword of spec.contains_all) {
      const found = fullResponse.includes(keyword);
      results.push({
        name: `${name} ("${keyword}")`,
        passed: found,
        detail: found ? 'found' : 'not found in response',
      });
    }
  }

  if (spec.contains_any) {
    const found = spec.contains_any.some((kw) => fullResponse.includes(kw));
    results.push({
      name,
      passed: found,
      detail: found ? 'found' : `none of [${spec.contains_any.join(', ')}] found`,
    });
  }

  if (spec.no_error) {
    const hasError = fullResponse.includes('[ERROR:');
    results.push({
      name,
      passed: !hasError,
      detail: hasError ? 'error found in response' : 'no errors',
    });
  }

  return results;
}

// ── LLM Judge ──

async function runLlmJudge(transcript: Transcript, rubrics: string[]): Promise<JudgeScore[]> {
  const client = new Anthropic();

  const transcriptText = transcript.turns
    .map((t, i) => {
      const tools = t.toolCalls.length > 0
        ? `\n[Tools used: ${t.toolCalls.map((tc) => tc.tool).join(', ')}]`
        : '';
      return `Turn ${i + 1}:\nUser: ${t.user}\nAssistant: ${t.assistant}${tools}`;
    })
    .join('\n\n');

  const rubricText = rubrics
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are evaluating an AI assistant's conversation quality.

## Transcript
${transcriptText}

## Evaluation Criteria
Rate each criterion on a scale of 1-5 (1=poor, 5=excellent).
Respond in JSON format: [{"rubric": "...", "score": N, "justification": "..."}]

Criteria:
${rubricText}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return rubrics.map((r) => ({ rubric: r, score: 0, justification: 'Failed to parse judge response' }));
  }

  try {
    return JSON.parse(jsonMatch[0]) as JudgeScore[];
  } catch {
    return rubrics.map((r) => ({ rubric: r, score: 0, justification: 'Failed to parse judge JSON' }));
  }
}
