import React from 'react';

interface ResizeHandleProps {
  direction?: 'horizontal' | 'vertical';
  onMouseDown: (e: React.MouseEvent) => void;
}

export function ResizeHandle({ direction = 'horizontal', onMouseDown }: ResizeHandleProps): JSX.Element {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`relative z-10 shrink-0 ${isHorizontal ? 'cursor-col-resize' : 'cursor-row-resize'}`}
      style={
        isHorizontal
          ? { width: 1, marginLeft: -2, marginRight: -2, paddingLeft: 2, paddingRight: 2 }
          : { height: 1, marginTop: -2, marginBottom: -2, paddingTop: 2, paddingBottom: 2 }
      }
      onMouseDown={onMouseDown}
    >
      <div
        className={`pointer-events-none hover:bg-accent transition-colors ${
          isHorizontal
            ? 'h-full w-px border-l border-subtle'
            : 'w-full h-px border-t border-subtle'
        }`}
      />
    </div>
  );
}
