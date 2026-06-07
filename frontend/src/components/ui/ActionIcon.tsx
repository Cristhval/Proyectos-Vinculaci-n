import { useState } from 'react'
import { Eye, Pencil, Trash2, KeyRound } from 'lucide-react'
import type { ReactNode } from 'react'

type ActionIconVariant = 'ver' | 'editar' | 'eliminar' | 'clave'

interface ActionIconProps {
  icon: ActionIconVariant
  enabled: boolean
  onClick?: () => void
  tooltipActivo: string
  tooltipDeshabilitado: string
}

const ICONS: Record<ActionIconVariant, ReactNode> = {
  ver: <Eye size={15} strokeWidth={2.25} />,
  editar: <Pencil size={15} strokeWidth={2.25} />,
  eliminar: <Trash2 size={15} strokeWidth={2.25} />,
  clave: <KeyRound size={15} strokeWidth={2.25} />,
}

const COLORS: Record<ActionIconVariant, string> = {
  ver: 'text-[#2563EB] hover:bg-[#EFF6FF]',
  editar: 'text-[#16A34A] hover:bg-[#F0FDF4]',
  eliminar: 'text-[#DC2626] hover:bg-[#FEF2F2]',
  clave: 'text-[#D97706] hover:bg-[#FFFBEB]',
}

const SIZES = 'h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors duration-150'

export default function ActionIcon({ icon, enabled, onClick, tooltipActivo, tooltipDeshabilitado }: ActionIconProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-flex">
      <button
        onClick={enabled ? onClick : undefined}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!enabled}
        className={`${SIZES} ${
          enabled
            ? `${COLORS[icon]} cursor-pointer`
            : 'text-[#9CA3AF] cursor-not-allowed opacity-50'
        }`}
      >
        {ICONS[icon]}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] font-medium text-white whitespace-nowrap z-50 animate-fade-in"
          style={{ backgroundColor: '#0A0A0A', borderRadius: '6px' }}
        >
          {enabled ? tooltipActivo : tooltipDeshabilitado}
        </div>
      )}
    </div>
  )
}
