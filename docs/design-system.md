# Clip-inView Design System

| 항목 | 내용 |
|------|------|
| 문서 상태 | **v1.0** |
| 최종 수정 | 2026-03-16 |
| 작성자 | Design Agent |
| 대상 | DEV Agent, PM Agent |

---

## 1. 디자인 원칙

| 원칙 | 설명 | 기준 |
|------|------|------|
| 도면 중심 | 화면의 80% 이상을 도면 뷰포트에 할당 | ViewerCanvas = flex-1 |
| 최소 클릭 | 주요 기능은 2클릭 이내 접근 | Ribbon + LeftToolbar |
| 다크 테마 기본 | 제조 현장 모니터 가독성 최적화 | 어두운 배경, 밝은 텍스트 |
| 접근성 | WCAG 2.1 AA 기준 준수 | 명도 대비 4.5:1 이상 |

---

## 2. 색상 시스템

### 2.1 배경 색상

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| bg-app | `--cad-bg-app` | `#1E1F22` | 앱 최외곽 배경 |
| bg-panel | `--cad-bg-panel` | `#27292D` | 패널, 사이드바 배경 |
| bg-tab | `--cad-bg-tab` | `#2B2D31` | 탭, 리본 영역 배경 |
| bg-canvas | `--cad-bg-canvas` | `#1A1A1A` | ViewerCanvas 배경 |
| bg-primary | `--cad-bg-primary` | `#1a1a2e` | 대체 기본 배경 (Figma 토큰) |
| bg-secondary | `--cad-bg-secondary` | `#16213e` | 대체 보조 배경 (Figma 토큰) |
| bg-viewport | `--cad-bg-viewport` | `#0a0a0a` | 뷰포트 딥 블랙 (Figma 토큰) |

### 2.2 텍스트 색상

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| text-primary | `--cad-text-primary` | `#D4D4D4` | 기본 텍스트 (gray-300) |
| text-secondary | `--cad-text-secondary` | `#A3A3A3` | 보조 텍스트 (gray-400) |
| text-muted | `--cad-text-muted` | `#737373` | 비활성/힌트 텍스트 (gray-500) |
| text-accent | `--cad-text-accent` | `#53c1de` | 강조 텍스트 (Figma 토큰) |

### 2.3 액센트 색상

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| accent-primary | `--cad-accent-primary` | `#3B82F6` | 주요 액센트 (blue-500), 활성 탭 border-top |
| accent-hover | `--cad-accent-hover` | `#2563EB` | 액센트 호버 (blue-600) |
| accent-active-bg | `--cad-accent-active-bg` | `rgba(37, 99, 235, 0.2)` | 활성 도구 배경 (blue-600/20) |
| accent-active-text | `--cad-accent-active-text` | `#60A5FA` | 활성 도구 텍스트 (blue-400) |
| accent-active-border | `--cad-accent-active-border` | `rgba(59, 130, 246, 0.5)` | 활성 도구 보더 (blue-500/50) |
| accent-red | `--cad-accent-red` | `#e94560` | 보조 액센트 (Figma 토큰) |

### 2.4 상태 색상

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| status-success | `--cad-status-success` | `#4caf50` | 성공, 정상 |
| status-warning | `--cad-status-warning` | `#ff9800` | 경고 |
| status-error | `--cad-status-error` | `#f44336` | 에러, 실패 |
| status-info | `--cad-status-info` | `#53c1de` | 정보 |

### 2.5 보더 색상

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| border-default | `--cad-border-default` | `#3E4044` | 기본 보더 |
| border-subtle | `--cad-border-subtle` | `#2a2a4a` | 미세한 보더 (Figma 토큰) |
| border-hover | `--cad-border-hover` | `#525560` | 호버 시 보더 |

### 2.6 인터랙션 색상

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| hover-bg | `--cad-hover-bg` | `#323539` | 호버 배경 (약한) |
| hover-bg-strong | `--cad-hover-bg-strong` | `#3E4044` | 호버 배경 (강한) |

### 2.7 명도 대비 검증 (WCAG 2.1 AA)

| 전경 | 배경 | 대비 | 판정 |
|------|------|------|------|
| `#D4D4D4` (text-primary) | `#1E1F22` (bg-app) | 11.2:1 | AA Pass |
| `#D4D4D4` (text-primary) | `#27292D` (bg-panel) | 9.2:1 | AA Pass |
| `#A3A3A3` (text-secondary) | `#27292D` (bg-panel) | 5.3:1 | AA Pass |
| `#737373` (text-muted) | `#27292D` (bg-panel) | 3.1:1 | AA Fail (대형 텍스트만) |
| `#60A5FA` (accent-active-text) | `#27292D` (bg-panel) | 5.8:1 | AA Pass |
| `#3B82F6` (accent-primary) | `#1E1F22` (bg-app) | 4.6:1 | AA Pass |

> **참고**: `text-muted`는 14px 이하 텍스트에 단독 사용하지 않는다. 보조 정보, 아이콘 라벨, 플레이스홀더에만 사용한다.

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
--cad-font-primary: 'Inter', 'Noto Sans KR', sans-serif;
--cad-font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

| 용도 | 폰트 | 비고 |
|------|------|------|
| UI 전반 | Inter + Noto Sans KR | 라틴 + 한글 커버 |
| 좌표값, 코드, CommandPalette | JetBrains Mono | 고정폭 |

### 3.2 크기 스케일

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| text-2xs | `--cad-text-2xs` | `10px` | 상태바 보조 텍스트 |
| text-xs | `--cad-text-xs` | `11px` | 상태바, 좌표값 |
| text-sm | `--cad-text-sm` | `12px` | 패널 내 기본 텍스트, 버튼 라벨 |
| text-base | `--cad-text-base` | `13px` | 리본 라벨, 속성값 |
| text-md | `--cad-text-md` | `14px` | 탭 제목, 메뉴 항목 |
| text-lg | `--cad-text-lg` | `16px` | 패널 헤더 |
| text-xl | `--cad-text-xl` | `18px` | 모달 제목 |
| text-2xl | `--cad-text-2xl` | `24px` | 페이지 제목 (드물게 사용) |

> CAD 소프트웨어 특성상 전반적으로 작은 폰트 크기를 사용하여 UI 영역을 최소화하고 도면 뷰포트 공간을 극대화한다.

### 3.3 폰트 무게

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| font-normal | `--cad-font-normal` | `400` | 기본 텍스트 |
| font-medium | `--cad-font-medium` | `500` | 탭 제목, 라벨 |
| font-semibold | `--cad-font-semibold` | `600` | 패널 헤더, 강조 |

### 3.4 줄 높이

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| leading-tight | `--cad-leading-tight` | `1.2` | 컴팩트 UI 요소 |
| leading-normal | `--cad-leading-normal` | `1.5` | 기본 텍스트 |
| leading-relaxed | `--cad-leading-relaxed` | `1.75` | 설명 텍스트, 도움말 |

---

## 4. 간격 시스템

기본 단위: **4px**

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| space-0 | `--cad-space-0` | `0px` | 없음 |
| space-1 | `--cad-space-1` | `4px` | 아이콘-텍스트 간격, 미세 패딩 |
| space-2 | `--cad-space-2` | `8px` | 리스트 아이템 패딩, 인라인 간격 |
| space-3 | `--cad-space-3` | `12px` | 패널 내부 패딩, 그룹 간격 |
| space-4 | `--cad-space-4` | `16px` | 섹션 패딩, 카드 패딩 |
| space-5 | `--cad-space-5` | `20px` | 패널 패딩 |
| space-6 | `--cad-space-6` | `24px` | 섹션 간 간격 |
| space-8 | `--cad-space-8` | `32px` | 큰 영역 간격 |
| space-10 | `--cad-space-10` | `40px` | LeftToolbar 너비 |

---

## 5. 보더 반지름

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| radius-none | `--cad-radius-none` | `0px` | 패널 경계, 뷰포트 |
| radius-sm | `--cad-radius-sm` | `2px` | 입력 필드, 작은 버튼 |
| radius-md | `--cad-radius-md` | `4px` | 버튼, 카드, 드롭다운 |
| radius-lg | `--cad-radius-lg` | `6px` | 모달, 다이얼로그 |
| radius-xl | `--cad-radius-xl` | `8px` | 팝오버, 플로팅 패널 |
| radius-full | `--cad-radius-full` | `9999px` | 배지, 토글 |

---

## 6. 그림자

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| shadow-sm | `--cad-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | 버튼, 입력 필드 |
| shadow-md | `--cad-shadow-md` | `0 2px 8px rgba(0,0,0,0.4)` | 드롭다운, 팝오버 |
| shadow-lg | `--cad-shadow-lg` | `0 4px 16px rgba(0,0,0,0.5)` | 모달, 다이얼로그 |
| shadow-xl | `--cad-shadow-xl` | `0 8px 32px rgba(0,0,0,0.6)` | CommandPalette 오버레이 |

> 다크 테마에서는 그림자의 불투명도를 높여 가시성을 확보한다.

---

## 7. 아이콘 시스템

### 7.1 라이브러리

- **lucide-vue-next** (v0.474+)
- 번들에 포함 (CDN 의존 없음, 보안 원칙 준수)

### 7.2 크기 규격

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| icon-xs | `--cad-icon-xs` | `12px` | 상태 인디케이터, 인라인 |
| icon-sm | `--cad-icon-sm` | `14px` | 상태바 아이콘, 트리 접기 |
| icon-md | `--cad-icon-md` | `16px` | 기본 UI 아이콘, 탭 아이콘 |
| icon-lg | `--cad-icon-lg` | `20px` | 리본 도구 아이콘, LeftToolbar |
| icon-xl | `--cad-icon-xl` | `24px` | 빈 상태 아이콘, 강조 아이콘 |

### 7.3 스트로크 두께

| 크기 | stroke-width | 비고 |
|------|-------------|------|
| icon-xs, icon-sm | `1.5` | 가독성 확보 |
| icon-md | `2` | 기본값 |
| icon-lg, icon-xl | `1.5` | 시각적 무게 조절 |

### 7.4 주요 아이콘 매핑

| 기능 | 아이콘 이름 | 용도 |
|------|-----------|------|
| 파일 열기 | `FolderOpen` | F-001 파일 선택 |
| 저장 | `Save` | 마크업 저장 |
| 실행 취소 | `Undo2` | 작업 취소 |
| 다시 실행 | `Redo2` | 작업 재실행 |
| 선택 도구 | `MousePointer2` | 기본 선택 |
| 이동 (Pan) | `Hand` | 뷰포트 이동 |
| 확대 | `ZoomIn` | 줌 인 |
| 축소 | `ZoomOut` | 줌 아웃 |
| 전체 보기 | `Maximize2` | Fit-to-Extents |
| 거리 측정 | `Ruler` | F-013 |
| 면적 측정 | `Square` | F-014 |
| 각도 측정 | `TriangleRight` | F-015 |
| 레이어 | `Layers` | F-010 |
| 텍스트 마크업 | `Type` | F-020 |
| 원 마크업 | `Circle` | F-021 |
| 사각형 마크업 | `RectangleHorizontal` | F-021 |
| 화살표 마크업 | `MoveRight` | F-021 |
| 속성 | `Settings2` | PropertiesPanel |
| BOM 트리 | `ListTree` | F-023 |
| 스냅 토글 | `Magnet` | F-016 |
| 그리드 토글 | `Grid3x3` | 그리드 표시 |

---

## 8. 컴포넌트 상태

### 8.1 버튼 / 도구 아이콘

| 상태 | 배경 | 텍스트 | 보더 | 추가 |
|------|------|--------|------|------|
| default | `transparent` | `--cad-text-secondary` | `none` | |
| hover | `--cad-hover-bg` | `--cad-text-primary` | `none` | `cursor: pointer` |
| active (pressed) | `--cad-hover-bg-strong` | `--cad-text-primary` | `none` | |
| selected (toggled) | `--cad-accent-active-bg` | `--cad-accent-active-text` | `--cad-accent-active-border` | |
| disabled | `transparent` | `--cad-text-muted` | `none` | `opacity: 0.5; pointer-events: none` |
| focus | 현재 상태 유지 | 현재 상태 유지 | `2px solid --cad-accent-primary` | `outline-offset: -2px` |

### 8.2 탭

| 상태 | 배경 | 텍스트 | 보더 |
|------|------|--------|------|
| default | `--cad-bg-tab` | `--cad-text-secondary` | `none` |
| hover | `--cad-hover-bg` | `--cad-text-primary` | `none` |
| active (현재 탭) | `--cad-bg-panel` | `--cad-text-primary` | `border-top: 2px solid --cad-accent-primary` |
| disabled | `--cad-bg-tab` | `--cad-text-muted` | `none` |

### 8.3 입력 필드

| 상태 | 배경 | 텍스트 | 보더 |
|------|------|--------|------|
| default | `--cad-bg-app` | `--cad-text-primary` | `1px solid --cad-border-default` |
| hover | `--cad-bg-app` | `--cad-text-primary` | `1px solid --cad-border-hover` |
| focus | `--cad-bg-app` | `--cad-text-primary` | `1px solid --cad-accent-primary` |
| disabled | `--cad-bg-panel` | `--cad-text-muted` | `1px solid --cad-border-default` |
| error | `--cad-bg-app` | `--cad-text-primary` | `1px solid --cad-status-error` |

### 8.4 리스트 아이템 (레이어, BOM 트리)

| 상태 | 배경 | 텍스트 |
|------|------|--------|
| default | `transparent` | `--cad-text-primary` |
| hover | `--cad-hover-bg` | `--cad-text-primary` |
| selected | `--cad-accent-active-bg` | `--cad-accent-active-text` |
| disabled | `transparent` | `--cad-text-muted` |

---

## 9. 트랜지션

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| transition-fast | `--cad-transition-fast` | `100ms ease-out` | 호버 효과, 토글 |
| transition-normal | `--cad-transition-normal` | `150ms ease-out` | 패널 열기/닫기, 탭 전환 |
| transition-slow | `--cad-transition-slow` | `250ms ease-in-out` | 레이아웃 변경, 모달 |

---

## 10. Z-Index 스택

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|-----|------|
| z-canvas | `--cad-z-canvas` | `0` | ViewerCanvas |
| z-panel | `--cad-z-panel` | `10` | 사이드 패널 |
| z-toolbar | `--cad-z-toolbar` | `20` | LeftToolbar, Ribbon |
| z-dropdown | `--cad-z-dropdown` | `30` | 드롭다운 메뉴 |
| z-command | `--cad-z-command` | `40` | CommandPalette |
| z-modal | `--cad-z-modal` | `50` | 모달, 다이얼로그 |
| z-toast | `--cad-z-toast` | `60` | 토스트 알림 |
| z-tooltip | `--cad-z-tooltip` | `70` | 툴팁 |

---

## 11. 앱 레이아웃 그리드 시스템

### 11.1 전체 구조

```
┌─────────────────────────────────────────────────────┐
│                 Ribbon (상단, ~132px)                 │
│  [File ▼] [Draw] [Modify] [Annotation] [Layers]    │
├──────┬──────────────────────────────┬───────────────┤
│ Left │                              │  Properties   │
│ Tool │       ViewerCanvas           │    Panel      │
│ bar  │        (flex-1)              │   280px       │
│ 40px │                              │               │
├──────┴──────────────────────────────┴───────────────┤
│         CommandPalette (겹침, absolute, ~36px)       │
├─────────────────────────────────────────────────────┤
│                StatusBar (24px)                      │
└─────────────────────────────────────────────────────┘
```

### 11.2 CSS Grid 정의

```css
.app-layout {
  display: grid;
  grid-template-columns: var(--cad-left-toolbar-width) 1fr var(--cad-properties-width);
  grid-template-rows: var(--cad-ribbon-height) 1fr var(--cad-statusbar-height);
  grid-template-areas:
    "ribbon      ribbon       ribbon"
    "left-tools  canvas       properties"
    "statusbar   statusbar    statusbar";
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
```

### 11.3 영역별 크기

| 영역 | CSS 변수 | 값 | 크기 유형 | 비고 |
|------|----------|-----|----------|------|
| Ribbon | `--cad-ribbon-height` | `132px` | 고정 | 탭바(32px) + 리본 콘텐츠(100px) |
| LeftToolbar | `--cad-left-toolbar-width` | `40px` | 고정 | 아이콘 전용, 텍스트 없음 |
| ViewerCanvas | - | `1fr` | 유동 | 남은 공간 전체 차지 |
| PropertiesPanel | `--cad-properties-width` | `280px` | 고정 (토글 가능) | 닫히면 0px |
| CommandPalette | `--cad-command-height` | `36px` | 고정 | absolute, 캔버스 하단에 겹침 |
| StatusBar | `--cad-statusbar-height` | `24px` | 고정 | 항상 표시 |

### 11.4 Grid Area 매핑

```css
.ribbon          { grid-area: ribbon; }
.left-toolbar    { grid-area: left-tools; }
.viewer-canvas   { grid-area: canvas; position: relative; }
.properties-panel { grid-area: properties; }
.status-bar      { grid-area: statusbar; }

/* CommandPalette는 grid 밖, canvas 영역 위에 absolute 배치 */
.command-palette {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--cad-command-height);
  z-index: var(--cad-z-command);
}
```

### 11.5 패널 토글 시 레이아웃 변화

```css
/* PropertiesPanel 닫힘 */
.app-layout--no-properties {
  grid-template-columns: var(--cad-left-toolbar-width) 1fr 0px;
}

/* Ribbon 최소화 (탭바만 표시) */
.app-layout--ribbon-collapsed {
  grid-template-rows: 32px 1fr var(--cad-statusbar-height);
}

/* 양쪽 패널 모두 닫힘 (최대 뷰포트) */
.app-layout--fullscreen-canvas {
  grid-template-columns: 0px 1fr 0px;
  grid-template-rows: 0px 1fr 0px;
}
```

### 11.6 반응형 Breakpoint

| Breakpoint | 최소 너비 | 변화 |
|-----------|----------|------|
| `--bp-minimum` | `1280px` | 최소 지원 해상도, 모든 패널 표시 |
| `--bp-compact` | `1024px` | PropertiesPanel 자동 숨김, Ribbon 축소 |
| `--bp-mobile` | 지원 안 함 | 데스크톱 전용 앱 |

```css
/* 최소 해상도 미달 시 경고 */
@media (max-width: 1279px) {
  .app-layout {
    grid-template-columns: var(--cad-left-toolbar-width) 1fr 0px;
  }
  .properties-panel {
    position: absolute;
    right: 0;
    top: var(--cad-ribbon-height);
    bottom: var(--cad-statusbar-height);
    width: var(--cad-properties-width);
    z-index: var(--cad-z-panel);
  }
}

@media (max-width: 1023px) {
  .app-layout {
    grid-template-rows: 32px 1fr var(--cad-statusbar-height);
  }
}
```

### 11.7 최소 뷰포트 크기

- 최소 캔버스 크기: `960px x 540px`
- 최소 브라우저 창: `1280px x 720px`
- 권장 브라우저 창: `1920px x 1080px`

### 11.8 반응형 컴포넌트별 동작 요약

| 해상도 | Ribbon | StatusBar | PropertiesPanel |
|--------|--------|-----------|-----------------|
| >= 1920px | 모든 패널/라벨 표시 | 모든 요소 표시 | 표시 (280px) |
| 1280-1919px | 작은 버튼 라벨 숨김 (아이콘+툴팁) | 토글 라벨 숨김 (아이콘+툴팁) | 표시 (280px) |
| < 1280px | Ribbon 자동 접기 | 좌표+토글+줌만 표시 | 오버레이 모드 (absolute) |
| < 1024px | Ribbon 접기 + 탭 높이만 | 최소 표시 | 숨김 |

> 컴포넌트별 상세 반응형 사양은 `docs/components/ribbon-spec.md`, `docs/components/statusbar-spec.md` 참조.

---

## 12. Tailwind CSS 4 통합

### 12.1 CSS 변수 연동

Tailwind CSS 4는 `@theme` 지시자로 커스텀 토큰을 등록한다. `src/styles/variables.css`에 정의된 CSS 변수를 Tailwind에서 사용한다.

```css
/* app.css 또는 tailwind 진입점 */
@import "./styles/variables.css";
@import "tailwindcss";
```

### 12.2 사용 예시

```html
<!-- CSS 변수 직접 사용 -->
<div class="bg-[var(--cad-bg-panel)] text-[var(--cad-text-primary)]">

<!-- Tailwind 유틸리티 우선, 커스텀 CSS는 최소화 -->
<button class="bg-transparent hover:bg-[var(--cad-hover-bg)] text-gray-400 hover:text-gray-300">
```

---

## 부록 A: CSS 변수 파일 참조

모든 디자인 토큰의 CSS Custom Properties 정의: `src/styles/variables.css`

## 부록 B: 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-03-16 | 초기 디자인 시스템 정의 (T-005, T-006) |
| v1.1 | 2026-03-17 | 반응형 컴포넌트별 동작 요약 추가 (T-032), 컴포넌트 스펙 문서 참조 추가 |
