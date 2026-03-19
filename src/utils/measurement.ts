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

/** 세 점으로 정의된 호의 길이 (p1: 시작점, p2: 경유점, p3: 끝점) */
export function calculateArcLength(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
): { arcLength: number; center: Point2D; radius: number; startAngle: number; endAngle: number } {
  // 세 점으로 외접원 구하기
  const ax = p1.x, ay = p1.y
  const bx = p2.x, by = p2.y
  const cx = p3.x, cy = p3.y

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))

  if (Math.abs(d) < 1e-10) {
    // 세 점이 직선 위 → 호가 아닌 직선 거리 반환
    const dist = calculateDistance(p1, p2) + calculateDistance(p2, p3)
    return {
      arcLength: dist,
      center: { x: (ax + cx) / 2, y: (ay + cy) / 2 },
      radius: 0,
      startAngle: 0,
      endAngle: 0,
    }
  }

  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d

  const center: Point2D = { x: ux, y: uy }
  const radius = Math.hypot(ax - ux, ay - uy)

  // 시작/끝/경유 각도
  const startAngle = Math.atan2(ay - uy, ax - ux)
  const midAngle = Math.atan2(by - uy, bx - ux)
  const endAngle = Math.atan2(cy - uy, cx - ux)

  // 호가 경유점을 포함하는 방향 결정
  function normalizeAngle(a: number): number {
    while (a < 0) a += 2 * Math.PI
    while (a >= 2 * Math.PI) a -= 2 * Math.PI
    return a
  }

  const sa = normalizeAngle(startAngle)
  const ma = normalizeAngle(midAngle)
  const ea = normalizeAngle(endAngle)

  // 시작→끝 반시계 방향 각도
  let sweep = normalizeAngle(ea - sa)
  // 경유점이 반시계 방향 호 안에 있는지 확인
  const midInSweep = normalizeAngle(ma - sa) <= sweep
  if (!midInSweep) {
    // 반대 방향 호
    sweep = 2 * Math.PI - sweep
  }

  const arcLength = radius * sweep

  return { arcLength, center, radius, startAngle: sa, endAngle: ea }
}

/** 점에서 선분까지의 최단 거리 및 수선의 발 */
export function calculatePointToLineDistance(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D,
): { distance: number; projection: Point2D } {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lenSq = dx * dx + dy * dy

  if (lenSq === 0) {
    // 선분이 점인 경우
    return {
      distance: calculateDistance(point, lineStart),
      projection: { ...lineStart },
    }
  }

  // 선분 위의 비율 t (0~1 클램프 → 선분 위, 제한 없으면 직선 위)
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))

  const projection: Point2D = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  }

  return {
    distance: calculateDistance(point, projection),
    projection,
  }
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
