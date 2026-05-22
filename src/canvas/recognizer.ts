type Point = { x: number; y: number }

export type DetectedShape = 'rectangle' | 'ellipse' | 'triangle' | 'diamond'

export type RecognitionResult = {
  shape: DetectedShape
  bounds: { x: number; y: number; w: number; h: number }
  confidence: number
} | null

function bbox(points: Point[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function perpDistance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x, dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return dist(p, a)
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  const tx = a.x + t * dx, ty = a.y + t * dy
  return Math.hypot(p.x - tx, p.y - ty)
}

function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points.slice()
  let maxIdx = 0
  let maxDist = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], points[0], points[points.length - 1])
    if (d > maxDist) { maxDist = d; maxIdx = i }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon)
    const right = douglasPeucker(points.slice(maxIdx), epsilon)
    return left.slice(0, -1).concat(right)
  }
  return [points[0], points[points.length - 1]]
}

function rectFitError(points: Point[], bb: { minX: number; minY: number; maxX: number; maxY: number }): number {
  let sum = 0
  for (const p of points) {
    const dxL = Math.abs(p.x - bb.minX)
    const dxR = Math.abs(p.x - bb.maxX)
    const dyT = Math.abs(p.y - bb.minY)
    const dyB = Math.abs(p.y - bb.maxY)
    sum += Math.min(dxL, dxR, dyT, dyB)
  }
  return sum / points.length
}

function ellipseFitError(points: Point[], bb: { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number }): number {
  const cx = (bb.minX + bb.maxX) / 2
  const cy = (bb.minY + bb.maxY) / 2
  const a = bb.w / 2
  const b = bb.h / 2
  if (a < 1 || b < 1) return Infinity
  let sum = 0
  for (const p of points) {
    // Project to ellipse via the polar angle in normalised coordinates.
    // This is an approximation but consistent enough for classification.
    const dxn = (p.x - cx) / a
    const dyn = (p.y - cy) / b
    const theta = Math.atan2(dyn, dxn)
    const ex = cx + a * Math.cos(theta)
    const ey = cy + b * Math.sin(theta)
    sum += Math.hypot(p.x - ex, p.y - ey)
  }
  return sum / points.length
}

export function recognize(points: Point[]): RecognitionResult {
  if (points.length < 8) return null
  const bb = bbox(points)
  if (bb.w < 20 || bb.h < 20) return null
  const diag = Math.hypot(bb.w, bb.h)

  // Closed-stroke check
  const closeDist = dist(points[0], points[points.length - 1])
  if (closeDist > diag * 0.2) return null

  // Simplify
  const epsilon = Math.max(diag * 0.04, 4)
  const simplified = douglasPeucker(points, epsilon)

  // Strip closing-duplicate vertex
  const verts = simplified.length > 1 &&
    dist(simplified[0], simplified[simplified.length - 1]) < diag * 0.05
    ? simplified.slice(0, -1)
    : simplified

  const vcount = verts.length
  const baseBounds = { x: bb.minX, y: bb.minY, w: bb.w, h: bb.h }

  // Clean 3 vertices: triangle
  if (vcount === 3) {
    return { shape: 'triangle', bounds: baseBounds, confidence: 0.85 }
  }

  // Clean 4 vertices: rectangle vs diamond — by whether vertices cluster at
  // bbox corners or at edge midpoints.
  if (vcount === 4) {
    const corners: Point[] = [
      { x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.minY },
      { x: bb.maxX, y: bb.maxY }, { x: bb.minX, y: bb.maxY },
    ]
    const midpoints: Point[] = [
      { x: (bb.minX + bb.maxX) / 2, y: bb.minY },
      { x: bb.maxX, y: (bb.minY + bb.maxY) / 2 },
      { x: (bb.minX + bb.maxX) / 2, y: bb.maxY },
      { x: bb.minX, y: (bb.minY + bb.maxY) / 2 },
    ]
    const closestSum = (targets: Point[]) =>
      verts.reduce((sum, v) => sum + Math.min(...targets.map(t => dist(v, t))), 0)
    const cornerScore = closestSum(corners)
    const midScore = closestSum(midpoints)
    if (cornerScore <= midScore) {
      return {
        shape: 'rectangle',
        bounds: baseBounds,
        confidence: Math.max(0, 1 - cornerScore / diag),
      }
    }
    return {
      shape: 'diamond',
      bounds: baseBounds,
      confidence: Math.max(0, 1 - midScore / diag),
    }
  }

  // Otherwise: rect vs ellipse by stroke-to-perimeter fit error.
  // For a square, all stroke points sit on the bbox edges → rectError ≈ 0.
  // For a circle, points sit on the inscribed ellipse → ellipseError ≈ 0.
  const rectErr = rectFitError(points, bb) / diag
  const ellErr = ellipseFitError(points, bb) / diag

  // Neither candidate fits well → don't claim a detection.
  if (rectErr > 0.16 && ellErr > 0.16) return null

  if (rectErr < ellErr) {
    return {
      shape: 'rectangle',
      bounds: baseBounds,
      confidence: Math.max(0.3, 1 - rectErr * 4),
    }
  }
  return {
    shape: 'ellipse',
    bounds: baseBounds,
    confidence: Math.max(0.3, 1 - ellErr * 4),
  }
}
