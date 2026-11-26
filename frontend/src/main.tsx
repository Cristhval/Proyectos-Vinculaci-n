import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { COLOR_ESTADO } from './components/ui/IconoHalo'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* Toasts con el mismo lenguaje que los modales: tarjeta blanca, texto azul marino e ícono de color. */}
      <Toaster
        position="top-center"
        gutter={8}
        containerStyle={{ zIndex: 100000 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: COLOR_ESTADO.marino,
            border: '1px solid rgb(var(--rgb-borde))',
            borderRadius: '10px',
            boxShadow: '0 12px 32px -12px rgba(13, 22, 40, 0.25)',
            padding: '10px 14px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '420px',
            zIndex: 100000,
          },
          success: { iconTheme: { primary: COLOR_ESTADO.exito, secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: COLOR_ESTADO.error, secondary: '#FFFFFF' } },
          loading: { iconTheme: { primary: COLOR_ESTADO.marino, secondary: COLOR_ESTADO.pista } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
