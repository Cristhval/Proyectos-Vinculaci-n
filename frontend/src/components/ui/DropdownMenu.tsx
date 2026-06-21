import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface DropdownMenuItem {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  tooltip?: string
  divider?: boolean
}

export type { DropdownMenuItem }

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownMenuItem[]
  align?: 'start' | 'end'
  className?: string
  menuClassName?: string
}

export default function DropdownMenu({
  trigger,
  items,
  align = 'end',
  className,
  menuClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return
    setOpen(false)
    item.onClick()
  }

  return (
    <div ref={containerRef} className={clsx('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={clsx(
            'absolute z-50 mt-2 min-w-[200px] bg-white rounded-none border border-[#E2E8F0] p-1 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18),0_2px_8px_-2px_rgba(15,23,42,0.06)] animate-fade-in',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {items.map((item) => {
            if (item.divider) {
              return <div key={item.key} className="my-1 h-px bg-[#E2E8F0]" role="separator" />
            }
            const showTooltip = hoveredKey === item.key && !!item.tooltip && !item.disabled
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={clsx(
                    'w-full flex items-center gap-2.5 rounded-none px-2.5 py-2 text-[13px] font-medium transition-colors text-left',
                    item.disabled
                      ? 'text-[#94A3B8] cursor-not-allowed'
                      : item.destructive
                        ? 'text-[#DC2626] hover:bg-[#FEF2F2]'
                        : 'text-[#0F172A] hover:bg-[#F1F5F9]',
                  )}
                >
                  {item.icon && (
                    <span className={clsx('shrink-0', item.disabled ? 'text-[#CBD5E1]' : item.destructive ? 'text-[#DC2626]' : 'text-[#64748B]')}>
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
                {showTooltip && (
                  <div
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap rounded-none pointer-events-none z-[60]"
                    style={{ backgroundColor: '#0F172A', boxShadow: '0 4px 12px rgba(15,23,42,0.25)' }}
                  >
                    {item.tooltip}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
