/**
 * T-014: 보안 검증 테스트
 *
 * DWG 데이터가 외부로 전송되지 않고,
 * FileReader API만 사용하여 로컬에서 파일을 읽는지 검증한다.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

/**
 * src/ 디렉토리 내 모든 .ts, .vue 파일을 재귀적으로 수집한다.
 */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = []
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // node_modules, dist 제외
      if (entry !== 'node_modules' && entry !== 'dist') {
        files.push(...collectSourceFiles(fullPath))
      }
    } else if (entry.endsWith('.ts') || entry.endsWith('.vue')) {
      // 테스트 파일 제외
      if (!entry.endsWith('.test.ts') && !entry.endsWith('.spec.ts')) {
        files.push(fullPath)
      }
    }
  }

  return files
}

describe('보안 검증 (T-014)', () => {
  const srcDir = join(__dirname, '..')
  const sourceFiles = collectSourceFiles(srcDir)

  it('소스 파일이 존재한다', () => {
    expect(sourceFiles.length).toBeGreaterThan(0)
  })

  it('fetch() 호출이 소스 코드에 없다', () => {
    const violations: string[] = []

    for (const filePath of sourceFiles) {
      const content = readFileSync(filePath, 'utf-8')
      // fetch( 패턴 검색 (import 문이나 주석 제외)
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.trim()
        // 주석이나 문자열 리터럴 안의 fetch 제외
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue
        // 실제 fetch 호출 감지
        if (/\bfetch\s*\(/.test(line)) {
          violations.push(`${filePath}:${i + 1}: ${line}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('XMLHttpRequest 사용이 없다', () => {
    const violations: string[] = []

    for (const filePath of sourceFiles) {
      const content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.trim()
        // 주석 제외
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue
        // 실제 XMLHttpRequest 사용 감지 (new XMLHttpRequest 등)
        if (/\bnew\s+XMLHttpRequest\b/.test(line)) {
          violations.push(`${filePath}:${i + 1}: ${line}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('axios 사용이 없다', () => {
    const violations: string[] = []

    for (const filePath of sourceFiles) {
      const content = readFileSync(filePath, 'utf-8')
      if (/\baxios\b/.test(content)) {
        violations.push(filePath)
      }
    }

    expect(violations).toEqual([])
  })

  it('FileReader API를 파일 로딩에 사용한다', () => {
    const fileLoaderPath = sourceFiles.find((f) => f.includes('fileLoader'))
    expect(fileLoaderPath).toBeDefined()

    if (fileLoaderPath) {
      const content = readFileSync(fileLoaderPath, 'utf-8')
      expect(content).toContain('FileReader')
      expect(content).toContain('readAsArrayBuffer')
    }
  })
})
