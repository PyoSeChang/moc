export interface TerminalAppearanceSnapshot {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  padding: string;
  minimumContrastRatio: number;
  cursorBlink: boolean;
  webGLRenderer: boolean;
  colors: {
    background: string;
    foreground: string;
    muted: string;
    border: string;
    accent: string;
    accentHover: string;
    selection: string;
    inactiveSelection: string;
    scrollbar: string;
    scrollbarHover: string;
    scrollbarActive: string;
    findMatchBackground: string;
    findMatchHighlightBackground: string;
    findMatchBorder: string;
    findMatchHighlightBorder: string;
  };
}

const terminalAppearanceListeners = new Set<(snapshot: TerminalAppearanceSnapshot) => void>();

const DEFAULT_FONT_SIZE = 12;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 28;
const TERMINAL_FONT_FAMILY = `Menlo, "DejaVu Sans Mono", Consolas, "Lucida Console", monospace`;
const TERMINAL_LINE_HEIGHT = 1;
const TERMINAL_LETTER_SPACING = 0;
const TERMINAL_PADDING = '12px 14px';
const TERMINAL_MINIMUM_CONTRAST_RATIO = 1;

let currentFontSize = DEFAULT_FONT_SIZE;
let themeObserver: MutationObserver | null = null;
let cachedAppearanceSnapshot: TerminalAppearanceSnapshot | null = null;

function getCssColorAsHex(property: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  if (!raw) return fallback;
  if (raw.startsWith('#')) return raw;

  const el = document.createElement('div');
  el.style.color = raw;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return fallback;

  const [, r, g, b] = match;
  return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`;
}

function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}

function buildTerminalAppearanceSnapshot(): TerminalAppearanceSnapshot {
  const isDark = document.documentElement.getAttribute('data-mode') !== 'light';
  const background = getCssColorAsHex('--surface-editor', isDark ? '#242424' : '#f5f5f5');
  const foreground = getCssColorAsHex('--text-default', isDark ? '#d4d4d4' : '#1f2328');
  const muted = getCssColorAsHex('--text-muted', isDark ? '#8b949e' : '#6b7280');
  const border = getCssColorAsHex('--border-default', isDark ? '#30363d' : '#d0d7de');
  const accent = getCssColorAsHex('--accent', isDark ? '#2f81f7' : '#0969da');
  const accentHover = getCssColorAsHex('--accent-hover', accent);
  const selection = withAlpha(accent, isDark ? '33' : '22');
  const inactiveSelection = withAlpha(muted, isDark ? '2e' : '1f');
  const scrollbar = withAlpha(border, isDark ? '44' : '33');
  const scrollbarHover = withAlpha(muted, isDark ? '66' : '55');
  const scrollbarActive = withAlpha(accentHover, isDark ? '88' : '77');

  return {
    fontFamily: TERMINAL_FONT_FAMILY,
    fontSize: currentFontSize,
    lineHeight: TERMINAL_LINE_HEIGHT,
    letterSpacing: TERMINAL_LETTER_SPACING,
    padding: TERMINAL_PADDING,
    minimumContrastRatio: TERMINAL_MINIMUM_CONTRAST_RATIO,
    cursorBlink: false,
    webGLRenderer: false,
    colors: {
      background,
      foreground,
      muted,
      border,
      accent,
      accentHover,
      selection,
      inactiveSelection,
      scrollbar,
      scrollbarHover,
      scrollbarActive,
      findMatchBackground: withAlpha(accent, isDark ? '44' : '33'),
      findMatchHighlightBackground: withAlpha(accent, isDark ? '22' : '18'),
      findMatchBorder: accent,
      findMatchHighlightBorder: withAlpha(accent, isDark ? '66' : '44'),
    },
  };
}

function emitAppearanceChanged(): void {
  const snapshot = getTerminalAppearanceSnapshot();
  for (const listener of terminalAppearanceListeners) {
    listener(snapshot);
  }
}

function ensureTerminalThemeObserver(): void {
  if (themeObserver || typeof document === 'undefined') return;

  themeObserver = new MutationObserver(() => {
    cachedAppearanceSnapshot = null;
    emitAppearanceChanged();
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-mode', 'data-concept', 'data-theme-variant', 'style'],
  });
}

export function getTerminalAppearanceSnapshot(): TerminalAppearanceSnapshot {
  ensureTerminalThemeObserver();
  cachedAppearanceSnapshot ??= buildTerminalAppearanceSnapshot();
  return cachedAppearanceSnapshot;
}

export function onTerminalAppearanceChanged(
  listener: (snapshot: TerminalAppearanceSnapshot) => void,
): { dispose(): void } {
  ensureTerminalThemeObserver();
  terminalAppearanceListeners.add(listener);
  return {
    dispose(): void {
      terminalAppearanceListeners.delete(listener);
    },
  };
}

export function adjustTerminalFontSize(delta: number): void {
  currentFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, currentFontSize + delta));
  cachedAppearanceSnapshot = null;
  emitAppearanceChanged();
}

export function resetTerminalFontSize(): void {
  currentFontSize = DEFAULT_FONT_SIZE;
  cachedAppearanceSnapshot = null;
  emitAppearanceChanged();
}
