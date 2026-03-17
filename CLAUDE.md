# clip-inview — PLM CAD Viewer 프로젝트

## 프로젝트 개요
제조업체를 위한 온프레미스 DWG 뷰어.
도면이 외부 클라우드로 전송되지 않는 보안 아키텍처.
mlightcad/cad-viewer 기반으로 브라우저에서 DWG/DXF를 직접 파싱·렌더링한다.

## 기술 스택
- Frontend: TypeScript, Vue 3 (Composition API), Three.js
- DWG 엔진: @mlightcad/cad-viewer (브라우저 내 파싱/렌더링, 서버 불필요)
- Backend: Node.js (파일 서빙 + PLM 메타데이터 API만 담당)
- 빌드: pnpm, Vite
- 테스트: Vitest
- 스타일: Tailwind CSS (다크 테마 기본)
- IDE: Cursor + Claude Code

## 보안 원칙 (P0 — 최우선)
- DWG/DXF 파일은 절대 외부 서버/클라우드로 전송하지 않는다
- 모든 도면 파싱/렌더링은 클라이언트(브라우저)에서 수행한다
- 사내망(온프레미스) 배포를 기본으로 설계한다
- 서드파티 CDN 의존성 없이 모든 라이브러리를 번들에 포함한다

## 에이전트 역할
이 프로젝트는 3개의 서브에이전트가 협업한다:
- **PM** : 요구사항 정의, 일정 관리, 이슈 트래킹, 문서 작성
- **DEV** : 코드 구현, API 설계, 테스트, 성능 최적화
- **Design** : UI/UX 설계, 컴포넌트 디자인, 디자인 시스템

## 코딩 컨벤션
- TypeScript strict mode 사용
- 컴포넌트 파일명: PascalCase (예: CadViewer.vue)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 테스트 파일: *.test.ts (Vitest)
- 커밋 메시지: Conventional Commits (feat:, fix:, docs:, style:, refactor:)

## Git 워크플로우 (필수)

### 세션 시작 시 (MUST)
1. `git fetch origin` → `git status` 로 원격과 로컬 차이 확인
2. 로컬이 뒤처져 있으면 `git pull origin main` 실행
3. 충돌이 있으면 사용자에게 알리고 해결 후 진행

### 세션 종료 시 (개발 완료 후)
1. 변경된 파일을 확인하고 의미 있는 단위로 커밋
2. 커밋 메시지는 Conventional Commits 형식 (feat:, fix:, docs: 등)
3. `git push origin main` 으로 원격 저장소에 푸시
4. 사용자에게 커밋 내용 요약 보고

### 주의사항
- 2대 PC에서 작업하므로 항상 pull → 작업 → commit → push 순서를 지킨다
- .env, credentials 등 민감 파일은 커밋하지 않는다
- node_modules, dist, .playwright-mcp 는 .gitignore에 포함

## 마일스톤
- **M1**: DWG 파일 열기 + 기본 뷰잉 (Pan/Zoom/Fit)
- **M2**: 레이어 관리 + 측정 도구 (거리/면적/각도)
- **M3**: 마크업 + BOM 트리 연동
- **M4**: 사내 배포 + 보안 감사 + 성능 튜닝
