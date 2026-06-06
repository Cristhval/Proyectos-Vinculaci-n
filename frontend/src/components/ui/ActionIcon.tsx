import { useState } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface ActionIconProps {
  icon: 'ver' | 'editar' | 'eliminar'
  enabled: boolean
  onClick?: () => void
  tooltipActivo: string
  tooltipDeshabilitado: string
}

const ICONS: Record<string, ReactNode> = {
  ver: <Eye size={16} />,
  editar: <Pencil size={16} />,
  eliminar: <Trash2 size={16} />,
}

const COLORS: Record<string, string> = {
  ver: 'text-[#2563EB] hover:bg-[#EFF6FF]',
  editar: 'text-[#16A34A] hover:bg-[#F0FDF4]',
  eliminar: 'text-[#DC2626] hover:bg-[#FEF2F2]',
}

export default function ActionIcon({ icon, enabled, onClick, tooltipActivo, tooltipDeshabilitado }: ActionIconProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-flex">
      <button
        onClick={enabled ? onClick : undefined}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!enabled}
        className={`p-1.5 transition-colors duration-150 ${
          enabled
            ? `${COLORS[icon]} cursor-pointer`
            : 'text-[#9CA3AF] cursor-not-allowed opacity-50'
        }`}
      >
        {ICONS[icon]}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] text-white whitespace-nowrap z-50 animate-fade-in"
          style={{ backgroundColor: '#0A0A0A', borderRadius: '4px' }}
        >
          {enabled ? tooltipActivo : tooltipDeshabilitado}
        </div>
      )}
    </div>
  )
}
