import {
  listArchetypes,
  listRelationTypes,
  listCanvasTypes,
} from '@netior/core';
import type { NarreStreamEvent } from '@netior/shared/types';
import type {
  EvalScenario,
  Transcript,
  TurnTranscript,
  ToolCallRecord,
  ResponderContext,
} from './types.js';

export async function runScenario(
  scenario: EvalScenario,
  projectId: string,
  port: number,
): Promise<Transcript> {
  const baseUrl = `http://localhost:${port}`;
  const projectMetadata = buildProjectMetadata(projectId);

  if (scenario.type === 'conversation') {
    return runConversation(scenario, projectId, baseUrl, projectMetadata);
  }
  return runSingleTurn(scenario, projectId, baseUrl, projectMetadata);
}

// ── Single-Turn ──

async function runSingleTurn(
  scenario: EvalScenario,
  projectId: string,
  baseUrl: string,
  projectMetadata: ReturnType<typeof buildProjectMetadata>,
): Promise<Transcript> {
  const turnTranscripts: TurnTranscript[] = [];
  let totalToolCalls = 0;

  for (const turn of scenario.turns) {
    const body: Record<string, unknown> = {
      projectId,
      message: turn.content,
      projectMetadata,
    };
    if (turn.mentions) body.mentions = turn.mentions;

    const turnResult = await sendChat(baseUrl, body);
    totalToolCalls += turnResult.toolCalls.length;
    turnTranscripts.push(turnResult);
  }

  return {
    scenarioId: scenario.id,
    sessionId: null,
    turns: turnTranscripts,
    totalToolCalls,
  };
}

// ── Conversation ──

async function runConversation(
  scenario: EvalScenario,
  projectId: string,
  baseUrl: string,
  projectMetadata: ReturnType<typeof buildProjectMetadata>,
): Promise<Transcript> {
  const turnTranscripts: TurnTranscript[] = [];
  let totalToolCalls = 0;

  const responderCtx: ResponderContext = {
    cardIndex: 0,
    previousCards: [],
  };

  for (const turn of scenario.turns) {
    const body: Record<string, unknown> = {
      projectId,
      message: turn.content,
      projectMetadata,
    };
    if (turn.mentions) body.mentions = turn.mentions;

    const turnResult = await sendChatWithResponder(
      baseUrl,
      body,
      scenario.responder!,
      responderCtx,
    );
    totalToolCalls += turnResult.toolCalls.length;
    turnTranscripts.push(turnResult);
  }

  return {
    scenarioId: scenario.id,
    sessionId: null,
    turns: turnTranscripts,
    totalToolCalls,
  };
}

// ── Chat with auto-responder for UI cards ──

async function sendChatWithResponder(
  baseUrl: string,
  body: Record<string, unknown>,
  responder: NonNullable<EvalScenario['responder']>,
  responderCtx: ResponderContext,
): Promise<TurnTranscript> {
  const res = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error('No response body (SSE stream expected)');
  }

  const events: NarreStreamEvent[] = [];
  let assistantText = '';
  const toolCalls: ToolCallRecord[] = [];
  let currentTool: Partial<ToolCallRecord> | null = null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;

      let event: NarreStreamEvent;
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }

      events.push(event);

      switch (event.type) {
        case 'text':
          if (event.content) assistantText += event.content;
          break;
        case 'tool_start':
          currentTool = { tool: event.tool, input: event.toolInput ?? {} };
          break;
        case 'tool_end':
          if (currentTool) {
            toolCalls.push({
              tool: currentTool.tool!,
              input: currentTool.input!,
              result: event.toolResult,
            });
            currentTool = null;
          }
          break;
        case 'card': {
          const card = event.card;
          if (card && 'toolCallId' in card) {
            const response = responder(card, responderCtx);
            responderCtx.previousCards.push(card);
            responderCtx.cardIndex++;

            await fetch(`${baseUrl}/chat/respond`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toolCallId: card.toolCallId,
                response,
              }),
            });
          }
          break;
        }
        case 'error':
          assistantText += `\n[ERROR: ${event.error}]`;
          break;
        case 'done':
          break;
      }
    }
  }

  return { user: body.message as string, assistant: assistantText, toolCalls, events };
}

// ── Simple chat (single-turn, no responder) ──

async function sendChat(
  baseUrl: string,
  body: Record<string, unknown>,
): Promise<TurnTranscript> {
  const res = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error('No response body (SSE stream expected)');
  }

  const events: NarreStreamEvent[] = [];
  let assistantText = '';
  const toolCalls: ToolCallRecord[] = [];
  let currentTool: Partial<ToolCallRecord> | null = null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;

      let event: NarreStreamEvent;
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }

      events.push(event);

      switch (event.type) {
        case 'text':
          if (event.content) assistantText += event.content;
          break;
        case 'tool_start':
          currentTool = { tool: event.tool, input: event.toolInput ?? {} };
          break;
        case 'tool_end':
          if (currentTool) {
            toolCalls.push({
              tool: currentTool.tool!,
              input: currentTool.input!,
              result: event.toolResult,
            });
            currentTool = null;
          }
          break;
        case 'error':
          assistantText += `\n[ERROR: ${event.error}]`;
          break;
        case 'done':
          break;
      }
    }
  }

  return { user: body.message as string, assistant: assistantText, toolCalls, events };
}

// ── Helpers ──

function buildProjectMetadata(projectId: string) {
  const archetypes = listArchetypes(projectId).map((a) => ({
    name: a.name,
    icon: a.icon,
    color: a.color,
    node_shape: a.node_shape,
  }));

  const relationTypes = listRelationTypes(projectId).map((r) => ({
    name: r.name,
    directed: r.directed,
    line_style: r.line_style,
    color: r.color,
  }));

  const canvasTypes = listCanvasTypes(projectId).map((c) => ({
    name: c.name,
    description: c.description,
  }));

  return { projectName: projectId, archetypes, relationTypes, canvasTypes };
}
