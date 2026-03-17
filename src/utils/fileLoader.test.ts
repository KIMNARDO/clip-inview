import { describe, it, expect } from 'vitest'
import {
  validateFileType,
  validateFileSize,
  getFileInfo,
  formatFileInfo,
} from './fileLoader'

describe('validateFileType', () => {
  it('DWG 파일을 허용한다', () => {
    const file = new File([''], 'drawing.dwg')
    expect(validateFileType(file)).toBe(true)
  })

  it('DXF 파일을 허용한다', () => {
    const file = new File([''], 'drawing.dxf')
    expect(validateFileType(file)).toBe(true)
  })

  it('대문자 확장자도 허용한다', () => {
    const file = new File([''], 'DRAWING.DWG')
    expect(validateFileType(file)).toBe(true)
  })

  it('지원하지 않는 파일 형식을 거부한다', () => {
    expect(validateFileType(new File([''], 'image.png'))).toBe(false)
    expect(validateFileType(new File([''], 'doc.pdf'))).toBe(false)
    expect(validateFileType(new File([''], 'script.js'))).toBe(false)
  })

  it('확장자 없는 파일을 거부한다', () => {
    const file = new File([''], 'noextension')
    expect(validateFileType(file)).toBe(false)
  })
})

describe('validateFileSize', () => {
  it('일반 크기 파일을 허용한다', () => {
    const file = new File(['x'.repeat(1024)], 'test.dwg')
    expect(validateFileSize(file)).toBe(true)
  })

  it('빈 파일(0 bytes)을 거부한다', () => {
    const file = new File([], 'empty.dwg')
    expect(validateFileSize(file)).toBe(false)
  })
})

describe('getFileInfo', () => {
  it('파일 정보를 올바르게 추출한다', () => {
    const file = new File(['test data'], 'plan.dwg', { type: 'application/acad' })
    const info = getFileInfo(file)

    expect(info.name).toBe('plan.dwg')
    expect(info.size).toBe(9) // 'test data' = 9 bytes
    expect(info.type).toBe('application/acad')
    expect(info.lastModified).toBeGreaterThan(0)
  })

  it('MIME type이 없으면 확장자에서 감지한다', () => {
    const dwgFile = new File(['data'], 'test.dwg', { type: '' })
    const dwgInfo = getFileInfo(dwgFile)
    expect(dwgInfo.type).toBe('application/acad')

    const dxfFile = new File(['data'], 'test.dxf', { type: '' })
    const dxfInfo = getFileInfo(dxfFile)
    expect(dxfInfo.type).toBe('application/dxf')
  })
})

describe('formatFileInfo', () => {
  it('파일 정보를 읽기 쉬운 형태로 포맷한다', () => {
    const result = formatFileInfo({
      name: 'plan.dwg',
      size: 1048576, // 1MB
      type: 'application/acad',
      lastModified: Date.now(),
    })
    expect(result).toBe('plan.dwg (DWG, 1.0 MB)')
  })
})
