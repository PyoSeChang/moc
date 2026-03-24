import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-transparent text-secondary border-none cursor-pointer transition-all duration-fast hover:enabled:bg-surface-hover hover:enabled:text-default disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={label}
        title={label}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
