import { Download, FileText } from 'lucide-react'
import GaleriaImagenes, { type ImagenGaleria } from '@/components/ui/GaleriaImagenes'
import ArchivoDisponible from '@/components/ui/ArchivoDisponible'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { generateSignature } from '@/lib/signature'
import type {
  Actividad, AlineacionEstrategica, Anexo, Beneficiario, FirmaResponsabilidad, Proyecto,
} from '@/types/proyectos'
import { ANEXO_TIPO_LABELS, FIRMA_TIPO_LABELS, SECCIONES_FICHA, iniciales } from './constantes'
import { Campo, Campos, Etiqueta, SeccionFicha, SinDatos, Subtitulo, separarInstituciones, tieneTexto } from './ficha'

interface Props {
  proyecto: Proyecto
  alineaciones: AlineacionEstrategica[]
  beneficiarios: Beneficiario[]
  firmas: FirmaResponsabilidad[]
  actividades: Actividad[]
  galeria: ImagenGaleria[]
  documentos: Anexo[]
  onVerActividades: () => void
}

const NIVELES_MARCO = [
  { nivel: 'FIN', etiqueta: 'Fin' },
  { nivel: 'PROPOSITO', etiqueta: 'Propósito' },
  { nivel: 'COMPONENTES', etiqueta: 'Componentes' },
  { nivel: 'ACTIVIDADES', etiqueta: 'Actividades' },
] as const

const ESTADO_ACTIVIDAD: Record<string, { etiqueta: string; punto: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', punto: 'bg-line-strong' },
  EN_PROCESO: { etiqueta: 'En proceso', punto: 'bg-ink' },
  COMPLETADA: { etiqueta: 'Completada', punto: 'bg-status-success' },
  ATRASADA: { etiqueta: 'Atrasada', punto: 'bg-status-error' },
  CANCELADA: { etiqueta: 'Cancelada', punto: 'bg-ink-light' },
}

const n = (id: (typeof SECCIONES_FICHA)[number]['id']) => SECCIONES_FICHA.findIndex((s) => s.id === id) + 1

/** Pestaña Información: la ficha completa del proyecto, en el orden de las fases del formulario. */
export default function FichaInformacion({
  proyecto, alineaciones, beneficiarios, firmas, actividades, galeria, documentos, onVerActividades,
}: Props) {
  const { descripcion, instituciones } = separarInstituciones(proyecto.descripcion)
  const carreras = proyecto.carreras?.length ? proyecto.carreras.map((c) => c.nombre) : proyecto.carrera_nombre ? [proyecto.carrera_nombre] : []
  const presupuesto = proyecto.presupuesto
  const montos = presupuesto
    ? [
      { etiqueta: 'UNL valorado', valor: presupuesto.monto_unl_valorado },
      { etiqueta: 'UNL económico', valor: presupuesto.monto_unl_economico },
      { etiqueta: 'Externo valorado', valor: presupuesto.monto_externo_valorado },
      { etiqueta: 'Externo económico', valor: presupuesto.monto_externo_economico },
    ].filter((m) => Number(m.valor) > 0)
    : []
  const total = (tipo: string) => beneficiarios.filter((b) => !tipo || b.tipo === tipo).reduce((s, b) => s + (b.cantidad_estimada || 0), 0)

  return (
    <article className="rounded-[10px] border border-line bg-white px-5 py-6 sm:px-8 sm:py-8">
      {/* 01 · Información general (fase 1) */}
      <SeccionFicha id="ficha-informacion" numero={n('ficha-informacion')} titulo="Información general" descripcion="Identificación, resumen y alcance del proyecto.">
        <Campos>
          <Campo etiqueta="Resumen" valor={proyecto.resumen} completo />
          <Campo etiqueta="Descripción" valor={descripcion} completo />
          <Campo etiqueta="Línea de intervención" valor={proyecto.linea_intervencion} />
          <Campo etiqueta="Dirección de ejecución" valor={proyecto.direccion_ejecucion} />
          <Campo
            etiqueta={carreras.length > 1 ? 'Carreras participantes' : 'Carrera'}
            valor={carreras.length ? <span className="flex flex-wrap gap-1.5">{carreras.map((c) => <Etiqueta key={c}>{c}</Etiqueta>)}</span> : null}
            completo
          />
          <Campo etiqueta="Instituciones participantes" valor={instituciones} completo />
        </Campos>
        {!tieneTexto(proyecto.resumen, descripcion, proyecto.linea_intervencion, proyecto.direccion_ejecucion, instituciones) && carreras.length === 0 && (
          <SinDatos>Sin información general registrada.</SinDatos>
        )}
      </SeccionFicha>

      {/* 02 · Alineación estratégica (fase 2) */}
      <SeccionFicha id="ficha-alineacion" numero={n('ficha-alineacion')} titulo="Alineación estratégica" descripcion="Relación con los planes, programas y objetivos institucionales.">
        {alineaciones.length === 0 ? (
          <SinDatos>Sin alineaciones estratégicas registradas.</SinDatos>
        ) : (
          alineaciones.map((a, i) => (
            <div key={a.id} className={i > 0 ? 'border-t border-dashed border-line pt-6' : ''}>
              <p className="mb-3 text-[14px] font-semibold text-ink">{a.eje || `Alineación ${i + 1}`}</p>
              <Campos>
                <Campo etiqueta="Objetivo estratégico" valor={a.objetivo_estrategico} completo />
                <Campo etiqueta="Plan" valor={a.plan} />
                <Campo etiqueta="Programa" valor={a.programa} />
                <Campo etiqueta="Programa de vinculación" valor={a.programa_vinculacion} />
                <Campo etiqueta="Línea de investigación" valor={a.linea_investigacion} />
                <Campo etiqueta="Eje del plan de igualdad" valor={a.eje_plan_igualdad} />
                <Campo etiqueta="ODS" valor={a.ods} />
                <Campo etiqueta="Plan Nacional de Desarrollo" valor={a.plan_nacional_desarrollo} />
                <Campo etiqueta="Agenda zonal" valor={a.agenda_zonal} />
                <Campo etiqueta="Descripción" valor={a.descripcion} completo />
              </Campos>
            </div>
          ))
        )}
      </SeccionFicha>

      {/* 03 · Diagnóstico y beneficiarios (fase 3) */}
      <SeccionFicha id="ficha-diagnostico" numero={n('ficha-diagnostico')} titulo="Diagnóstico" descripcion="Problema, objetivos, viabilidad y población beneficiaria.">
        {tieneTexto(proyecto.problema, proyecto.justificacion, proyecto.objetivo_general, proyecto.resultados_esperados, proyecto.viabilidad) ? (
          <Campos>
            <Campo etiqueta="Problema" valor={proyecto.problema} completo />
            <Campo etiqueta="Justificación" valor={proyecto.justificacion} completo />
            <Campo etiqueta="Objetivo general" valor={proyecto.objetivo_general} completo />
            <Campo etiqueta="Resultados esperados" valor={proyecto.resultados_esperados} completo />
            <Campo etiqueta="Viabilidad" valor={proyecto.viabilidad} completo />
          </Campos>
        ) : (
          <SinDatos>Sin diagnóstico registrado.</SinDatos>
        )}

        <div>
          <Subtitulo>Beneficiarios</Subtitulo>
          {beneficiarios.length === 0 ? (
            <SinDatos>Sin beneficiarios registrados.</SinDatos>
          ) : (
            <>
              <dl className="mb-4 grid grid-cols-3 divide-x divide-line rounded-[8px] border border-line">
                {[
                  { etiqueta: 'Total', valor: total('') },
                  { etiqueta: 'Directos', valor: total('DIRECTO') },
                  { etiqueta: 'Indirectos', valor: total('INDIRECTO') },
                ].map((k) => (
                  <div key={k.etiqueta} className="px-3 py-3 sm:px-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{k.etiqueta}</dt>
                    <dd className="mt-0.5 text-[20px] font-semibold tabular-nums text-ink">{k.valor.toLocaleString('es-EC')}</dd>
                  </div>
                ))}
              </dl>
              <ul className="divide-y divide-line border-y border-line">
                {beneficiarios.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-ink">{b.nombre || '—'}</p>
                      <p className="text-[12px] text-ink-muted">
                        {b.tipo === 'DIRECTO' ? 'Directo' : 'Indirecto'}
                        {b.ubicacion ? ` · ${b.ubicacion}` : ''}
                      </p>
                      {b.descripcion && <p className="mt-1 text-[12.5px] text-ink-muted">{b.descripcion}</p>}
                    </div>
                    <span className="text-[14px] font-semibold tabular-nums text-ink">{(b.cantidad_estimada || 0).toLocaleString('es-EC')}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </SeccionFicha>

      {/* 04 · Marco lógico (fase 4) */}
      <SeccionFicha id="ficha-marco-logico" numero={n('ficha-marco-logico')} titulo="Marco lógico" descripcion="Cadena de resultados: fin, propósito, componentes y actividades.">
        {!proyecto.marco_logico?.some((f) => tieneTexto(f.resumen_narrativo, f.indicadores, f.medios_verificacion, f.supuestos)) ? (
          <SinDatos>Sin marco lógico registrado.</SinDatos>
        ) : (
          <ol className="relative space-y-6 border-l border-line pl-6">
            {NIVELES_MARCO.map(({ nivel, etiqueta }) => {
              const fila = proyecto.marco_logico?.find((m) => m.nivel === nivel)
              return (
                <li key={nivel} className="relative">
                  <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-ink ring-4 ring-white" aria-hidden="true" />
                  <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">{etiqueta}</p>
                  {fila && tieneTexto(fila.resumen_narrativo, fila.indicadores, fila.medios_verificacion, fila.supuestos) ? (
                    <Campos>
                      <Campo etiqueta="Resumen narrativo" valor={fila.resumen_narrativo} completo />
                      <Campo etiqueta="Indicadores" valor={fila.indicadores} />
                      <Campo etiqueta="Medios de verificación" valor={fila.medios_verificacion} />
                      <Campo etiqueta="Supuestos" valor={fila.supuestos} completo />
                    </Campos>
                  ) : (
                    <SinDatos>Sin datos para este nivel.</SinDatos>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </SeccionFicha>

      {/* 05 · Planificación y presupuesto (fase 5) */}
      <SeccionFicha id="ficha-planificacion" numero={n('ficha-planificacion')} titulo="Planificación" descripcion="Fechas, ejecución, seguimiento y presupuesto.">
        <Campos>
          <Campo etiqueta="Fecha de inicio" valor={proyecto.fecha_inicio ? formatDate(proyecto.fecha_inicio) : null} />
          <Campo etiqueta="Fin planificado" valor={proyecto.fecha_fin_planificada ? formatDate(proyecto.fecha_fin_planificada) : null} />
          <Campo etiqueta="Fin real" valor={proyecto.fecha_fin_real ? formatDate(proyecto.fecha_fin_real) : null} />
          <Campo etiqueta="Estrategias de ejecución" valor={proyecto.estrategias_ejecucion} completo />
          <Campo etiqueta="Seguimiento y evaluación" valor={proyecto.seguimiento_evaluacion} completo />
          <Campo etiqueta="Observaciones" valor={proyecto.observaciones} completo />
        </Campos>

        <div>
          <Subtitulo>Presupuesto</Subtitulo>
          {Number(proyecto.presupuesto_aprobado) > 0 ? (
            <dl className="divide-y divide-line border-y border-line">
              {montos.map((m) => (
                <div key={m.etiqueta} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-[13px] text-ink-muted">{m.etiqueta}</dt>
                  <dd className="text-[13.5px] font-medium tabular-nums text-ink">{formatCurrency(m.valor)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-[13px] font-semibold text-ink">Total aprobado</dt>
                <dd className="text-[15px] font-semibold tabular-nums text-ink">{formatCurrency(proyecto.presupuesto_aprobado)}</dd>
              </div>
            </dl>
          ) : (
            <SinDatos>Sin presupuesto registrado.</SinDatos>
          )}
        </div>

        <div>
          <Subtitulo>Cronograma</Subtitulo>
          {actividades.length === 0 ? (
            <SinDatos>No hay actividades registradas.</SinDatos>
          ) : (
            <>
              <ul className="divide-y divide-line border-y border-line">
                {actividades.slice(0, 5).map((a) => {
                  const est = ESTADO_ACTIVIDAD[a.estado] ?? ESTADO_ACTIVIDAD.PENDIENTE!
                  return (
                    <li key={a.id} className="flex items-center gap-3 py-2.5">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${est.punto}`} aria-hidden="true" />
                      <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{a.nombre}</p>
                      <span className="hidden text-[12px] text-ink-muted sm:inline">{est.etiqueta}</span>
                      <span className="w-24 text-right text-[12px] tabular-nums text-ink-muted">{a.fecha_fin ? formatDate(a.fecha_fin) : '—'}</span>
                    </li>
                  )
                })}
              </ul>
              {actividades.length > 5 && (
                <button type="button" onClick={onVerActividades} className="mt-3 text-[13px] font-semibold text-ink underline-offset-2 hover:underline">
                  Ver las {actividades.length} actividades
                </button>
              )}
            </>
          )}
        </div>
      </SeccionFicha>

      {/* 06 · Responsables y firmas (fase 6) */}
      <SeccionFicha id="ficha-responsables" numero={n('ficha-responsables')} titulo="Responsables" descripcion="Responsable, coordinación académica y firmas de responsabilidad.">
        <Campos>
          <Campo etiqueta="Responsable" valor={proyecto.responsable_nombre || 'Sin responsable'} />
          <Campo etiqueta="Coordinador académico" valor={proyecto.coordinador_academico_nombre || 'Sin coordinador'} />
        </Campos>
        <div>
          <Subtitulo>Firmas de responsabilidad</Subtitulo>
          {firmas.length === 0 ? (
            <SinDatos>Sin firmas registradas.</SinDatos>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {firmas.map((f) => {
                const firma = generateSignature(f.id)
                return (
                  <li key={f.id} className="rounded-[8px] border border-line px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bg-muted text-[12px] font-bold text-ink">
                        {iniciales(f.usuario_nombre)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold text-ink">{f.usuario_nombre || `Usuario #${f.usuario}`}</p>
                        <p className="text-[12px] text-ink-muted">
                          {FIRMA_TIPO_LABELS[f.tipo] || f.tipo} · {f.fecha_firma ? `firmado el ${formatDate(f.fecha_firma)}` : 'pendiente de firma'}
                        </p>
                      </div>
                    </div>
                    <svg
                      viewBox={firma.viewBox}
                      className="mt-3 h-12 w-full border-b border-ink-muted/40 text-ink-deep"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ transform: `rotate(${(f.id % 7) - 3}deg)` }}
                      role="img"
                      aria-label={`Rúbrica de ${f.usuario_nombre || 'usuario'}`}
                    >
                      {firma.paths.map((p, i) => (
                        <path
                          key={i}
                          d={p.d}
                          fill={p.width === 0 ? 'currentColor' : 'none'}
                          stroke={p.width === 0 ? 'none' : 'currentColor'}
                          strokeWidth={p.width || undefined}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={p.opacity}
                        />
                      ))}
                    </svg>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SeccionFicha>

      {/* 07 · Documentos e imágenes */}
      <SeccionFicha id="ficha-documentos" numero={n('ficha-documentos')} titulo="Documentos e imágenes" descripcion="Registro fotográfico y anexos del proyecto.">
        <div>
          <Subtitulo>Imágenes{galeria.length ? ` · ${galeria.length}` : ''}</Subtitulo>
          <GaleriaImagenes imagenes={galeria} />
        </div>
        <div>
          <Subtitulo>Anexos{documentos.length ? ` · ${documentos.length}` : ''}</Subtitulo>
          {documentos.length === 0 ? (
            <SinDatos>Sin documentos adjuntos.</SinDatos>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {documentos.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[6px] bg-bg-muted text-ink-muted" aria-hidden="true">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-[12rem] flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{a.nombre}</p>
                    <p className="text-[12px] text-ink-muted">
                      {ANEXO_TIPO_LABELS[a.tipo] || a.tipo}
                      {a.subido_por_nombre ? ` · subido por ${a.subido_por_nombre}` : ''}
                    </p>
                  </div>
                  <ArchivoDisponible url={a.archivo}>
                    <a
                      href={a.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line-strong bg-white px-3 text-[12.5px] font-medium text-ink transition-colors hover:bg-bg-soft"
                    >
                      <Download size={13} aria-hidden="true" /> Descargar
                    </a>
                  </ArchivoDisponible>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SeccionFicha>
    </article>
  )
}
