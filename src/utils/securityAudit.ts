/**
 * 보안 감사 유틸리티
 *
 * 런타임에서 보안 정책 위반을 감지하고 경고한다.
 * 개발 모드에서만 활성화되며, 프로덕션에서는 no-op.
 */

export interface SecurityViolation {
  type: 'csp' | 'external-request' | 'insecure-protocol'
  detail: string
  timestamp: number
}

const violations: SecurityViolation[] = []
let isMonitoring = false

/**
 * 보안 모니터링 시작 (개발 모드 전용)
 *
 * - CSP 위반 리스너 등록
 * - fetch/XMLHttpRequest 인터셉터로 외부 요청 감지
 */
export function startSecurityMonitor(): void {
  if (isMonitoring) return
  isMonitoring = true

  // CSP 위반 감지
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation: SecurityViolation = {
      type: 'csp',
      detail: `CSP 위반: ${event.violatedDirective} — ${event.blockedURI || 'inline'}`,
      timestamp: Date.now(),
    }
    violations.push(violation)
    console.warn('[보안 감사]', violation.detail)
  })

  // Performance Observer로 외부 리소스 요청 감지
  if (typeof PerformanceObserver !== 'undefined') {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const url = (entry as PerformanceResourceTiming).name
          if (isExternalUrl(url)) {
            const violation: SecurityViolation = {
              type: 'external-request',
              detail: `외부 리소스 요청 감지: ${url}`,
              timestamp: Date.now(),
            }
            violations.push(violation)
            console.error('[보안 경고]', violation.detail)
          }
        }
      }
    })
    observer.observe({ entryTypes: ['resource'] })
  }
}

/**
 * 수집된 보안 위반 목록 반환
 */
export function getViolations(): SecurityViolation[] {
  return [...violations]
}

/**
 * 보안 감사 보고서 생성
 */
export function generateAuditReport(): string {
  const lines = [
    '=== Clip-inView 보안 감사 보고서 ===',
    `생성 시간: ${new Date().toISOString()}`,
    `위반 건수: ${violations.length}`,
    '',
  ]

  if (violations.length === 0) {
    lines.push('✅ 보안 위반이 감지되지 않았습니다.')
  } else {
    for (const v of violations) {
      lines.push(`❌ [${v.type}] ${v.detail} (${new Date(v.timestamp).toISOString()})`)
    }
  }

  lines.push('')
  lines.push('--- CSP 정책 확인 ---')
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
  lines.push(cspMeta ? `CSP: ${cspMeta.getAttribute('content')}` : 'CSP meta 태그 없음 (nginx 헤더 확인 필요)')

  return lines.join('\n')
}

/**
 * URL이 외부(사내망 외부) 주소인지 판별
 */
function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    const currentHost = window.location.hostname

    // localhost, 127.0.0.1, 사내 IP 대역은 내부로 간주
    const internalPatterns = [
      currentHost,
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
    ]

    // 사설 IP 대역 (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(parsed.hostname)) {
      return false
    }

    return !internalPatterns.includes(parsed.hostname)
  } catch {
    return false
  }
}
