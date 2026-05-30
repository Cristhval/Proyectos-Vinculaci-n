import { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={clsx('relative bg-white border border-line shadow-lg w-full mx-4', sizeStyles[size])}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h2 className="text-sm font-medium text-ink">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-bg-soft transition-colors">
            <X size={16} className="text-ink-muted" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
