/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Jenipapo — azul-escuro quase preto
        jenipapo: {
          950: '#070F15', 900: '#0C1922', 800: '#12242F', 700: '#1A3140', 600: '#264252', 500: '#3A5868', 400: '#5F7C8B', 300: '#8FA7B3',
        },
        // Urucum — terracota
        urucum: {
          50: '#FBEFE9', 100: '#F6DACB', 200: '#ECB396', 300: '#E08C64', 400: '#D46C41', 500: '#C2512E', 600: '#A23F22', 700: '#80311C', 800: '#5E2516',
        },
        // Verde floresta
        floresta: {
          50: '#ECF5EF', 100: '#D3E8DA', 200: '#A6D1B5', 300: '#6FB38A', 400: '#3F9465', 500: '#2A7A50', 600: '#1F6141', 700: '#184C34', 800: '#123827',
        },
        // Palha / areia
        palha: {
          50: '#FCF9F3', 100: '#F6F0E4', 200: '#EDE3CF', 300: '#DFCFAF', 400: '#C9B286', 500: '#A8905F',
        },
        prio: {
          baixa: '#2F9E5B', media: '#E2B126', alta: '#E8742A', critica: '#DC3535',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(12,25,34,0.04), 0 8px 24px -12px rgba(12,25,34,0.18)',
        glow: '0 0 0 1px rgba(194,81,46,0.35), 0 0 24px rgba(194,81,46,0.35)',
      },
      keyframes: {
        ping2: { '0%': { transform: 'scale(1)', opacity: '0.7' }, '100%': { transform: 'scale(2.6)', opacity: '0' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        ping2: 'ping2 1.8s cubic-bezier(0,0,0.2,1) infinite',
        blink: 'blink 1s step-end infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
