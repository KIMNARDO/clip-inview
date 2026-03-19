/**
 * MeasurementRenderer — CAD 엔진 내장 측정 렌더링 서비스
 *
 * Canvas2D 오버레이 대신 mlightcad의 addTransientEntity를 사용하여
 * 측정 지오메트리를 Three.js Scene에 직접 추가한다.
 * → 도면과 동일 좌표계 → 줌/팬 시 오차 없음
 */

import type { CadEngine } from './cadEngine'
import type { Point2D, MeasureMode, MeasurementResult } from '@/types/cad'

/** 측정 렌더링 스타일 설정 */
export interface MeasureStyle {
  textColor: string
  lineColor: string
  textHeight: number   // 픽셀 기반 기본값 (적응형 계산의 배율로 사용)
  arrowSize: number    // 픽셀 기반 기본값
  lineWidth: number
}

const DEFAULT_STYLE: MeasureStyle = {
  textColor: '#e3f1f1',
  lineColor: '#e3f1f1',
  textHeight: 14,
  arrowSize: 8,
  lineWidth: 1,
}

export type MeasureFormatter = {
  formatLength: (valueMm: number) => string
  formatArea: (valueMm2: number) => string
  formatAngle: (degrees: number) => string
  formatCoordinate: (x: number, y: number) => string
}

export class MeasurementRenderer {
  private _engine: CadEngine | null = null
  private _previewId = '__measure_preview__'
  private _formatter: MeasureFormatter | null = null
  private _style: MeasureStyle = { ...DEFAULT_STYLE }

  /** CadEngine 연결 */
  bind(engine: CadEngine): void {
    this._engine = engine
  }

  /** 포맷터 설정 */
  setFormatter(formatter: MeasureFormatter): void {
    this._formatter = formatter
  }

  /** 스타일 설정 업데이트 */
  setStyle(style: Partial<MeasureStyle>): void {
    Object.assign(this._style, style)
  }

  /** CadEngine 연결 해제 */
  unbind(): void {
    this.clearPreview()
    this._engine = null
  }

  // ─── 완료된 측정 결과 렌더링 ───

  renderMeasurement(result: MeasurementResult): void {
    if (!this._engine) return

    console.log('[MeasurementRenderer] renderMeasurement:', result.type, 'value:', result.value, 'points:', result.points)

    const baseId = `m_${result.id}`

    switch (result.type) {
      case 'distance':
        this._renderDistance(baseId, result.points, result.value, result.unit)
        break
      case 'area':
        this._renderArea(baseId, result.points, result.value, result.unit)
        break
      case 'angle':
        this._renderAngle(baseId, result.points, result.value, result.unit)
        break
      case 'coordinate':
        this._renderCoordinate(baseId, result.points)
        break
      case 'arc-length':
        this._renderArcLength(baseId, result.points, result.value, result.unit, result.auxiliary)
        break
      case 'point-to-line':
        this._renderPointToLine(baseId, result.points, result.value, result.unit, result.auxiliary)
        break
    }
  }

  /** 특정 측정 결과 제거 */
  removeMeasurement(resultId: string): void {
    if (!this._engine) return
    // 그룹 내 모든 서브 엔티티 제거
    const baseId = `m_${resultId}`
    this._engine.removeMeasurementEntity(`${baseId}_line`)
    this._engine.removeMeasurementEntity(`${baseId}_text`)
    this._engine.removeMeasurementEntity(`${baseId}_poly`)
    this._engine.removeMeasurementEntity(`${baseId}_arc`)
    this._engine.removeMeasurementEntity(`${baseId}_leg1`)
    this._engine.removeMeasurementEntity(`${baseId}_leg2`)
    // 끝점 마커들
    for (let i = 0; i < 10; i++) {
      this._engine.removeMeasurementEntity(`${baseId}_ep${i}`)
    }
    // 화살표 마커들
    for (let i = 0; i < 4; i++) {
      this._engine.removeMeasurementEntity(`${baseId}_aw${i}a`)
      this._engine.removeMeasurementEntity(`${baseId}_aw${i}b`)
    }
  }

  // ─── 실시간 프리뷰 렌더링 ───

  renderPreview(mode: MeasureMode, currentPoints: Point2D[], cursorPos: Point2D): void {
    if (!this._engine) return
    this.clearPreview()

    const pts = [...currentPoints, cursorPos]
    const pid = this._previewId

    switch (mode) {
      case 'distance':
        if (pts.length >= 2) {
          this._engine.addMeasurementLine(`${pid}_line`, pts[0]!, pts[pts.length - 1]!, this._previewColor)
        }
        break

      case 'area':
        if (pts.length >= 2) {
          this._engine.addMeasurementPolygon(`${pid}_poly`, pts, this._previewColor)
        }
        break

      case 'angle':
        if (pts.length >= 2) {
          this._engine.addMeasurementLine(`${pid}_leg1`, pts[0]!, pts[1]!, this._previewColor)
        }
        if (pts.length >= 3) {
          this._engine.addMeasurementLine(`${pid}_leg2`, pts[1]!, pts[2]!, this._previewColor)
        }
        break

      case 'arc-length':
        if (pts.length >= 2) {
          this._engine.addMeasurementLine(`${pid}_leg1`, pts[0]!, pts[1]!, this._previewColor)
        }
        if (pts.length >= 3) {
          this._engine.addMeasurementLine(`${pid}_leg2`, pts[1]!, pts[2]!, this._previewColor)
        }
        break

      case 'point-to-line':
        if (pts.length >= 2) {
          // 선분 프리뷰
          this._engine.addMeasurementLine(`${pid}_leg1`, pts[0]!, pts[1]!, this._previewColor)
        }
        if (pts.length >= 3) {
          // 점에서 선분까지의 수선
          this._engine.addMeasurementLine(`${pid}_leg2`, pts[1]!, pts[2]!, this._previewColor)
        }
        break
    }
  }

  /** 프리뷰 제거 */
  clearPreview(): void {
    if (!this._engine) return
    const pid = this._previewId
    this._engine.removeMeasurementEntity(`${pid}_line`)
    this._engine.removeMeasurementEntity(`${pid}_poly`)
    this._engine.removeMeasurementEntity(`${pid}_leg1`)
    this._engine.removeMeasurementEntity(`${pid}_leg2`)
    this._engine.removeMeasurementEntity(`${pid}_arc`)
  }

  /** 모든 측정 엔티티 제거 */
  clearAll(): void {
    this._engine?.clearMeasurementEntities()
  }

  // ─── private 렌더링 메서드 ───

  private _renderDistance(baseId: string, points: Point2D[], value: number, unit: string): void {
    if (!this._engine || points.length < 2) return
    const p1 = points[0]!
    const p2 = points[1]!

    // 측정선
    this._engine.addMeasurementLine(`${baseId}_line`, p1, p2, this._style.lineColor)

    // 화살표 마커 (시작점: p1→p2 방향, 끝점: p2→p1 방향)
    this._addArrowMarker(baseId, 0, p1, p2)
    this._addArrowMarker(baseId, 1, p2, p1)

    // 수치 텍스트 — 선분 중점 약간 위
    const mid: Point2D = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }
    // 텍스트 높이는 줌에 따라 적절히 조절
    const textHeight = this._getAdaptiveTextHeight()
    const offset = textHeight * 1.5
    // 선분에 수직 방향으로 오프셋
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.hypot(dx, dy)
    const nx = len > 0 ? -dy / len : 0
    const ny = len > 0 ? dx / len : 1
    const textPos: Point2D = { x: mid.x + nx * offset, y: mid.y + ny * offset }

    const label = this._formatter ? this._formatter.formatLength(value) : `${value.toFixed(2)} ${unit}`
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      label,
      textHeight,
      this._style.textColor,
    )
  }

  private _renderArea(baseId: string, points: Point2D[], value: number, unit: string): void {
    if (!this._engine || points.length < 3) return

    // 다각형
    this._engine.addMeasurementPolygon(`${baseId}_poly`, points, this._style.lineColor)

    // 꼭지점 마커
    for (let i = 0; i < points.length; i++) {
      this._addEndpointMarker(baseId, i, points[i]!)
    }

    // 면적 텍스트 — 중심
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length
    const textHeight = this._getAdaptiveTextHeight()

    const label = this._formatter ? this._formatter.formatArea(value) : `${value.toFixed(2)} ${unit}`
    this._engine.addMeasurementText(
      `${baseId}_text`,
      { x: cx, y: cy },
      label,
      textHeight,
      this._style.textColor,
    )
  }

  private _renderAngle(baseId: string, points: Point2D[], value: number, unit: string): void {
    if (!this._engine || points.length < 3) return
    const p1 = points[0]!
    const vertex = points[1]!
    const p2 = points[2]!

    // 두 변
    this._engine.addMeasurementLine(`${baseId}_leg1`, p1, vertex, this._style.lineColor)
    this._engine.addMeasurementLine(`${baseId}_leg2`, vertex, p2, this._style.lineColor)

    // 호 (각도 표시)
    const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x)
    const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x)
    const armLen = Math.min(
      Math.hypot(p1.x - vertex.x, p1.y - vertex.y),
      Math.hypot(p2.x - vertex.x, p2.y - vertex.y),
    )
    const arcRadius = Math.max(armLen * 0.3, this._getAdaptiveTextHeight() * 3)

    this._engine.addMeasurementArc(`${baseId}_arc`, vertex, arcRadius, angle1, angle2, this._style.textColor)

    // 끝점 마커
    this._addEndpointMarker(baseId, 0, p1)
    this._addEndpointMarker(baseId, 1, vertex)
    this._addEndpointMarker(baseId, 2, p2)

    // 각도 텍스트
    const labelAngle = (angle1 + angle2) / 2
    const textHeight = this._getAdaptiveTextHeight()
    const labelR = arcRadius + textHeight * 2
    const textPos: Point2D = {
      x: vertex.x + labelR * Math.cos(labelAngle),
      y: vertex.y + labelR * Math.sin(labelAngle),
    }
    const label = this._formatter ? this._formatter.formatAngle(value) : `${value.toFixed(1)}${unit}`
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      label,
      textHeight,
      this._style.textColor,
    )
  }

  private _renderCoordinate(baseId: string, points: Point2D[]): void {
    if (!this._engine || points.length < 1) return
    const pt = points[0]!
    const textHeight = this._getAdaptiveTextHeight()

    // 십자 마커
    this._addEndpointMarker(baseId, 0, pt)

    // 좌표 텍스트
    const textPos: Point2D = { x: pt.x + textHeight * 1.5, y: pt.y + textHeight * 1.5 }
    const label = this._formatter ? this._formatter.formatCoordinate(pt.x, pt.y) : `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      label,
      textHeight,
      this._style.textColor,
    )
  }

  private _renderArcLength(
    baseId: string,
    points: Point2D[],
    value: number,
    unit: string,
    auxiliary?: MeasurementResult['auxiliary'],
  ): void {
    if (!this._engine || points.length < 3) return
    const p1 = points[0]!
    const p2 = points[1]!  // 경유점
    const p3 = points[2]!

    if (auxiliary?.arcCenter && auxiliary.arcRadius) {
      // 호 렌더링
      const startAngle = auxiliary.arcStartAngle ?? 0
      const endAngle = auxiliary.arcEndAngle ?? Math.PI
      this._engine.addMeasurementArc(
        `${baseId}_arc`,
        auxiliary.arcCenter,
        auxiliary.arcRadius,
        startAngle,
        endAngle,
        this._style.lineColor,
      )
    } else {
      // 호 정보 없으면 직선 연결
      this._engine.addMeasurementLine(`${baseId}_leg1`, p1, p2, this._style.lineColor)
      this._engine.addMeasurementLine(`${baseId}_leg2`, p2, p3, this._style.lineColor)
    }

    // 끝점 마커
    this._addEndpointMarker(baseId, 0, p1)
    this._addEndpointMarker(baseId, 1, p2)
    this._addEndpointMarker(baseId, 2, p3)

    // 텍스트 — 경유점 근처
    const textHeight = this._getAdaptiveTextHeight()
    const textPos: Point2D = { x: p2.x + textHeight * 1.5, y: p2.y + textHeight * 1.5 }
    const label = this._formatter ? this._formatter.formatLength(value) : `${value.toFixed(2)} ${unit}`
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      label,
      textHeight,
      this._style.textColor,
    )
  }

  private _renderPointToLine(
    baseId: string,
    points: Point2D[],
    value: number,
    unit: string,
    auxiliary?: MeasurementResult['auxiliary'],
  ): void {
    if (!this._engine || points.length < 3) return
    const lineStart = points[0]!
    const lineEnd = points[1]!
    const point = points[2]!

    // 기준 선분
    this._engine.addMeasurementLine(`${baseId}_leg1`, lineStart, lineEnd, this._style.lineColor)

    // 수선 (점 → 투영점)
    const projection = auxiliary?.projection ?? point
    this._engine.addMeasurementLine(`${baseId}_leg2`, point, projection, this._style.lineColor)

    // 끝점 마커
    this._addEndpointMarker(baseId, 0, lineStart)
    this._addEndpointMarker(baseId, 1, lineEnd)
    this._addEndpointMarker(baseId, 2, point)

    // 거리 텍스트 — 수선 중점
    const mid: Point2D = { x: (point.x + projection.x) / 2, y: (point.y + projection.y) / 2 }
    const textHeight = this._getAdaptiveTextHeight()
    const textPos: Point2D = { x: mid.x + textHeight * 1.5, y: mid.y + textHeight * 1.5 }
    const label = this._formatter ? this._formatter.formatLength(value) : `${value.toFixed(2)} ${unit}`
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      label,
      textHeight,
      this._style.textColor,
    )
  }

  /** 끝점 마커: 작은 십자 형태 */
  private _addEndpointMarker(baseId: string, index: number, point: Point2D): void {
    if (!this._engine) return
    const size = this._getAdaptiveTextHeight() * 0.8
    // 십자 가로선
    this._engine.addMeasurementLine(
      `${baseId}_ep${index}`,
      { x: point.x - size, y: point.y },
      { x: point.x + size, y: point.y },
      this._style.lineColor,
    )
  }

  /** 화살표 마커: 시작점(origin)에서 대상점(target) 방향으로 화살촉 표시 */
  private _addArrowMarker(baseId: string, index: number, origin: Point2D, target: Point2D): void {
    if (!this._engine) return
    const arrowSize = this._getAdaptiveArrowSize()
    const dx = target.x - origin.x
    const dy = target.y - origin.y
    const len = Math.hypot(dx, dy)
    if (len === 0) return
    // 단위 벡터 (origin → target 방향)
    const ux = dx / len
    const uy = dy / len
    // 수직 벡터
    const px = -uy
    const py = ux
    // 화살촉 양쪽 날개
    const wing1: Point2D = {
      x: origin.x + ux * arrowSize + px * arrowSize * 0.35,
      y: origin.y + uy * arrowSize + py * arrowSize * 0.35,
    }
    const wing2: Point2D = {
      x: origin.x + ux * arrowSize - px * arrowSize * 0.35,
      y: origin.y + uy * arrowSize - py * arrowSize * 0.35,
    }
    this._engine.addMeasurementLine(`${baseId}_aw${index}a`, origin, wing1, this._style.lineColor)
    this._engine.addMeasurementLine(`${baseId}_aw${index}b`, origin, wing2, this._style.lineColor)
  }

  /** 프리뷰 색상 — 라인 색상에 50% 투명도 적용 */
  private get _previewColor(): string {
    const c = this._style.lineColor
    // hex → rgba 변환
    if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
      let r: number, g: number, b: number
      if (c.length === 4) {
        r = parseInt(c[1]! + c[1]!, 16)
        g = parseInt(c[2]! + c[2]!, 16)
        b = parseInt(c[3]! + c[3]!, 16)
      } else {
        r = parseInt(c.slice(1, 3), 16)
        g = parseInt(c.slice(3, 5), 16)
        b = parseInt(c.slice(5, 7), 16)
      }
      return `rgba(${r}, ${g}, ${b}, 0.5)`
    }
    return c
  }

  /** 뷰 영역 기반 적응형 텍스트 높이 계산 (사용자 textHeight 설정 반영) */
  private _getAdaptiveTextHeight(): number {
    if (!this._engine) return 3
    // 사용자 설정 textHeight를 기본 14px 대비 배율로 적용
    const scaleFactor = this._style.textHeight / 14
    try {
      // 화면 중앙 부근의 두 점을 사용하여 월드/픽셀 비율 계산
      const p1 = this._engine.getWorldCoords(400, 400)
      const p2 = this._engine.getWorldCoords(500, 400)
      const worldPer100px = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      if (worldPer100px > 0) {
        const h = Math.max(0.5, worldPer100px * 0.14 * scaleFactor)
        return h
      }
    } catch { /* fallback */ }
    return 3 * scaleFactor
  }

  /** 적응형 화살표 크기 (사용자 arrowSize 설정 반영) */
  private _getAdaptiveArrowSize(): number {
    const scaleFactor = this._style.arrowSize / 8
    return this._getAdaptiveTextHeight() * 1.2 * scaleFactor
  }
}
