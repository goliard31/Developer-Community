import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // discourse.org 设计令牌（2026.11.23 采用，2026.11.23 起应用沿用紫色系）
        page: '#f9f8fc',
        ink: '#333638',
        muted: '#6b7280',
        primary: {
          DEFAULT: '#7b5fe2',
          hover: '#8b6df8',
        },
        link: '#503281',
        purple: {
          700: '#4a3574',
          800: '#33254f',
          900: '#3d2a63',
        },
        footer: {
          from: '#f9f8fc',
          to: '#e0d5ff',
          text: '#80719f',
        },
        accent: {
          blue: '#28abe2',
          green: '#4ba458',
          orange: '#f15c22',
          yellow: '#fff470',
          pink: '#ffd7fe',
        },
        line: '#e3daf1',
      },
      fontFamily: {
        display: ['var(--font-display)', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        md: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '1.75rem' }],
        '2xl': ['2rem', { lineHeight: '2.25rem' }],
        '3xl': ['2.5rem', { lineHeight: '2.75rem' }],
        '4xl': ['3rem', { lineHeight: '3.25rem' }],
        '5xl': ['3.75rem', { lineHeight: '4rem' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        round: '100em',
      },
      boxShadow: {
        card: '0 1px 4px rgba(25,33,61,.05)',
        strong: '0 1px 4px rgba(0,0,0,.08)',
        header: '0 4px 10px rgba(100,0,255,.06)',
      },
      maxWidth: {
        shell: '1290px',
        inner: '1148px',
      },
      screens: {
        tablet: '48em',
        desktop: '62em',
      },
      keyframes: {
        'hero-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'hero-float': 'hero-float 5s ease-in-out infinite',
        'fade-in': 'fade-in .4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
