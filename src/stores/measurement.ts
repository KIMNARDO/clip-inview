import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Point2D, MeasureMode, MeasurementResult } from '@/types/cad'
import { calculateDistance, calculatePolygonArea, calculateAngle } from '@/utils/measurement'

let nextId = 0

export const useMeasurementStore = defineStore('measurement', () => {
  const activeMeasureMode = ref<MeasureMode | null>(null)
  const currentPoints = ref<Point2D[]>([])
  const measurements = ref<MeasurementResult[]>([])
  const cursorPosition = ref<Point2D>({ x: 0, y: 0 })

  const isActive = computed(() => activeMeasureMode.value !== null)
  const lastMeasurement = computed(() =>
    measurements.value.length > 0 ? measurements.value[measurements.value.length - 1] : null,
  )

  function setMeasureMode(mode: MeasureMode | null) {
    activeMeasureMode.value = mode
    currentPoints.value = []
  }

  function addPoint(point: Point2D) {
    if (!activeMeasureMode.value) return

    currentPoints.value.push({ ...point })

    // 자동 완료 조건 확인
    if (activeMeasureMode.value === 'distance' && currentPoints.value.length === 2) {
      completeMeasurement()
    } else if (activeMeasureMode.value === 'angle' && currentPoints.value.length === 3) {
      completeMeasurement()
    }
  }

  function completeMeasurement() {
    if (!activeMeasureMode.value || currentPoints.value.length < 2) return

    let value = 0
    let unit = ''

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
    }

    if (value > 0 || activeMeasureMode.value === 'angle') {
      const result: MeasurementResult = {
        id: `m-${nextId++}`,
        type: activeMeasureMode.value,
        points: [...currentPoints.value],
        value,
        unit,
      }
      measurements.value.push(result)
    }

    currentPoints.value = []
  }

  function cancelMeasurement() {
    currentPoints.value = []
    activeMeasureMode.value = null
  }

  function clearMeasurements() {
    measurements.value = []
  }

  function setCursorPosition(pos: Point2D) {
    cursorPosition.value = { ...pos }
  }

  return {
    activeMeasureMode,
    currentPoints,
    measurements,
    cursorPosition,
    isActive,
    lastMeasurement,
    setMeasureMode,
    addPoint,
    completeMeasurement,
    cancelMeasurement,
    clearMeasurements,
    setCursorPosition,
  }
})
