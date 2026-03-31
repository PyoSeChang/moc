import React from 'react';
import type { NarreMention, NarreToolCall } from '@moc/shared/types';
import { NarreToolLog } from './NarreToolLog';

interface NarreMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  mentions?: NarreMention[];
  toolCalls?: NarreToolCall[];
  isStreaming?: boolean;
}

export function NarreMessageBubble({
  role,
  content,
  toolCalls,
  isStreaming = false,
}: NarreMessageBubbleProps): JSX.Element {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] rounded-xl px-3 py-2 text-sm',
          isUser
            ? 'bg-[var(--accent)]/10 text-default'
            : 'bg-surface-card text-default',
        ].join(' ')}
      >
        {content && (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        )}
        {isStreaming && !content && (
          <div className="text-muted text-xs animate-pulse">...</div>
        )}
        {toolCalls && toolCalls.length > 0 && (
          <NarreToolLog calls={toolCalls} defaultExpanded={isStreaming} />
        )}
      </div>
    </div>
  );
}
