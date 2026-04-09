import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

interface AnchorPosition {
  top: number;
  left: number;
  width: number;
  ready: boolean;
}

interface AnchorPositionOptions {
  estimatedHeight?: number;
  minWidth?: number;
  gap?: number;
}

export function useAnchoredDropdown<T extends HTMLElement>(
  open: boolean,
  anchorRef: React.RefObject<T>,
  options: AnchorPositionOptions,
  dropdownRef?: React.RefObject<HTMLElement>,
): AnchorPosition {
  const { minWidth = 0, gap = 4 } = options;
  const [position, setPosition] = useState<AnchorPosition>({
    top: 0,
    left: 0,
    width: minWidth,
    ready: false,
  });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const nextPosition = {
      top: rect.bottom + gap,
      left: rect.left,
      width: Math.max(rect.width, minWidth),
      ready: true,
    };

    setPosition((current) => (
      current.top === nextPosition.top
        && current.left === nextPosition.left
        && current.width === nextPosition.width
        && current.ready === nextPosition.ready
        ? current
        : nextPosition
    ));
  }, [anchorRef, gap, minWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frameId);
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) return;
    setPosition((current) => (
      current.ready
        ? { ...current, ready: false }
        : current
    ));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const dropdown = dropdownRef?.current;
    const resizeObserver = dropdown ? new ResizeObserver(updatePosition) : null;
    if (dropdown) resizeObserver?.observe(dropdown);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [dropdownRef, open, updatePosition]);

  return position;
}
