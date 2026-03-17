import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  calculatePolygonArea,
  calculateAngle,
  formatMeasurement,
} from './measurement'

describe('calculateDistance', () => {
  it('수평 거리를 계산한다', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10)
  })

  it('수직 거리를 계산한다', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 0, y: 7 })).toBe(7)
  })

  it('대각선 거리를 계산한다 (3-4-5)', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5)
  })

  it('같은 점이면 0을 반환한다', () => {
    expect(calculateDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
  })

  it('음수 좌표도 올바르게 계산한다', () => {
    expect(calculateDistance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBeCloseTo(5)
  })
})

describe('calculatePolygonArea', () => {
  it('정사각형 면적을 계산한다', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    expect(calculatePolygonArea(square)).toBeCloseTo(100)
  })

  it('삼각형 면적을 계산한다', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
    ]
    expect(calculatePolygonArea(triangle)).toBeCloseTo(50)
  })

  it('2점 이하이면 0을 반환한다', () => {
    expect(calculatePolygonArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0)
    expect(calculatePolygonArea([{ x: 0, y: 0 }])).toBe(0)
    expect(calculatePolygonArea([])).toBe(0)
  })

  it('반시계 방향도 양수를 반환한다', () => {
    const ccw = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
    ]
    expect(calculatePolygonArea(ccw)).toBeCloseTo(100)
  })
})

describe('calculateAngle', () => {
  it('직각(90°)을 계산한다', () => {
    expect(calculateAngle(
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    )).toBeCloseTo(90)
  })

  it('평각(180°)을 계산한다', () => {
    expect(calculateAngle(
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    )).toBeCloseTo(180)
  })

  it('45도를 계산한다', () => {
    expect(calculateAngle(
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    )).toBeCloseTo(45)
  })

  it('같은 점이면 0을 반환한다', () => {
    expect(calculateAngle(
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    )).toBe(0)
  })
})

describe('formatMeasurement', () => {
  it('각도를 포맷한다', () => {
    expect(formatMeasurement(90, '°')).toBe('90.0°')
  })

  it('mm 거리를 포맷한다', () => {
    expect(formatMeasurement(123.456, 'mm')).toBe('123.46 mm')
  })

  it('1000mm 이상은 cm로 변환한다', () => {
    expect(formatMeasurement(1500, 'mm')).toBe('1.50 cm')
  })

  it('1000000mm 이상은 m로 변환한다', () => {
    expect(formatMeasurement(2000000, 'mm')).toBe('2.00 m')
  })

  it('mm² 면적: 1000 이상은 cm²로 변환한다', () => {
    expect(formatMeasurement(5000, 'mm²')).toBe('5.00 cm²')
  })

  it('mm² 면적: 1000000 이상은 m²로 변환한다', () => {
    expect(formatMeasurement(3000000, 'mm²')).toBe('3.00 m²')
  })
})
