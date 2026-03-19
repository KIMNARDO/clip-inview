# M4 스프린트 계획서 — 배포 + 보안 감사 + 성능 튜닝

| 항목 | 내용 |
|------|------|
| 스프린트 | M4 (Sprint 4) |
| 기간 | 1주 (5 영업일) |
| 목표 | 온프레미스 Docker 배포, 보안 감사 완료, 성능 최적화 |

---

## 1. 완료 항목

### F-030: Docker 컨테이너화
- [x] 멀티스테이지 Dockerfile (node:22-alpine → nginx:1.27-alpine)
- [x] nginx.conf — CSP 헤더, gzip 압축, 캐싱 정책
- [x] docker-compose.yml — 원커맨드 배포
- [x] .dockerignore — 불필요 파일 제외
- [x] 비-루트 사용자 실행 (보안 강화)
- [x] 헬스체크 설정

### F-031: 보안 감사
- [x] CSP (Content-Security-Policy) 적용
  - default-src 'self' — 외부 리소스 차단
  - script-src 'wasm-unsafe-eval' — WASM 허용
  - connect-src 'self' — 외부 API 호출 차단
  - frame-ancestors 'none' — 클릭재킹 방지
- [x] 보안 헤더: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- [x] securityAudit.ts — 런타임 보안 모니터링 (CSP 위반 감지, 외부 요청 감지)
- [x] 개발 모드 자동 활성화

### F-032: 성능 튜닝
- [x] Vite 빌드 최적화: 청크 분리 (vue-vendor, cad-engine, ui-vendor)
- [x] 소스맵 비활성화 (프로덕션)
- [x] nginx gzip 압축 (JS, CSS, WASM)
- [x] 정적 에셋 장기 캐시 (1년, immutable)
- [x] WASM 파일 올바른 MIME 타입 설정

### F-033/F-034: 가이드
- 배포 가이드: Dockerfile + docker-compose로 `docker compose up -d` 원커맨드 배포
- 사용자 가이드: 앱 내 웰컴 스크린 + 단축키 안내로 대체

---

## 2. 배포 방법

```bash
# 빌드 및 실행
docker compose up -d

# 접속
http://localhost:8080

# 정지
docker compose down
```

## 3. 보안 체크리스트

| 항목 | 상태 |
|------|------|
| DWG/DXF 파일 외부 전송 없음 | ✅ |
| CSP 헤더로 외부 도메인 차단 | ✅ |
| 서드파티 CDN 의존성 없음 (모두 번들) | ✅ |
| X-Frame-Options DENY | ✅ |
| 소스맵 프로덕션 비활성화 | ✅ |
| 비-루트 컨테이너 실행 | ✅ |
| 런타임 보안 모니터링 (DEV) | ✅ |
