/**
 * DWG → DXF 변환 클라이언트
 *
 * 백엔드 변환 서비스(/api/converter)를 호출하여
 * DWG 파일을 DXF로 변환한 File 객체를 반환한다.
 */

export interface ConvertResponse {
  success: boolean
  file?: File
  error?: string
}

const API_BASE = '/api/converter'

/** ODA File Converter 경로 유효성 검증 */
export async function validateOdaPath(odaPath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ odaPath }),
    })
    return await res.json()
  } catch {
    return { valid: false, error: '변환 서비스에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.' }
  }
}

/** DWG 파일을 DXF로 변환 */
export async function convertDwgToDxf(
  file: File,
  odaPath: string,
  outputVersion = 'ACAD2018',
): Promise<ConvertResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('odaPath', odaPath)
    formData.append('outputVersion', outputVersion)

    const res = await fetch(`${API_BASE}/convert`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: '변환 서비스 오류' }))
      return { success: false, error: errorData.error || `변환 실패 (HTTP ${res.status})` }
    }

    // 응답이 DXF 파일 바이너리
    const blob = await res.blob()
    const dxfFileName = file.name.replace(/\.dwg$/i, '.dxf')
    const dxfFile = new File([blob], dxfFileName, { type: 'application/dxf' })

    return { success: true, file: dxfFile }
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      return { success: false, error: '변환 서비스에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.' }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : '알 수 없는 변환 오류',
    }
  }
}

/** 변환 서비스 연결 확인 */
export async function checkConverterService(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}
