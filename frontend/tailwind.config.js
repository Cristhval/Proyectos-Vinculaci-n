/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Fraunces"', 'Inter', 'serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#FFFFFF',
          soft: '#F8F8F8',
        },
        ink: {
          DEFAULT: '#111111',
          muted: '#6B7280',
          deep: '#0F0F0F',
        },
        line: '#D1D5DB',
        primary: {
          50: '#F8F8F8',
          100: '#EFEFEF',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#374151',
          600: '#1F2937',
          700: '#111827',
          800: '#0F0F0F',
          900: '#000000',
          950: '#000000',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(17, 17, 17, 0.04), 0 4px 12px rgba(17, 17, 17, 0.04)',
        elev: '0 8px 32px rgba(17, 17, 17, 0.08)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
