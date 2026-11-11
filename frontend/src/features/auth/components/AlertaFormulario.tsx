import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  mensaje: string | null
  tipo?: 'error' | 'exito'
}

export default function AlertaFormulario({ mensaje, tipo = 'error' }: Props) {
  if (!mensaje) return null
  const estilos = tipo === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  const Icono = tipo === 'error' ? AlertCircle : CheckCircle2
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-btn border px-3.5 py-3 text-sm ${estilos}`}>
      <Icono size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  )
}
