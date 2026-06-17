import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Download, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface FormatoItem {
  titulo: string
  descripcion: string
  categoria: 'Guía' | 'Formato' | 'Plantilla'
}

const FORMATOS: FormatoItem[] = [
  {
    titulo: 'Guía metodológica de marco lógico',
    descripcion: 'Documento oficial de la Coordinación de Vinculación con la Sociedad que establece la metodología de marco lógico aplicada a los proyectos de vinculación de la UNL.',
    categoria: 'Guía',
  },
  {
    titulo: 'Formato de perfil de proyecto',
    descripcion: 'Plantilla para la presentación del perfil inicial de proyectos de vinculación con la sociedad.',
    categoria: 'Plantilla',
  },
  {
    titulo: 'Formato de presupuesto referencial',
    descripcion: 'Estructura sugerida para la presentación del presupuesto por partidas y fuentes de financiamiento.',
    categoria: 'Formato',
  },
  {
    titulo: 'Formato de cronograma valorado',
    descripcion: 'Plantilla para la construcción del cronograma de actividades valorado mensualmente.',
    categoria: 'Formato',
  },
  {
    titulo: 'Formato de matriz de seguimiento',
    descripcion: 'Matriz de indicadores, medios de verificación y supuestos para el seguimiento y monitoreo del proyecto.',
    categoria: 'Plantilla',
  },
  {
    titulo: 'Carta de compromiso institucional',
    descripcion: 'Modelo de carta de compromiso para instituciones externas participantes en el proyecto.',
    categoria: 'Formato',
  },
]

export default function FormatosPage() {
  const navigate = useNavigate()
  const { rol: rolParam } = useParams<{ rol: string }>()
  const user = useAuthStore((s) => s.user)
  const rol = (rolParam || user?.rol || 'estudiante').toLowerCase()
  const basePath = `/${rol}/proyectos`

  const CATEGORIA_COLORS: Record<FormatoItem['categoria'], string> = {
    'Guía': 'bg-[#DBEAFE] text-[#1E3A8A]',
    'Formato': 'bg-[#DCFCE7] text-[#15803D]',
    'Plantilla': 'bg-[#FEF3C7] text-[#92400E]',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(basePath)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <h1 className="mt-3 text-3xl font-bold text-ink tracking-tight">
          Formatos y guías
        </h1>
        <p className="mt-1 text-sm text-ink-muted max-w-2xl">
          Documentos oficiales de la Coordinación de Vinculación con la Sociedad de la UNL.
          Utilízalos como referencia para la presentación y seguimiento de proyectos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FORMATOS.map((f) => (
          <div
            key={f.titulo}
            className="bg-white border border-line p-5 flex flex-col gap-3"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 flex-shrink-0" style={{ borderRadius: 0 }}>
                  <FileText size={18} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink leading-snug">{f.titulo}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold mt-1.5 ${CATEGORIA_COLORS[f.categoria]}`} style={{ borderRadius: 0 }}>
                    {f.categoria}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">{f.descripcion}</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
                style={{ borderRadius: 0 }}
              >
                <BookOpen size={12} />
                Ver
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ink text-white hover:bg-ink/90 transition-colors"
                style={{ borderRadius: 0 }}
              >
                <Download size={12} />
                Descargar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-line p-5" style={{ borderRadius: 0 }}>
        <p className="text-xs text-ink-muted">
          ¿Necesitas un formato adicional? Contacta a la Coordinación de Vinculación con la Sociedad
          de la Universidad Nacional de Loja.
        </p>
      </div>
    </div>
  )
}
