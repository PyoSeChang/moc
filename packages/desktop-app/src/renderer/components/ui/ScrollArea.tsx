import React from 'react';

export interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className = '', style }) => {
  return (
    <div className={`overflow-y-auto overflow-x-hidden ${className}`} style={style}>
      {children}
    </div>
  );
};
