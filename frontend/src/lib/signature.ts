function seededRandom(seed: number): () => number {
  let s = Math.abs(Math.floor(seed)) || 1
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export interface SignaturePath {
  d: string
  width: number
  opacity?: number
}

export function generateSignature(seed: number): { paths: SignaturePath[]; viewBox: string } {
  const rand = seededRandom(seed)

  const width = 260
  const height = 80
  const baselineY = 46
  const paths: SignaturePath[] = []

  let x = 4
  let y = baselineY + (rand() - 0.5) * 3

  const startWidth = 1.4 + rand() * 0.4
  let currentPath = `M ${x.toFixed(1)} ${y.toFixed(1)}`
  let currentWidth = startWidth

  const numStrokes = 4 + Math.floor(rand() * 3)
  for (let i = 0; i < numStrokes; i++) {
    const segW = 26 + rand() * 18
    const direction = i % 2 === 0 ? -1 : 1
    const amplitude = 10 + rand() * 8
    const goingDown = direction > 0

    const cp1x = x + segW * 0.25
    const cp1y = baselineY + direction * amplitude * 0.7
    const cp2x = x + segW * 0.75
    const cp2y = baselineY - direction * amplitude * 0.4
    const endX = x + segW
    const endY = baselineY + (rand() - 0.5) * 5

    const targetWidth = goingDown
      ? 1.9 + rand() * 0.5
      : 1.0 + rand() * 0.3

    if (Math.abs(targetWidth - currentWidth) > 0.35) {
      paths.push({ d: currentPath, width: currentWidth })
      currentPath = `M ${x.toFixed(1)} ${y.toFixed(1)}`
      currentWidth = targetWidth
    } else {
      currentWidth = targetWidth
    }

    currentPath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`
    x = endX
    y = endY
  }

  if (rand() > 0.45 && x < width - 40) {
    const loopCx = x + 11
    const loopCy = baselineY - 4
    currentPath += ` C ${(x + 4).toFixed(1)} ${(baselineY - 16).toFixed(1)}, ${(loopCx + 7).toFixed(1)} ${(loopCy - 12).toFixed(1)}, ${(loopCx).toFixed(1)} ${(loopCy + 2).toFixed(1)}`
    currentPath += ` C ${(loopCx - 5).toFixed(1)} ${(loopCy + 10).toFixed(1)}, ${(loopCx - 2).toFixed(1)} ${(baselineY + 1).toFixed(1)}, ${(loopCx + 5).toFixed(1)} ${(baselineY + 1).toFixed(1)}`
    x = loopCx + 7
  }

  const flourishLen = 18 + rand() * 14
  const endX = Math.min(width - 4, x + flourishLen)
  const endY = baselineY - 2 + (rand() - 0.5) * 3
  currentPath += ` C ${(x + flourishLen * 0.35).toFixed(1)} ${(baselineY - 9).toFixed(1)}, ${(x + flourishLen * 0.7).toFixed(1)} ${(baselineY + 3).toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`
  x = endX
  y = endY

  paths.push({ d: currentPath, width: currentWidth })

  if (rand() > 0.6) {
    const dotX = x - 2 + (rand() - 0.5) * 4
    const dotY = y + 4 + (rand() - 0.5) * 2
    const dotR = 1.1 + rand() * 0.6
    paths.push({
      d: `M ${dotX.toFixed(1)} ${dotY.toFixed(1)} m -${dotR.toFixed(1)} 0 a ${dotR.toFixed(1)} ${dotR.toFixed(1)} 0 1 0 ${(dotR * 2).toFixed(1)} 0 a ${dotR.toFixed(1)} ${dotR.toFixed(1)} 0 1 0 -${(dotR * 2).toFixed(1)} 0`,
      width: 0,
      opacity: 1,
    })
  }

  return {
    paths,
    viewBox: `0 0 ${width} ${height}`,
  }
}
