/**
 * MeasurementRenderer — CAD 엔진 내장 측정 렌더링 서비스
 *
 * Canvas2D 오버레이 대신 mlightcad의 addTransientEntity를 사용하여
 * 측정 지오메트리를 Three.js Scene에 직접 추가한다.
 * → 도면과 동일 좌표계 → 줌/팬 시 오차 없음
 */

import type { CadEngine } from './cadEngine'
import type { Point2D, MeasureMode, MeasurementResult } from '@/types/cad'

const MEASURE_COLOR = '#FFD700'
const MEASURE_TEXT_COLOR = '#FFEE58'
const PREVIEW_COLOR = '#B8960E'

export class MeasurementRenderer {
  private _engine: CadEngine | null = null
  private _previewId = '__measure_preview__'

  /** CadEngine 연결 */
  bind(engine: CadEngine): void {
    this._engine = engine
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
          this._engine.addMeasurementLine(`${pid}_line`, pts[0]!, pts[pts.length - 1]!, PREVIEW_COLOR)
        }
        break

      case 'area':
        if (pts.length >= 2) {
          this._engine.addMeasurementPolygon(`${pid}_poly`, pts, PREVIEW_COLOR)
        }
        break

      case 'angle':
        if (pts.length >= 2) {
          this._engine.addMeasurementLine(`${pid}_leg1`, pts[0]!, pts[1]!, PREVIEW_COLOR)
        }
        if (pts.length >= 3) {
          this._engine.addMeasurementLine(`${pid}_leg2`, pts[1]!, pts[2]!, PREVIEW_COLOR)
        }
        break

      case 'arc-length':
        if (pts.length >= 2) {
          this._engine.addMeasurementLine(`${pid}_leg1`, pts[0]!, pts[1]!, PREVIEW_COLOR)
        }
        if (pts.length >= 3) {
          this._engine.addMeasurementLine(`${pid}_leg2`, pts[1]!, pts[2]!, PREVIEW_COLOR)
        }
        break

      case 'point-to-line':
        if (pts.length >= 2) {
          // 선분 프리뷰
          this._engine.addMeasurementLine(`${pid}_leg1`, pts[0]!, pts[1]!, PREVIEW_COLOR)
        }
        if (pts.length >= 3) {
          // 점에서 선분까지의 수선
          this._engine.addMeasurementLine(`${pid}_leg2`, pts[1]!, pts[2]!, PREVIEW_COLOR)
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
    this._engine.addMeasurementLine(`${baseId}_line`, p1, p2, MEASURE_COLOR)

    // 끝점 마커 (작은 십자 표시)
    this._addEndpointMarker(baseId, 0, p1)
    this._addEndpointMarker(baseId, 1, p2)

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

    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      `${value.toFixed(2)} ${unit}`,
      textHeight,
      MEASURE_TEXT_COLOR,
    )
  }

  private _renderArea(baseId: string, points: Point2D[], value: number, unit: string): void {
    if (!this._engine || points.length < 3) return

    // 다각형
    this._engine.addMeasurementPolygon(`${baseId}_poly`, points, MEASURE_COLOR)

    // 꼭지점 마커
    for (let i = 0; i < points.length; i++) {
      this._addEndpointMarker(baseId, i, points[i]!)
    }

    // 면적 텍스트 — 중심
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length
    const textHeight = this._getAdaptiveTextHeight()

    this._engine.addMeasurementText(
      `${baseId}_text`,
      { x: cx, y: cy },
      `${value.toFixed(2)} ${unit}`,
      textHeight,
      MEASURE_TEXT_COLOR,
    )
  }

  private _renderAngle(baseId: string, points: Point2D[], value: number, unit: string): void {
    if (!this._engine || points.length < 3) return
    const p1 = points[0]!
    const vertex = points[1]!
    const p2 = points[2]!

    // 두 변
    this._engine.addMeasurementLine(`${baseId}_leg1`, p1, vertex, MEASURE_COLOR)
    this._engine.addMeasurementLine(`${baseId}_leg2`, vertex, p2, MEASURE_COLOR)

    // 호 (각도 표시)
    const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x)
    const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x)
    const armLen = Math.min(
      Math.hypot(p1.x - vertex.x, p1.y - vertex.y),
      Math.hypot(p2.x - vertex.x, p2.y - vertex.y),
    )
    const arcRadius = Math.max(armLen * 0.3, this._getAdaptiveTextHeight() * 3)

    this._engine.addMeasurementArc(`${baseId}_arc`, vertex, arcRadius, angle1, angle2, MEASURE_TEXT_COLOR)

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
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      `${value.toFixed(1)}${unit}`,
      textHeight,
      MEASURE_TEXT_COLOR,
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
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`,
      textHeight,
      MEASURE_TEXT_COLOR,
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
        MEASURE_COLOR,
      )
    } else {
      // 호 정보 없으면 직선 연결
      this._engine.addMeasurementLine(`${baseId}_leg1`, p1, p2, MEASURE_COLOR)
      this._engine.addMeasurementLine(`${baseId}_leg2`, p2, p3, MEASURE_COLOR)
    }

    // 끝점 마커
    this._addEndpointMarker(baseId, 0, p1)
    this._addEndpointMarker(baseId, 1, p2)
    this._addEndpointMarker(baseId, 2, p3)

    // 텍스트 — 경유점 근처
    const textHeight = this._getAdaptiveTextHeight()
    const textPos: Point2D = { x: p2.x + textHeight * 1.5, y: p2.y + textHeight * 1.5 }
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      `${value.toFixed(2)} ${unit}`,
      textHeight,
      MEASURE_TEXT_COLOR,
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
    this._engine.addMeasurementLine(`${baseId}_leg1`, lineStart, lineEnd, MEASURE_COLOR)

    // 수선 (점 → 투영점)
    const projection = auxiliary?.projection ?? point
    this._engine.addMeasurementLine(`${baseId}_leg2`, point, projection, MEASURE_COLOR)

    // 끝점 마커
    this._addEndpointMarker(baseId, 0, lineStart)
    this._addEndpointMarker(baseId, 1, lineEnd)
    this._addEndpointMarker(baseId, 2, point)

    // 거리 텍스트 — 수선 중점
    const mid: Point2D = { x: (point.x + projection.x) / 2, y: (point.y + projection.y) / 2 }
    const textHeight = this._getAdaptiveTextHeight()
    const textPos: Point2D = { x: mid.x + textHeight * 1.5, y: mid.y + textHeight * 1.5 }
    this._engine.addMeasurementText(
      `${baseId}_text`,
      textPos,
      `${value.toFixed(2)} ${unit}`,
      textHeight,
      MEASURE_TEXT_COLOR,
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
      MEASURE_COLOR,
    )
  }

  /** 뷰 영역 기반 적응형 텍스트 높이 계산 */
  private _getAdaptiveTextHeight(): number {
    if (!this._engine) return 3
    try {
      // 화면 중앙 부근의 두 점을 사용하여 월드/픽셀 비율 계산
      const p1 = this._engine.getWorldCoords(400, 400)
      const p2 = this._engine.getWorldCoords(500, 400)
      const worldPer100px = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      if (worldPer100px > 0) {
        const h = Math.max(0.5, worldPer100px * 0.14)
        return h
      }
    } catch { /* fallback */ }
    return 3
  }
}
