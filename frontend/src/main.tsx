import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          success: {
            style: {
              background: '#F0FDF4',
              color: '#0F172A',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              fontSize: '14px',
            },
            iconTheme: {
              primary: '#16A34A',
              secondary: '#F0FDF4',
            },
          },
          error: {
            style: {
              background: '#FEF2F2',
              color: '#0F172A',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              fontSize: '14px',
            },
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FEF2F2',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
