import { describe, it, expect } from 'vitest'
import { formatCoordinate, formatFileSize, formatZoom } from './format'

describe('formatCoordinate', () => {
  it('소수점 2자리로 포맷한다', () => {
    expect(formatCoordinate(0)).toBe('0.00')
    expect(formatCoordinate(123.456)).toBe('123.46')
    expect(formatCoordinate(-50.1)).toBe('-50.10')
  })
})

describe('formatFileSize', () => {
  it('바이트를 사람이 읽기 쉬운 형태로 변환한다', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })
})

describe('formatZoom', () => {
  it('줌 레벨을 퍼센트로 포맷한다', () => {
    expect(formatZoom(100)).toBe('100%')
    expect(formatZoom(150.5)).toBe('151%')
    expect(formatZoom(25)).toBe('25%')
  })
})
