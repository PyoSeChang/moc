import Anthropic from '@anthropic-ai/sdk';
import type { NarreStreamEvent } from '@moc/shared/types';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;
const MAX_TOOL_ROUNDS = 25;

export async function* chat(params: {
  messages: Anthropic.MessageParam[];
  systemPrompt: string;
  tools: Anthropic.Tool[];
  onToolCall: (name: string, input: Record<string, unknown>) => Promise<string>;
}): AsyncGenerator<NarreStreamEvent> {
  const { systemPrompt, tools, onToolCall } = params;
  const messages = [...params.messages];

  const client = new Anthropic();

  let toolRound = 0;

  while (toolRound < MAX_TOOL_ROUNDS) {
    toolRound++;

    // Accumulate content blocks from this turn
    const contentBlocks: Anthropic.ContentBlock[] = [];
    let stopReason: string | null = null;

    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
        tools,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if (delta.type === 'text_delta') {
            yield { type: 'text', content: delta.text };
          }
          // input_json_delta is accumulated internally by the SDK
        } else if (event.type === 'content_block_stop') {
          // Retrieve the accumulated block from the snapshot
          const snapshot = await stream.finalMessage();
          if (snapshot && event.index < snapshot.content.length) {
            contentBlocks.push(snapshot.content[event.index]);
          }
        } else if (event.type === 'message_stop') {
          // final stop
        }
      }

      const finalMessage = await stream.finalMessage();
      stopReason = finalMessage.stop_reason;
      // Ensure we have all content blocks
      if (contentBlocks.length === 0 && finalMessage.content.length > 0) {
        contentBlocks.push(...finalMessage.content);
      }
    } catch (error) {
      yield { type: 'error', error: (error as Error).message };
      return;
    }

    // Check for tool use blocks
    const toolUseBlocks = contentBlocks.filter(
      (b): b is Anthropic.ContentBlockParam & { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
        b.type === 'tool_use',
    );

    if (toolUseBlocks.length === 0 || stopReason === 'end_turn') {
      // No tool calls or model finished - done
      yield { type: 'done' };
      return;
    }

    // Process tool calls
    // Add the assistant's response to message history
    messages.push({ role: 'assistant', content: contentBlocks as Anthropic.ContentBlockParam[] });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolBlock of toolUseBlocks) {
      const toolInput = toolBlock.input as Record<string, unknown>;
      yield { type: 'tool_start', tool: toolBlock.name, toolInput };

      try {
        const result = await onToolCall(toolBlock.name, toolInput);
        yield { type: 'tool_end', tool: toolBlock.name, toolResult: result };
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: result,
        });
      } catch (error) {
        const errMsg = (error as Error).message;
        yield { type: 'tool_end', tool: toolBlock.name, toolResult: `Error: ${errMsg}` };
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: `Error: ${errMsg}`,
          is_error: true,
        });
      }
    }

    // Add tool results and continue the loop
    messages.push({ role: 'user', content: toolResults });
  }

  // If we exhausted tool rounds
  yield { type: 'error', error: 'Maximum tool call rounds exceeded' };
}
