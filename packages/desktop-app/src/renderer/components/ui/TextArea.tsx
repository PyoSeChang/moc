import React from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, className = '', ...props }, ref) => {
    const baseStyle = 'block w-full min-h-[80px] px-3 py-2.5 text-sm text-default bg-input border border-input rounded-lg outline-none resize-y transition-all duration-fast placeholder:text-muted hover:border-strong focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';
    const errorStyle = 'border-status-error';

    const cls = [baseStyle, error ? errorStyle : '', className].filter(Boolean).join(' ');

    return <textarea ref={ref} className={cls} {...props} />;
  }
);

TextArea.displayName = 'TextArea';
