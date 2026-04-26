/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          chrome: 'var(--surface-chrome)',
          rail: 'var(--surface-rail)',
          canvas: 'var(--surface-canvas)',
          editor: 'var(--surface-editor)',
          panel: 'var(--surface-panel)',
          card: 'var(--surface-card)',
          floating: 'var(--surface-floating)',
          input: 'var(--surface-input)',
          overlay: 'var(--surface-overlay)',
        },
        state: {
          hover: 'var(--state-hover-bg)',
          selected: 'var(--state-selected-bg)',
          muted: 'var(--state-muted-bg)',
          drop: 'var(--state-drop-bg)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      textColor: {
        default: 'var(--text-default)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        'on-accent': 'var(--text-on-accent)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
        DEFAULT: 'var(--border-default)',
        default: 'var(--border-default)',
        strong: 'var(--border-strong)',
        input: 'var(--input-border)',
      },
      ringColor: {
        accent: {
          DEFAULT: 'var(--accent)',
          ring: 'var(--accent-ring)',
        },
      },
      backgroundColor: {
        'on-accent': 'var(--text-on-accent)',
      },
      boxShadow: {
        'primary-sm': 'var(--shadow-primary-sm)',
        'primary-md': 'var(--shadow-primary-md)',
        'primary-lg': 'var(--shadow-primary-lg)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};
