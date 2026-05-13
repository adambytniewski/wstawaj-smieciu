import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background ladder
        bg: '#000000',
        surface: '#0e0e10',
        surface2: '#16161a',
        surface3: '#1f1f24',
        line: '#26262d',
        line2: '#33333a',
        // Text
        ink: '#fafafa',
        ink2: '#d4d4d8',
        muted: '#71717a',
        muted2: '#52525b',
        // Per-area accents
        accent: '#ff2d2d', // primary brutal red
        focus: '#ff2d2d',
        gym: '#ff8a00',
        sleep: '#7c5cff',
        code: '#22d3ee',
        coach: '#ff2d2d',
        good: '#34d399',
        warn: '#fbbf24',
        bad: '#ef4444',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['8.5rem', { lineHeight: '0.85', letterSpacing: '-0.04em' }],
        'display-lg': ['6rem', { lineHeight: '0.85', letterSpacing: '-0.03em' }],
        'display-md': ['4rem', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.4'/></svg>\")",
        'g-focus': 'radial-gradient(120% 120% at 0% 0%, #ff2d2d33 0%, transparent 55%)',
        'g-gym': 'radial-gradient(120% 120% at 100% 0%, #ff8a0033 0%, transparent 55%)',
        'g-sleep': 'radial-gradient(120% 120% at 0% 100%, #7c5cff33 0%, transparent 55%)',
        'g-code': 'radial-gradient(120% 120% at 100% 100%, #22d3ee33 0%, transparent 55%)',
        'g-coach': 'linear-gradient(135deg, #ff2d2d22 0%, transparent 50%, #7c5cff15 100%)',
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 4s linear infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'count-in': 'count-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-in': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
          '60%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'flicker': {
          '0%, 92%, 100%': { opacity: '1' },
          '93%': { opacity: '0.6' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.4' },
          '97%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      boxShadow: {
        'depth-1': '0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset',
        'depth-2': '0 8px 24px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset',
        'glow-red': '0 0 32px -4px rgba(255,45,45,0.5)',
        'glow-amber': '0 0 32px -4px rgba(255,138,0,0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config;
