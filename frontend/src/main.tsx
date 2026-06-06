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
              background: '#16A34A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
            },
            iconTheme: {
              primary: '#FFFFFF',
              secondary: '#16A34A',
            },
          },
          error: {
            style: {
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
            },
            iconTheme: {
              primary: '#FFFFFF',
              secondary: '#DC2626',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
