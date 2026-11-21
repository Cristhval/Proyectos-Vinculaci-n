import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Agrupa dependencias en chunks con nombre propio:
 * - `react`: base de toda la app; cambia poco, así que el navegador la conserva entre despliegues.
 *   Incluye prop-types/react-is, que comparten reCAPTCHA y los gráficos: si no, Rollup los mete
 *   en `graficos` y el login descargaría apexcharts.
 * - `graficos`, `pdf`, `xlsx`, `fechas`: solo se descargan en las pantallas que los usan
 *   (antes apexcharts y jsPDF iban juntos en un único chunk de 1 MB).
 * Los íconos (lucide-react) no se agrupan: así cada pantalla descarga solo los suyos y Vite
 * los precarga en paralelo junto con la pantalla.
 */
const GRUPOS: [string, RegExp][] = [
  ['react', /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run|prop-types|react-is)[\\/]/],
  ['graficos', /[\\/]node_modules[\\/](apexcharts|react-apexcharts)[\\/]/],
  ['pdf', /[\\/]node_modules[\\/](jspdf|jspdf-autotable|fflate|fast-png|iobuffer|pako|html2canvas|canvg|dompurify|core-js|stackblur-canvas|svg-pathdata|rgbcolor|raf|performance-now|css-line-break|text-segmentation|base64-arraybuffer|utrie)[\\/]/],
  ['xlsx', /[\\/]node_modules[\\/]xlsx[\\/]/],
  ['fechas', /[\\/]node_modules[\\/]date-fns[\\/]/],
]

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Ayudantes internos de Vite/Rollup que usan casi todos los chunks: si no se fijan,
          // Rollup los mete en un chunk diferido (p. ej. `pdf`) y la página inicial lo descarga.
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'react'
          return GRUPOS.find(([, patron]) => patron.test(id))?.[0]
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
