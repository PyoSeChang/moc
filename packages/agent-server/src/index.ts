import express from 'express';
import cors from 'cors';
import type Anthropic from '@anthropic-ai/sdk';
import type { NarreMessage, NarreMention, NarreToolCall, NarreStreamEvent } from '@moc/shared/types';
import * as core from '@moc/core';
import { chat } from './agent.js';
import { buildSystemPrompt } from './system-prompt.js';
import { getAnthropicTools } from './tools.js';
import { executeTool } from './tool-executor.js';
import { SessionStore } from './session-store.js';
import { initSSE, sendSSEEvent, endSSE } from './streaming.js';

const PORT = parseInt(process.env.PORT ?? '3100', 10);
const MOC_DATA_DIR = process.env.MOC_DATA_DIR;
const MOC_DB_PATH = process.env.MOC_DB_PATH;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

if (!MOC_DATA_DIR) {
  console.error('Error: MOC_DATA_DIR environment variable is required');
  process.exit(1);
}

if (!MOC_DB_PATH) {
  console.error('Error: MOC_DB_PATH environment variable is required');
  process.exit(1);
}

// Initialize the database with the exact path provided by the launcher
core.initDatabase(MOC_DB_PATH);

const sessionStore = new SessionStore(MOC_DATA_DIR);
const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Session endpoints ──
app.get('/sessions', async (req, res) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    res.status(400).json({ error: 'projectId query parameter is required' });
    return;
  }
  try {
    const sessions = await sessionStore.listSessions(projectId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/sessions', async (req, res) => {
  const { projectId } = req.body as { projectId?: string };
  if (!projectId) {
    res.status(400).json({ error: 'projectId is required in request body' });
    return;
  }
  try {
    const session = await sessionStore.createSession(projectId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/sessions/:id', async (req, res) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    res.status(400).json({ error: 'projectId query parameter is required' });
    return;
  }
  try {
    const result = await sessionStore.getSession(req.params.id, projectId);
    if (!result) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/sessions/:id', async (req, res) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    res.status(400).json({ error: 'projectId query parameter is required' });
    return;
  }
  try {
    const deleted = await sessionStore.deleteSession(req.params.id, projectId);
    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ── Chat endpoint (SSE) ──
app.post('/chat', async (req, res) => {
  const { sessionId, projectId, message, mentions } = req.body as {
    sessionId?: string;
    projectId: string;
    message: string;
    mentions?: NarreMention[];
  };

  if (!projectId || !message) {
    res.status(400).json({ error: 'projectId and message are required' });
    return;
  }

  try {
    // 1. Resolve or create session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const newSession = await sessionStore.createSession(projectId, message.slice(0, 60));
      activeSessionId = newSession.id;
    }

    // Send sessionId as the first SSE event so the client knows which session this belongs to
    initSSE(res);
    sendSSEEvent(res, { type: 'text', content: '' } as NarreStreamEvent & { sessionId: string });

    // 2. Build system prompt with live metadata
    const project = core.getProjectById(projectId);
    if (!project) {
      sendSSEEvent(res, { type: 'error', error: `Project not found: ${projectId}` });
      endSSE(res);
      return;
    }

    const archetypes = core.listArchetypes(projectId);
    const relationTypes = core.listRelationTypes(projectId);
    const canvasTypes = core.listCanvasTypes(projectId);

    const systemPrompt = buildSystemPrompt({
      projectName: project.name,
      archetypes: archetypes.map((a) => ({
        name: a.name,
        icon: a.icon,
        color: a.color,
        node_shape: a.node_shape,
      })),
      relationTypes: relationTypes.map((r) => ({
        name: r.name,
        directed: r.directed,
        line_style: r.line_style,
        color: r.color,
      })),
      canvasTypes: canvasTypes.map((c) => ({
        name: c.name,
        description: c.description,
      })),
    });

    // 3. Convert mentions to inline format
    let processedMessage = message;
    if (mentions && mentions.length > 0) {
      for (const mention of mentions) {
        const tag = buildMentionTag(mention);
        // Replace the display text with the tagged version if it appears in the message
        if (mention.display && processedMessage.includes(mention.display)) {
          processedMessage = processedMessage.replace(mention.display, tag);
        } else {
          // Append mention context at the end
          processedMessage += `\n${tag}`;
        }
      }
    }

    // 4. Build Anthropic messages from session history + new message
    const sessionData = await sessionStore.getSession(activeSessionId, projectId);
    const anthropicMessages = buildAnthropicMessages(sessionData?.messages ?? [], processedMessage);

    // 5. Save user message to session
    const userMessage: NarreMessage = {
      role: 'user',
      content: message,
      mentions: mentions,
      timestamp: new Date().toISOString(),
    };
    await sessionStore.appendMessage(activeSessionId, projectId, userMessage);

    // 6. Stream the agent response
    const tools = getAnthropicTools();
    let assistantText = '';
    const toolCalls: NarreToolCall[] = [];

    const generator = chat({
      messages: anthropicMessages,
      systemPrompt,
      tools,
      onToolCall: async (name, input) => {
        return executeTool(name, input);
      },
    });

    for await (const event of generator) {
      sendSSEEvent(res, event);

      // Accumulate for session storage
      switch (event.type) {
        case 'text':
          assistantText += event.content ?? '';
          break;
        case 'tool_start':
          toolCalls.push({
            tool: event.tool!,
            input: event.toolInput ?? {},
            status: 'running',
          });
          break;
        case 'tool_end': {
          const tc = toolCalls.find(
            (t) => t.tool === event.tool && t.status === 'running',
          );
          if (tc) {
            tc.status = event.toolResult?.startsWith('Error') ? 'error' : 'success';
            tc.result = event.toolResult;
          }
          break;
        }
        case 'error':
          // Errors are streamed to client, logged here
          console.error('Chat error:', event.error);
          break;
      }
    }

    // 7. Save assistant message to session
    if (assistantText || toolCalls.length > 0) {
      const assistantMessage: NarreMessage = {
        role: 'assistant',
        content: assistantText,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: new Date().toISOString(),
      };
      await sessionStore.appendMessage(activeSessionId, projectId, assistantMessage);
    }

    endSSE(res);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    // If headers already sent (SSE started), try to send error event
    if (res.headersSent) {
      sendSSEEvent(res, { type: 'error', error: (error as Error).message });
      endSSE(res);
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

/**
 * Build a mention tag string from a NarreMention.
 */
function buildMentionTag(mention: NarreMention): string {
  switch (mention.type) {
    case 'concept':
      return `[concept:id=${mention.id}, title="${mention.display}"]`;
    case 'canvas':
      return `[canvas:id=${mention.id}, name="${mention.display}"]`;
    case 'edge':
      return `[edge:id=${mention.id}]`;
    case 'archetype':
      return `[archetype:id=${mention.id}, name="${mention.display}"]`;
    case 'relationType':
      return `[relationType:id=${mention.id}, name="${mention.display}"]`;
    case 'canvasType':
      return `[canvasType:id=${mention.id}, name="${mention.display}"]`;
    case 'module':
      return `[module:path="${mention.path}"]`;
    case 'file':
      return `[file:path="${mention.path}"]`;
    default:
      return mention.display;
  }
}

/**
 * Convert NarreMessage history + new message into Anthropic message format.
 */
function buildAnthropicMessages(
  history: NarreMessage[],
  newUserMessage: string,
): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];

  for (const msg of history) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      messages.push({ role: 'assistant', content: msg.content });
    }
  }

  messages.push({ role: 'user', content: newUserMessage });
  return messages;
}

// ── Start server ──
app.listen(PORT, () => {
  console.log(`Narre agent-server listening on port ${PORT}`);
  console.log(`Data directory: ${MOC_DATA_DIR}`);
});

export type { };
