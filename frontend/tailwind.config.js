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
      },
      colors: {
        bg: {
          DEFAULT: '#FFFFFF',
          soft: '#F8FAFC',
          muted: '#F1F5F9',
          hover: '#E2E8F0',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          light: '#94A3B8',
          deep: '#020617',
        },
        line: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
        },
        accent: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          light: '#EEF2FF',
          muted: '#A5B4FC',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          error: '#DC2626',
          info: '#2563EB',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#E11D48',
        },
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.03)',
        sm: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        card: '0 4px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03)',
        lg: '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)',
        glow: '0 0 20px rgba(79,70,229,0.15)',
      },
      borderRadius: {
        'card': '16px',
        'btn': '0px',
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
