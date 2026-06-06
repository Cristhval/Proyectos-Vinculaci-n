import { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const SIZE_MAP = {
  sm: '420px',
  md: '520px',
  lg: '640px',
  xl: '780px',
  '2xl': '960px',
}

export default function Modal({ open, onClose, title, subtitle, icon, children, footer, size = 'md' }: ModalProps) {
  const [visible, setVisible] = useState(false)
  const [animate, setAnimate] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    } else {
      setAnimate(false)
      const timer = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!visible) return null

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99999,
        background: `rgba(0, 0, 0, ${animate ? '0.5' : '0'})`,
        backdropFilter: animate ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: animate ? 'blur(4px)' : 'blur(0px)',
        transition: 'all 200ms ease',
      }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div
        className="bg-white flex flex-col"
        style={{
          width: '100%',
          maxWidth: SIZE_MAP[size],
          maxHeight: '85vh',
          borderRadius: '12px',
          boxShadow: animate
            ? '0 25px 50px -12px rgba(0,0,0,0.25), 0 12px 24px -8px rgba(0,0,0,0.12)'
            : '0 0 0 rgba(0,0,0,0)',
          transform: animate ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
          opacity: animate ? 1 : 0,
          transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          margin: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
