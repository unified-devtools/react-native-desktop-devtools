/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        devBg: 'var(--color-bg)',
        devSurface: 'var(--color-surface)',
        devCard: 'var(--color-card)',
        devCardHover: 'var(--color-card-hover)',
        devBorder: 'var(--color-border)',
        devBorderSubtle: 'var(--color-border-subtle)',
        devText: 'var(--color-text)',
        devTextDim: 'var(--color-text-dim)',
        devTextMuted: 'var(--color-text-muted)',
        devHeaderBg: 'var(--color-header-bg)',
        devCodeBg: 'var(--color-code-bg)',
        devAccent: 'var(--color-accent)',
        devInputBg: 'var(--color-input-bg)',
      },
    },
  },
  plugins: [],
};
