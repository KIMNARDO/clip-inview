/**
 * FileReader API 기반 파일 로더
 *
 * 보안 원칙: fetch/XMLHttpRequest를 사용하지 않고
 * FileReader API로만 로컬 파일을 읽는다.
 */

import type { FileInfo } from '@/types/cad'
import { formatFileSize } from '@/utils/format'

/** 허용되는 파일 확장자 */
const ALLOWED_EXTENSIONS = ['.dwg', '.dxf'] as const

/** 최대 파일 크기 (500MB) */
const MAX_FILE_SIZE = 500 * 1024 * 1024

/**
 * 파일의 확장자가 허용된 CAD 포맷인지 검증한다.
 * @param file - 검증할 File 객체
 * @returns DWG 또는 DXF 파일이면 true
 */
export function validateFileType(file: File): boolean {
  const ext = getFileExtension(file.name)
  return ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
}

/**
 * 파일 크기가 허용 범위 내인지 검증한다.
 * @param file - 검증할 File 객체
 * @returns 500MB 이하이면 true
 */
export function validateFileSize(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE
}

/**
 * 파일을 ArrayBuffer로 읽는다.
 * FileReader API만 사용하며 네트워크 요청을 하지 않는다.
 *
 * @param file - 읽을 File 객체
 * @returns ArrayBuffer promise
 * @throws 파일 읽기 실패 시 에러
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('파일을 ArrayBuffer로 읽을 수 없습니다'))
      }
    }

    reader.onerror = () => {
      reject(new Error(`파일 읽기 실패: ${reader.error?.message ?? '알 수 없는 오류'}`))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * File 객체에서 파일 정보를 추출한다.
 * @param file - File 객체
 * @returns 파일 정보
 */
export function getFileInfo(file: File): FileInfo {
  return {
    name: file.name,
    size: file.size,
    type: file.type || detectMimeType(file.name),
    lastModified: file.lastModified,
  }
}

/**
 * 파일 정보를 사람이 읽기 쉬운 형태로 포맷한다.
 * @param info - 파일 정보
 * @returns 포맷된 파일 정보 문자열
 */
export function formatFileInfo(info: FileInfo): string {
  const ext = getFileExtension(info.name).toUpperCase().replace('.', '')
  return `${info.name} (${ext}, ${formatFileSize(info.size)})`
}

/**
 * 드래그 이벤트에서 유효한 CAD 파일을 추출한다.
 * @param event - DragEvent
 * @returns 유효한 File 또는 null
 */
export function extractFileFromDragEvent(event: DragEvent): File | null {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return null

  const file = files[0]
  if (!file || !validateFileType(file)) return null

  return file
}

/**
 * 파일 선택 다이얼로그를 열고 선택된 파일을 반환한다.
 * @returns 선택된 File promise (취소하면 null)
 */
export function openFileDialog(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ALLOWED_EXTENSIONS.join(',')

    input.onchange = () => {
      const file = input.files?.[0] ?? null
      resolve(file)
    }

    // 취소 감지 (포커스 복귀 시)
    input.addEventListener('cancel', () => {
      resolve(null)
    })

    input.click()
  })
}

// --- 내부 유틸 ---

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot < 0) return ''
  return filename.substring(lastDot).toLowerCase()
}

function detectMimeType(filename: string): string {
  const ext = getFileExtension(filename)
  if (ext === '.dwg') return 'application/acad'
  if (ext === '.dxf') return 'application/dxf'
  return 'application/octet-stream'
}
