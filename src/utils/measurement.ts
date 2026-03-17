import type { Point2D } from '@/types/cad'

/** 두 점 간 거리 */
export function calculateDistance(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}

/** 다각형 면적 (Shoelace formula) */
export function calculatePolygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0

  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i]!.x * points[j]!.y
    area -= points[j]!.x * points[i]!.y
  }

  return Math.abs(area) / 2
}

/** 세 점으로 정의된 각도 (p1 → vertex → p2, 도 단위) */
export function calculateAngle(p1: Point2D, vertex: Point2D, p2: Point2D): number {
  const v1x = p1.x - vertex.x
  const v1y = p1.y - vertex.y
  const v2x = p2.x - vertex.x
  const v2y = p2.y - vertex.y

  const dot = v1x * v2x + v1y * v2y
  const mag1 = Math.hypot(v1x, v1y)
  const mag2 = Math.hypot(v2x, v2y)

  if (mag1 === 0 || mag2 === 0) return 0

  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  return (Math.acos(cos) * 180) / Math.PI
}

/** 측정 결과 포맷팅 */
export function formatMeasurement(value: number, unit: string): string {
  if (unit === '°') {
    return `${value.toFixed(1)}${unit}`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} m${unit === 'mm²' ? '²' : ''}`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} ${unit === 'mm²' ? 'cm²' : 'cm'}`
  }
  return `${value.toFixed(2)} ${unit}`
}
