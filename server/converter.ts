/**
 * ODA File Converter 연동 서비스
 *
 * ODA File Converter CLI를 호출하여 DWG → DXF 변환을 수행한다.
 * ODA CLI 사용법: ODAFileConverter "inputDir" "outputDir" ACAD2018 DXF 0 1 "filename"
 *
 * 보안:
 * - 입력/출력 경로는 임시 디렉토리로 제한
 * - ODA 실행 파일 경로는 서버 설정으로만 변경 가능
 * - 변환 완료 후 임시 파일 자동 정리
 */

import { execFile } from 'node:child_process'
import { mkdir, copyFile, readFile, unlink, rmdir, access, stat } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

export interface ConvertOptions {
  /** ODA File Converter 실행 파일 경로 */
  odaPath: string
  /** 출력 DXF 버전 */
  outputVersion?: string
  /** 변환 타임아웃 (ms) */
  timeout?: number
}

export interface ConvertResult {
  success: boolean
  /** 변환된 DXF 파일의 Buffer (성공 시) */
  dxfBuffer?: Buffer
  /** 변환된 DXF 파일명 */
  dxfFileName?: string
  /** 에러 메시지 (실패 시) */
  error?: string
}

/** ODA 실행 파일 존재 여부 확인 */
export async function validateOdaPath(odaPath: string): Promise<{ valid: boolean; error?: string }> {
  if (!odaPath || odaPath.trim().length === 0) {
    return { valid: false, error: 'ODA 경로가 비어 있습니다.' }
  }

  try {
    const stats = await stat(odaPath)
    if (!stats.isFile()) {
      return { valid: false, error: '지정한 경로가 파일이 아닙니다.' }
    }
    await access(odaPath)
    return { valid: true }
  } catch {
    return { valid: false, error: `파일을 찾을 수 없습니다: ${odaPath}` }
  }
}

/**
 * DWG 파일을 DXF로 변환
 *
 * 1. 임시 입력/출력 디렉토리 생성
 * 2. DWG 파일을 입력 디렉토리에 복사
 * 3. ODA CLI 실행
 * 4. 출력 디렉토리에서 DXF 파일 읽기
 * 5. 임시 파일 정리
 */
export async function convertDwgToDxf(
  dwgBuffer: Buffer,
  originalFileName: string,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const jobId = randomUUID()
  const jobDir = join(tmpdir(), `clip-inview-convert-${jobId}`)
  const inputDir = join(jobDir, 'input')
  const outputDir = join(jobDir, 'output')

  try {
    // 1. 임시 디렉토리 생성
    await mkdir(inputDir, { recursive: true })
    await mkdir(outputDir, { recursive: true })

    // 2. DWG 파일을 입력 디렉토리에 저장
    const dwgFileName = basename(originalFileName)
    const inputFilePath = join(inputDir, dwgFileName)
    const { writeFile } = await import('node:fs/promises')
    await writeFile(inputFilePath, dwgBuffer)

    // 3. ODA CLI 실행
    const version = options.outputVersion ?? 'ACAD2018'
    const timeout = options.timeout ?? 60_000

    await new Promise<void>((resolve, reject) => {
      // ODA CLI: ODAFileConverter "inputDir" "outputDir" version DXF 0 1
      // 0 = Audit: no, 1 = recursive: yes
      execFile(
        options.odaPath,
        [inputDir, outputDir, version, 'DXF', '0', '1'],
        { timeout, windowsHide: true },
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(`ODA 변환 실패: ${error.message}${stderr ? ` — ${stderr}` : ''}`))
          } else {
            resolve()
          }
        },
      )
    })

    // 4. 출력 디렉토리에서 DXF 파일 읽기
    const dxfFileName = dwgFileName.replace(/\.dwg$/i, '.dxf')
    const outputFilePath = join(outputDir, dxfFileName)

    try {
      const dxfBuffer = await readFile(outputFilePath)
      return {
        success: true,
        dxfBuffer,
        dxfFileName,
      }
    } catch {
      return {
        success: false,
        error: `변환된 DXF 파일을 찾을 수 없습니다. ODA 변환이 실패했을 수 있습니다.`,
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 변환 오류',
    }
  } finally {
    // 5. 임시 파일 정리
    await cleanupDir(jobDir)
  }
}

/** 임시 디렉토리 재귀 삭제 */
async function cleanupDir(dirPath: string): Promise<void> {
  try {
    const { readdir } = await import('node:fs/promises')
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        await cleanupDir(fullPath)
      } else {
        await unlink(fullPath).catch(() => {})
      }
    }
    await rmdir(dirPath).catch(() => {})
  } catch {
    // 정리 실패는 무시 — OS가 임시 파일을 정리할 것
  }
}
