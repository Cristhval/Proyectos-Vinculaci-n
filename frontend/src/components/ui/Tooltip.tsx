import { useState, useRef, useEffect, type ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom'
  maxWidth?: number
  disabled?: boolean
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  maxWidth = 400,
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updateCoords = () => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    if (position === 'top') {
      setCoords({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    } else {
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }
  }

  const handleMouseEnter = () => {
    if (disabled || !content) return
    updateCoords()
    setVisible(true)
  }

  const handleMouseLeave = () => {
    setVisible(false)
  }

  useEffect(() => {
    if (!visible) return
    const handleScroll = () => setVisible(false)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [visible])

  return (
    <>
      <div
        ref={wrapperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex min-w-0 max-w-full"
      >
        {children}
      </div>
      {visible && coords && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: position === 'top' ? undefined : coords.top,
            bottom: position === 'top'
              ? window.innerHeight - coords.top + 8
              : undefined,
            left: coords.left,
            transform: 'translateX(-50%)',
            maxWidth,
            background: '#0A0A0A',
            color: '#FFFFFF',
            fontSize: '12px',
            lineHeight: 1.45,
            padding: '8px 12px',
            borderRadius: '4px',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            animation: 'tooltip-fade-in 0.15s ease-out',
          }}
        >
          {content}
          <style>{`
            @keyframes tooltip-fade-in {
              from { opacity: 0; transform: translateX(-50%) translateY(${position === 'top' ? '4px' : '-4px'}); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
