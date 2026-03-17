import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMeasurementStore } from './measurement'

describe('useMeasurementStore', () => {
  let store: ReturnType<typeof useMeasurementStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMeasurementStore()
  })

  it('초기 상태가 올바르다', () => {
    expect(store.activeMeasureMode).toBeNull()
    expect(store.currentPoints).toEqual([])
    expect(store.measurements).toEqual([])
    expect(store.isActive).toBe(false)
    expect(store.lastMeasurement).toBeNull()
  })

  it('setMeasureMode로 측정 모드를 설정한다', () => {
    store.setMeasureMode('distance')
    expect(store.activeMeasureMode).toBe('distance')
    expect(store.isActive).toBe(true)
  })

  it('setMeasureMode(null)로 모드를 해제한다', () => {
    store.setMeasureMode('distance')
    store.setMeasureMode(null)
    expect(store.activeMeasureMode).toBeNull()
    expect(store.isActive).toBe(false)
  })

  it('setMeasureMode가 currentPoints를 초기화한다', () => {
    store.setMeasureMode('distance')
    store.addPoint({ x: 10, y: 20 })
    store.setMeasureMode('area')
    expect(store.currentPoints).toEqual([])
  })

  it('모드 없이 addPoint는 무시된다', () => {
    store.addPoint({ x: 10, y: 20 })
    expect(store.currentPoints).toEqual([])
  })

  it('addPoint가 포인트를 깊은 복사한다', () => {
    store.setMeasureMode('area')
    const p = { x: 10, y: 20 }
    store.addPoint(p)
    p.x = 999
    expect(store.currentPoints[0]!.x).toBe(10)
  })

  // --- Distance auto-completion ---
  it('거리 측정: 2점 클릭 시 자동 완료된다', () => {
    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 3, y: 4 })

    expect(store.measurements).toHaveLength(1)
    expect(store.measurements[0]!.type).toBe('distance')
    expect(store.measurements[0]!.value).toBeCloseTo(5)
    expect(store.measurements[0]!.unit).toBe('mm')
    expect(store.currentPoints).toEqual([])
  })

  // --- Angle auto-completion ---
  it('각도 측정: 3점 클릭 시 자동 완료된다', () => {
    store.setMeasureMode('angle')
    store.addPoint({ x: 1, y: 0 })
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 0, y: 1 })

    expect(store.measurements).toHaveLength(1)
    expect(store.measurements[0]!.type).toBe('angle')
    expect(store.measurements[0]!.value).toBeCloseTo(90)
    expect(store.measurements[0]!.unit).toBe('°')
  })

  // --- Area manual completion ---
  it('면적 측정: 수동 completeMeasurement로 완료한다', () => {
    store.setMeasureMode('area')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 10, y: 0 })
    store.addPoint({ x: 10, y: 10 })
    store.addPoint({ x: 0, y: 10 })

    expect(store.measurements).toHaveLength(0) // 자동 완료 안 됨
    store.completeMeasurement()

    expect(store.measurements).toHaveLength(1)
    expect(store.measurements[0]!.type).toBe('area')
    expect(store.measurements[0]!.value).toBeCloseTo(100)
    expect(store.measurements[0]!.unit).toBe('mm²')
  })

  it('completeMeasurement: 포인트 부족 시 무시된다', () => {
    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.completeMeasurement()
    expect(store.measurements).toHaveLength(0)
  })

  it('completeMeasurement: 모드 없으면 무시된다', () => {
    store.completeMeasurement()
    expect(store.measurements).toHaveLength(0)
  })

  it('cancelMeasurement가 모드와 포인트를 초기화한다', () => {
    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.cancelMeasurement()

    expect(store.activeMeasureMode).toBeNull()
    expect(store.currentPoints).toEqual([])
  })

  it('clearMeasurements가 결과 목록만 초기화한다', () => {
    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 5, y: 0 })
    expect(store.measurements).toHaveLength(1)

    store.clearMeasurements()
    expect(store.measurements).toEqual([])
  })

  it('setCursorPosition이 커서 위치를 업데이트한다', () => {
    store.setCursorPosition({ x: 42, y: 99 })
    expect(store.cursorPosition).toEqual({ x: 42, y: 99 })
  })

  it('lastMeasurement가 마지막 결과를 반환한다', () => {
    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 3, y: 4 })

    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 6, y: 8 })

    expect(store.lastMeasurement!.value).toBeCloseTo(10)
  })

  it('측정 결과에 고유 ID가 부여된다', () => {
    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 1, y: 0 })

    store.setMeasureMode('distance')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 2, y: 0 })

    expect(store.measurements[0]!.id).not.toBe(store.measurements[1]!.id)
  })
})
