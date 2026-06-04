import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, FolderKanban } from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi } from '@/api/proyectos'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmModal, ActionIcon } from '@/components/ui'
import { ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS, TIPO_PROYECTO_LABELS, TIPO_PROYECTO_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/formatters'
import type { Proyecto } from '@/types/proyectos'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'EN_EJECUCION', label: 'En ejecución' },
  { value: 'EN_SUSPENSION', label: 'Suspendido' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CERRADO', label: 'Cerrado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'VINCULACION', label: 'Vinculación' },
  { value: 'INVESTIGACION', label: 'Investigación' },
  { value: 'EXTENSION', label: 'Extensión' },
  { value: 'MIXTO', label: 'Mixto' },
]

export default function ProyectosListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isDocenteOrAbove } = usePermissions()
  const rol = user?.rol || 'ESTUDIANTE'

  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [filtersApplied, setFiltersApplied] = useState({ search: '', estado: '', tipo: '' })

  const canCreate = isAdmin() || (isDocenteOrAbove() && rol !== 'COORDINADOR')

  const subtitle =
    rol === 'ADMIN' || rol === 'COORDINADOR'
      ? 'Gestión de todos los proyectos'
      : rol === 'DOCENTE'
        ? 'Mis proyectos de vinculación'
        : 'Proyectos en los que participo'

  const basePath = `/${rol.toLowerCase()}/proyectos`

  const fetchProyectos = useCallback(async (p: number, filters: typeof filtersApplied, size: number) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(p), page_size: String(size) }
      if (filters.search) params.search = filters.search
      if (filters.estado) params.estado = filters.estado
      if (filters.tipo) params.tipo = filters.tipo
      const { data } = await proyectosApi.list(params)
      setProyectos(data.results)
      setTotal(data.count)
    } catch {
      toast.error('Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProyectos(page, filtersApplied, pageSize)
  }, [page, filtersApplied, pageSize, fetchProyectos])

  const handleSearch = () => {
    setPage(1)
    setFiltersApplied({ search, estado, tipo })
  }

  const handleClear = () => {
    setSearch('')
    setEstado('')
    setTipo('')
    setPage(1)
    setFiltersApplied({ search: '', estado: '', tipo: '' })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await proyectosApi.delete(deleteId)
      toast.success('Registro eliminado correctamente')
      if (proyectos.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        fetchProyectos(page, filtersApplied, pageSize)
      }
    } catch {
      toast.error('No se pudo eliminar el registro')
    } finally {
      setDeleteId(null)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Proyectos</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate(`${basePath}/nuevo`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Nuevo proyecto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-line p-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Buscar</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título o código..."
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {ESTADOS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {TIPOS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink text-white hover:bg-ink/90 transition-colors"
          >
            <Search size={14} />
            Buscar
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors"
          >
            <X size={14} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Responsable</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Fecha inicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Fecha fin</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
                  </td>
                </tr>
              ) : proyectos.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-12">
                      <FolderKanban size={40} className="text-ink-light mb-3 opacity-40" />
                      <p className="text-sm font-medium text-ink">No se encontraron proyectos</p>
                      {canCreate && (
                        <button
                          onClick={() => navigate(`${basePath}/nuevo`)}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          <Plus size={14} />
                          Nuevo proyecto
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                proyectos.map((p, i) => (
                  <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#F0FDF4] transition-colors duration-150`}>
                    <td className="px-4 py-3.5 font-mono text-xs text-[#374151]">{p.codigo}</td>
                    <td className="px-4 py-3.5 font-medium text-[#374151] max-w-[250px] truncate">{p.titulo}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium ${TIPO_PROYECTO_COLORS[p.tipo] || 'text-gray-700'}`}>
                        {TIPO_PROYECTO_LABELS[p.tipo] || p.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center justify-center min-w-[70px] px-2 py-0.5 text-[9px] font-semibold rounded-md text-center whitespace-nowrap ${ESTADO_PROYECTO_COLORS[p.estado] || 'bg-[#CCCCFF] text-gray-800'}`}>
                        {ESTADO_PROYECTO_LABELS[p.estado] || p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#374151] text-xs">{p.responsable_nombre || '-'}</td>
                    <td className="px-4 py-3.5 text-[#374151] text-xs">{formatDate(p.fecha_inicio)}</td>
                    <td className="px-4 py-3.5 text-[#374151] text-xs">{formatDate(p.fecha_fin_planificada)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIcon
                          icon="ver"
                          enabled={true}
                          onClick={() => navigate(`${basePath}/${p.id}`)}
                          tooltipActivo="Ver proyecto"
                          tooltipDeshabilitado=""
                        />
                        <ActionIcon
                          icon="editar"
                          enabled={isAdmin() || (rol === 'DOCENTE' && p.estado === 'BORRADOR' && p.responsable === user?.id)}
                          onClick={() => navigate(`${basePath}/${p.id}/editar`)}
                          tooltipActivo="Editar proyecto"
                          tooltipDeshabilitado="No se puede editar en este estado"
                        />
                        <ActionIcon
                          icon="eliminar"
                          enabled={isAdmin()}
                          onClick={() => setDeleteId(p.id)}
                          tooltipActivo="Eliminar proyecto"
                          tooltipDeshabilitado="No tienes permiso para eliminar"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 bg-white text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>por página</span>
            <span className="ml-3">
              {start} - {end} de {total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-ink-muted px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        titulo="¿Eliminar?"
        mensaje="Está seguro de eliminar el registro!"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
