/**
 * 포맷팅 유틸리티
 */

/** 좌표값을 소수점 2자리로 포맷 */
export function formatCoordinate(value: number): string {
  return value.toFixed(2)
}

/** 파일 크기를 사람이 읽기 쉬운 형태로 포맷 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** 줌 레벨을 퍼센트 문자열로 포맷 */
export function formatZoom(level: number): string {
  return `${Math.round(level)}%`
}
