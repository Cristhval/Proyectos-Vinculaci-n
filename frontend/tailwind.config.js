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
          soft: 'rgb(var(--rgb-fondo) / <alpha-value>)',
          muted: 'rgb(var(--rgb-apoyo) / <alpha-value>)',
          hover: '#DDE6F1',
        },
        /* Azul marino institucional: navegación, estructura, títulos y acciones institucionales. */
        ink: {
          DEFAULT: 'rgb(var(--rgb-marino) / <alpha-value>)',
          muted: 'rgb(var(--rgb-texto-2) / <alpha-value>)',
          light: '#94A3B8',
          deep: '#0D1628',
          2: 'rgb(var(--rgb-marino-2) / <alpha-value>)',
          texto: 'rgb(var(--rgb-texto) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--rgb-borde) / <alpha-value>)',
          strong: '#CBD5E1',
        },
        /* Identidad del panel (estilo "Ignition"): naranja de acento y superficies azuladas. */
        /* Naranja institucional: acciones principales, elemento activo y detalles importantes. */
        naranja: {
          DEFAULT: 'rgb(var(--rgb-naranja) / <alpha-value>)',
          hover: '#CF4A2E',
          rojo: '#E5432E',
          suave: '#FCEDE8',
        },
        panel: {
          fondo: 'rgb(var(--rgb-fondo) / <alpha-value>)',
          banda: 'rgb(var(--rgb-apoyo) / <alpha-value>)',
          alterno: 'rgb(var(--rgb-alterno) / <alpha-value>)',
          borde: 'rgb(var(--rgb-borde) / <alpha-value>)',
        },
        /* "accent" se usaba en varios módulos como color de acción: ahora es el naranja. */
        accent: {
          DEFAULT: 'rgb(var(--rgb-naranja) / <alpha-value>)',
          hover: '#CF4A2E',
          light: '#FCEDE8',
          muted: '#FBC3AE',
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
        /* "indigo" se usaba como color decorativo en los módulos: pasa a tonos del azul institucional. */
        indigo: {
          50: '#EAF0F8',
          100: '#DCE6F2',
          200: '#C5D3E6',
          500: '#2E4A72',
          600: '#14213A',
          700: '#0D1628',
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
        card: '0 1px 2px rgba(20,33,58,0.06), 0 1px 1px rgba(20,33,58,0.03)',
        /* Niveles de elevación: superficie, tarjeta destacada y elemento flotante */
        'nivel-1': '0 1px 2px rgba(20,33,58,0.06), 0 1px 1px rgba(20,33,58,0.03)',
        'nivel-2': '0 6px 16px -4px rgba(20,33,58,0.12), 0 2px 4px rgba(20,33,58,0.05)',
        'nivel-3': '0 24px 48px -16px rgba(20,33,58,0.40), 0 8px 16px -8px rgba(20,33,58,0.20)',
        'card-hover': '0 4px 12px rgba(20,33,58,0.08)',
        md: '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03)',
        lg: '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)',
        glow: '0 0 0 3px rgba(244,107,60,0.15)',
        /* Neumorphism — construidas con los tokens de color existentes:
           ink-light (#94A3B8 -> rgb(148,163,184)) para la sombra oscura,
           blanco (#FFFFFF) para la luz, e ink-deep (#020617) para superficies oscuras. */
        neu: '8px 8px 16px rgba(148,163,184,0.35), -8px -8px 16px rgba(255,255,255,0.9)',
        'neu-sm': '4px 4px 10px rgba(148,163,184,0.3), -4px -4px 10px rgba(255,255,255,0.85)',
        'neu-lg': '12px 12px 28px rgba(148,163,184,0.35), -12px -12px 28px rgba(255,255,255,0.9)',
        'neu-inset': 'inset 4px 4px 10px rgba(148,163,184,0.35), inset -4px -4px 10px rgba(255,255,255,0.85)',
        'neu-inset-sm': 'inset 2px 2px 6px rgba(148,163,184,0.3), inset -2px -2px 6px rgba(255,255,255,0.8)',
        'neu-dark': '6px 6px 14px rgba(2,6,23,0.5), -3px -3px 10px rgba(148,163,184,0.08)',
        'neu-dark-hover': '8px 8px 18px rgba(2,6,23,0.55), -4px -4px 12px rgba(148,163,184,0.1)',
        'neu-dark-inset': 'inset 4px 4px 10px rgba(2,6,23,0.6), inset -3px -3px 8px rgba(148,163,184,0.06)',
        'neu-header': '0 6px 16px rgba(148,163,184,0.25), 0 1px 0 rgba(255,255,255,0.7) inset',
      },
      borderRadius: {
        'card': '10px',
        /* Radio único de botones y campos del sistema. */
        'btn': '8px',
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        'bounce-single': 'bounce-single 0.5s ease-out',
        /* OperationStatusModal: el ícono entra con fundido y escala 0,9 → 1 (200 ms). */
        'icono-entrada': 'icono-entrada 200ms ease-out both',
        /* Rueda de "procesando": giro suave de 0,9 s; con movimiento reducido, más lento. */
        'giro-suave': 'spin 0.9s linear infinite',
        'giro-lento': 'spin 2.4s linear infinite',
      },
      keyframes: {
        'icono-entrada': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-single': {
          '0%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-7px)' },
          '50%': { transform: 'translateY(-3px)' },
          '70%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
