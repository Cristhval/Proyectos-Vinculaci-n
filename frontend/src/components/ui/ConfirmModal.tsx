import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmModalProps {
  isOpen: boolean
  titulo: string
  mensaje: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ isOpen, titulo, mensaje, onConfirm, onCancel }: ConfirmModalProps) {
  const [visible, setVisible] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    } else {
      setAnimate(false)
      const timer = setTimeout(() => setVisible(false), 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!visible) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99999,
        background: `rgba(0, 0, 0, ${animate ? '0.5' : '0'})`,
        backdropFilter: animate ? 'blur(6px)' : 'blur(0px)',
        WebkitBackdropFilter: animate ? 'blur(6px)' : 'blur(0px)',
        transition: 'all 250ms ease',
      }}
      onClick={onCancel}
    >
      <div
        className="bg-white flex flex-col items-center"
        style={{
          width: '340px',
          borderRadius: '0px',
          padding: '36px 28px 28px',
          boxShadow: animate
            ? '0 32px 64px -12px rgba(0,0,0,0.25), 0 12px 24px -8px rgba(0,0,0,0.1)'
            : '0 0 0 rgba(0,0,0,0)',
          transform: animate ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(12px)',
          opacity: animate ? 1 : 0,
          transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: '#fff',
            border: '2.5px solid #C7873A',
            marginBottom: '22px',
            transform: animate ? 'scale(1)' : 'scale(0.5)',
            transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#C7873A',
              lineHeight: 1,
              opacity: animate ? 1 : 0,
              transition: 'opacity 300ms ease 150ms',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            !
          </span>
        </div>

        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1A1A2E',
            margin: '0 0 8px 0',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 300ms ease 100ms',
          }}
        >
          {titulo}
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: '#7A7A8E',
            margin: '0 0 28px 0',
            textAlign: 'center',
            lineHeight: '1.6',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 300ms ease 150ms',
          }}
        >
          {mensaje}
        </p>

        <div
          style={{
            width: '80%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #E8E8ED, transparent)',
            marginBottom: '24px',
            opacity: animate ? 1 : 0,
            transition: 'opacity 300ms ease 200ms',
          }}
        />

        <div
          className="flex items-center justify-center gap-3"
          style={{
            width: '100%',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 300ms ease 200ms',
          }}
        >
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #059669 0%, #047857 100%)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1)'
            }}
          >
            Sí
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'linear-gradient(180deg, #E8DDD3 0%, #D4C5B5 100%)',
              color: '#5C4A3A',
              border: 'none',
              borderRadius: '0px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              boxShadow: '0 2px 8px rgba(92, 74, 58, 0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #D4C5B5 0%, #C4B3A0 100%)'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(92, 74, 58, 0.18), inset 0 1px 0 rgba(255,255,255,0.4)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #E8DDD3 0%, #D4C5B5 100%)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(92, 74, 58, 0.12), inset 0 1px 0 rgba(255,255,255,0.4)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1)'
            }}
          >
            No
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
