import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Point2D, MeasureMode, MeasurementResult } from '@/types/cad'
import {
  calculateDistance,
  calculatePolygonArea,
  calculateAngle,
  calculatePointToLineDistance,
  calculateArcLength,
} from '@/utils/measurement'
import { MeasurementRenderer } from '@/services/measurementRenderer'
import type { CadEngine } from '@/services/cadEngine'

let nextId = 0

export const useMeasurementStore = defineStore('measurement', () => {
  const activeMeasureMode = ref<MeasureMode | null>(null)
  const currentPoints = ref<Point2D[]>([])
  const measurements = ref<MeasurementResult[]>([])
  const cursorPosition = ref<Point2D>({ x: 0, y: 0 })
  /** 화면 좌표 (커서 툴팁 위치 계산용) */
  const screenCursorPosition = ref<Point2D>({ x: 0, y: 0 })

  const isActive = computed(() => activeMeasureMode.value !== null)
  const lastMeasurement = computed(() =>
    measurements.value.length > 0 ? measurements.value[measurements.value.length - 1] : null,
  )

  // ─── 실시간 라이브 값 ───

  /** 현재 커서 위치 기준 실시간 측정값 */
  const liveValue = computed<{ value: number; unit: string } | null>(() => {
    if (!activeMeasureMode.value) return null
    const pts = currentPoints.value
    const cursor = cursorPosition.value

    switch (activeMeasureMode.value) {
      case 'distance': {
        if (pts.length === 1) {
          return { value: calculateDistance(pts[0]!, cursor), unit: 'mm' }
        }
        return null
      }
      case 'area': {
        if (pts.length >= 2) {
          const allPts = [...pts, cursor]
          return { value: calculatePolygonArea(allPts), unit: 'mm²' }
        }
        return null
      }
      case 'angle': {
        if (pts.length === 2) {
          return { value: calculateAngle(pts[0]!, pts[1]!, cursor), unit: '°' }
        }
        return null
      }
      case 'arc-length': {
        if (pts.length === 2) {
          // 3점(시작, 경유, 끝)으로 호 길이 계산
          const result = calculateArcLength(pts[0]!, pts[1]!, cursor)
          return { value: result.arcLength, unit: 'mm' }
        }
        return null
      }
      case 'point-to-line': {
        if (pts.length === 2) {
          // 2점이 선분, 커서가 측정할 점
          const result = calculatePointToLineDistance(cursor, pts[0]!, pts[1]!)
          return { value: result.distance, unit: 'mm' }
        }
        return null
      }
      default:
        return null
    }
  })

  /** 측정 안내 텍스트 */
  const instructionText = computed<string>(() => {
    if (!activeMeasureMode.value) return ''
    const pts = currentPoints.value

    switch (activeMeasureMode.value) {
      case 'distance':
        return pts.length === 0
          ? '시작점을 클릭하세요'
          : '끝점을 클릭하세요'
      case 'area':
        if (pts.length === 0) return '첫 번째 꼭지점을 클릭하세요'
        if (pts.length === 1) return '다음 꼭지점을 클릭하세요'
        return '다음 꼭지점 클릭 / 더블클릭으로 완료'
      case 'angle':
        if (pts.length === 0) return '첫 번째 점을 클릭하세요'
        if (pts.length === 1) return '꼭지점을 클릭하세요'
        return '끝점을 클릭하세요'
      case 'coordinate':
        return '측정할 점을 클릭하세요'
      case 'arc-length':
        if (pts.length === 0) return '호의 시작점을 클릭하세요'
        if (pts.length === 1) return '호의 경유점을 클릭하세요'
        return '호의 끝점을 클릭하세요'
      case 'point-to-line':
        if (pts.length === 0) return '선분의 시작점을 클릭하세요'
        if (pts.length === 1) return '선분의 끝점을 클릭하세요'
        return '측정할 점을 클릭하세요'
      case 'object':
        return '측정할 객체를 클릭하세요'
      default:
        return ''
    }
  })

  // ─── 엔진 내장 렌더러 ───
  const renderer = new MeasurementRenderer()

  function bindEngine(engine: CadEngine): void {
    renderer.bind(engine)
  }

  function unbindEngine(): void {
    renderer.unbind()
  }

  function setMeasureMode(mode: MeasureMode | null) {
    activeMeasureMode.value = mode
    currentPoints.value = []
    renderer.clearPreview()
  }

  function addPoint(point: Point2D) {
    if (!activeMeasureMode.value) return

    currentPoints.value.push({ ...point })

    // 자동 완료 조건 확인
    switch (activeMeasureMode.value) {
      case 'distance':
        if (currentPoints.value.length === 2) completeMeasurement()
        break
      case 'angle':
        if (currentPoints.value.length === 3) completeMeasurement()
        break
      case 'coordinate':
        // 좌표 측정: 1점 클릭 즉시 완료
        completeMeasurement()
        break
      case 'arc-length':
        // 3점: 호 시작, 경유, 끝
        if (currentPoints.value.length === 3) completeMeasurement()
        break
      case 'point-to-line':
        // 3점: 선분 시작, 선분 끝, 측정 점
        if (currentPoints.value.length === 3) completeMeasurement()
        break
    }
  }

  function completeMeasurement() {
    if (!activeMeasureMode.value) return

    let value = 0
    let unit = ''
    let auxiliary: MeasurementResult['auxiliary'] = undefined

    switch (activeMeasureMode.value) {
      case 'distance': {
        if (currentPoints.value.length >= 2) {
          value = calculateDistance(currentPoints.value[0]!, currentPoints.value[1]!)
          unit = 'mm'
        }
        break
      }
      case 'area': {
        if (currentPoints.value.length >= 3) {
          value = calculatePolygonArea(currentPoints.value)
          unit = 'mm²'
        }
        break
      }
      case 'angle': {
        if (currentPoints.value.length >= 3) {
          value = calculateAngle(
            currentPoints.value[0]!,
            currentPoints.value[1]!,
            currentPoints.value[2]!,
          )
          unit = '°'
        }
        break
      }
      case 'coordinate': {
        if (currentPoints.value.length >= 1) {
          // 좌표는 x,y를 value에 인코딩하지 않고 points를 참조
          value = 0
          unit = 'coord'
        }
        break
      }
      case 'arc-length': {
        if (currentPoints.value.length >= 3) {
          const result = calculateArcLength(
            currentPoints.value[0]!,
            currentPoints.value[1]!,
            currentPoints.value[2]!,
          )
          value = result.arcLength
          unit = 'mm'
          auxiliary = {
            arcCenter: result.center,
            arcRadius: result.radius,
            arcStartAngle: result.startAngle,
            arcEndAngle: result.endAngle,
          }
        }
        break
      }
      case 'point-to-line': {
        if (currentPoints.value.length >= 3) {
          const lineStart = currentPoints.value[0]!
          const lineEnd = currentPoints.value[1]!
          const point = currentPoints.value[2]!
          const result = calculatePointToLineDistance(point, lineStart, lineEnd)
          value = result.distance
          unit = 'mm'
          auxiliary = { projection: result.projection }
        }
        break
      }
    }

    const shouldSave =
      activeMeasureMode.value === 'coordinate' ||
      activeMeasureMode.value === 'angle' ||
      value > 0

    if (shouldSave) {
      const result: MeasurementResult = {
        id: `m-${nextId++}`,
        type: activeMeasureMode.value,
        points: [...currentPoints.value],
        value,
        unit,
        ...(auxiliary ? { auxiliary } : {}),
      }
      measurements.value.push(result)

      renderer.clearPreview()
      renderer.renderMeasurement(result)
    }

    currentPoints.value = []
  }

  function cancelMeasurement() {
    currentPoints.value = []
    activeMeasureMode.value = null
    renderer.clearPreview()
  }

  function removeMeasurement(id: string) {
    renderer.removeMeasurement(id)
    const idx = measurements.value.findIndex((m) => m.id === id)
    if (idx !== -1) {
      measurements.value.splice(idx, 1)
    }
  }

  function clearMeasurements() {
    renderer.clearAll()
    measurements.value = []
  }

  function setCursorPosition(pos: Point2D) {
    cursorPosition.value = { ...pos }
  }

  function setScreenCursorPosition(pos: Point2D) {
    screenCursorPosition.value = { ...pos }
  }

  // ─── 실시간 프리뷰 (커서 이동 시) ───
  watch(
    () => [cursorPosition.value.x, cursorPosition.value.y],
    () => {
      if (activeMeasureMode.value && currentPoints.value.length > 0) {
        renderer.renderPreview(activeMeasureMode.value, currentPoints.value, cursorPosition.value)
      }
    },
  )

  function restoreFromSnapshot(snapshot: MeasurementResult[]) {
    renderer.clearAll()
    measurements.value = snapshot
    for (const m of snapshot) {
      renderer.renderMeasurement(m)
    }
  }

  return {
    activeMeasureMode,
    currentPoints,
    measurements,
    cursorPosition,
    screenCursorPosition,
    isActive,
    lastMeasurement,
    liveValue,
    instructionText,
    bindEngine,
    unbindEngine,
    setMeasureMode,
    addPoint,
    completeMeasurement,
    cancelMeasurement,
    removeMeasurement,
    clearMeasurements,
    setCursorPosition,
    setScreenCursorPosition,
    restoreFromSnapshot,
  }
})
