# clip-inview — PLM CAD Viewer 프로젝트

## 프로젝트 개요
제조업체를 위한 온프레미스 DWG 뷰어.
도면이 외부 클라우드로 전송되지 않는 보안 아키텍처.
mlightcad/cad-viewer 기반으로 브라우저에서 DWG/DXF를 직접 파싱·렌더링한다.

## 기술 스택
- Frontend: TypeScript, Vue 3 (Composition API), Three.js
- - DWG 엔진: @mlightcad/cad-viewer (브라우저 내 파싱/렌더링, 서버 불필요)
  - - Backend: Node.js (파일 서빙 + PLM 메타데이터 API만 담당)
    - - 빌드: pnpm, Vite
      - - 테스트: Vitest
        - - 스타일: Tailwind CSS (다크 테마 기본)
          - - IDE: Cursor + Claude Code
           
            - ## 보안 원칙 (P0 — 최우선)
            - - DWG/DXF 파일은 절대 외부 서버/클라우드로 전송하지 않는다
              - - 모든 도면 파싱/렌더링은 클라이언트(브라우저)에서 수행한다
                - - 사내망(온프레미스) 배포를 기본으로 설계한다
                  - - 서드파티 CDN 의존성 없이 모든 라이브러리를 번들에 포함한다
                   
                    - ## 에이전트 역할
                    - 이 프로젝트는 3개의 서브에이전트가 협업한다:
                    - - **PM** : 요구사항 정의, 일정 관리, 이슈 트래킹, 문서 작성
                      - - **DEV** : 코드 구현, API 설계, 테스트, 성능 최적화
                        - - **Design** : UI/UX 설계, 컴포넌트 디자인, 디자인 시스템
                         
                          - ## 코딩 컨벤션
                          - - TypeScript strict mode 사용
                            - - 컴포넌트 파일명: PascalCase (예: CadViewer.vue)
                              - - 함수/변수: camelCase
                                - - 상수: UPPER_SNAKE_CASE
                                  - - 테스트 파일: *.test.ts (Vitest)
                                    - - 커밋 메시지: Conventional Commits (feat:, fix:, docs:, style:, refactor:)
                                     
                                      - ## 마일스톤
                                      - - **M1**: DWG 파일 열기 + 기본 뷰잉 (Pan/Zoom/Fit)
                                        - - **M2**: 레이어 관리 + 측정 도구 (거리/면적/각도)
                                          - - **M3**: 마크업 + BOM 트리 연동
                                            - - **M4**: 사내 배포 + 보안 감사 + 성능 튜닝
