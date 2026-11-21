/**
 * Curvas de nivel decorativas: evocan el relieve andino de Loja.
 * Se generan de forma determinista (sin aleatoriedad) para que el dibujo sea estable.
 */
function curva(cx: number, cy: number, r: number, fase: number) {
  const puntos: string[] = []
  const pasos = 72
  for (let i = 0; i <= pasos; i++) {
    const a = (i / pasos) * Math.PI * 2
    const d = r * (1 + 0.09 * Math.sin(3 * a + fase) + 0.05 * Math.sin(5 * a - fase * 1.7) + 0.03 * Math.cos(7 * a + fase / 2))
    puntos.push(`${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * 0.78 * Math.sin(a)).toFixed(1)}`)
  }
  return `M${puntos.join('L')}Z`
}

const NIVELES = Array.from({ length: 11 }, (_, i) => ({ r: 34 + i * 26, fase: i * 0.45 }))
const RESALTADA = 6

export default function Topografia({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 560" fill="none" className={className} aria-hidden="true">
      {NIVELES.map(({ r, fase }, i) => (
        <path
          key={i}
          d={curva(340, 270, r, fase)}
          stroke={i === RESALTADA ? 'rgb(var(--rgb-naranja))' : 'rgb(var(--rgb-marino))'}
          strokeOpacity={i === RESALTADA ? 0.55 : 0.07 + i * 0.006}
          strokeWidth={i === RESALTADA ? 1.5 : 1}
        />
      ))}
      <circle cx="340" cy="270" r="3.5" fill="rgb(var(--rgb-naranja))" />
    </svg>
  )
}
