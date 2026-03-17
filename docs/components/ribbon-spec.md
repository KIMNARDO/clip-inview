# Ribbon UI Component Specification

| 항목 | 내용 |
|------|------|
| 문서 상태 | **v1.0** |
| 최종 수정 | 2026-03-17 |
| 작성자 | Design Agent |
| 대상 | DEV Agent |
| 관련 태스크 | T-030 |

---

## 1. 전체 구조

Ribbon은 3개의 수평 영역으로 구성된다. 총 높이는 `--cad-ribbon-height: 132px`.

```
┌─────────────────────────────────────────────────────────────────────┐
│ Quick Access Toolbar (h-8 = 32px)                   bg-[#1E1F22]  │
│ [W] [Save][Undo][Redo][Print] | File Edit View ... | [Search] 라벨│
├─────────────────────────────────────────────────────────────────────┤
│ Ribbon Tabs (h-8 = 32px)                            bg-[#1E1F22]  │
│ [Home] [Annotate] [Insert] [Parametric] ...          [접기 버튼]  │
├─────────────────────────────────────────────────────────────────────┤
│ Ribbon Panels (h-[96px] = 96px)                     bg-[#27292D]  │
│ ┌─Draw──┐ ┌─Modify─┐ ┌─Annotation─┐ ┌─Layers─┐                  │
│ │       │ │        │ │            │ │        │                    │
│ └───────┘ └────────┘ └────────────┘ └────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

접기(collapse) 상태에서는 Quick Access Toolbar + Ribbon Tabs만 표시된다: `32px + 32px = 64px`. Ribbon Panels는 숨겨지고, 탭 클릭 시 드롭다운으로 표시된다.

---

## 2. Quick Access Toolbar

### 2.1 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 높이 | `h-8` (32px) | 고정 |
| 배경 | `bg-[#1E1F22]` | `--cad-bg-app` |
| 패딩 | `px-2` (8px 좌우) | |
| 정렬 | `flex items-center` | 수평 배치 |
| 하단 보더 | `border-b border-[#3E4044]` | `--cad-border-default` |

### 2.2 좌측 영역 (앱 로고 + 빠른 실행 버튼)

```
[W] [Save] [Undo] [Redo] [Print]  |  File  Edit  View  Insert ...
```

#### 앱 로고 "W"

| 속성 | 값 | 비고 |
|------|-----|------|
| 크기 | `w-7 h-7` (28px) | |
| 배경 | `bg-blue-600` (`#2563EB`) | |
| 텍스트 | `text-white font-bold text-sm` (12px) | "W" 문자 |
| 모서리 | `rounded` (`--cad-radius-md`, 4px) | |
| 마진 | `mr-1` (4px 오른쪽) | |
| 정렬 | `flex items-center justify-center` | 중앙 정렬 |

#### 빠른 실행 아이콘 버튼 (Save, Undo, Redo, Print)

| 속성 | 값 | 비고 |
|------|-----|------|
| 크기 | `w-7 h-7` (28px) | 정사각형 |
| 아이콘 크기 | `14px` (`--cad-icon-sm`) | stroke-width: 1.5 |
| 모서리 | `rounded-sm` (2px) | |
| 간격 | `gap-0.5` (2px) | 버튼 간 |
| 기본 색상 | `text-gray-400` (`#9CA3AF`) | |
| 호버 | `hover:bg-[#323539] hover:text-gray-300` | |
| 활성 | `active:bg-[#3E4044]` | 클릭 시 |
| 비활성 | `text-gray-600 opacity-50 pointer-events-none` | Undo 불가 등 |
| 트랜지션 | `transition-colors duration-100` | `--cad-transition-fast` |

**아이콘 매핑**:

| 버튼 | lucide 아이콘 | 비고 |
|------|-------------|------|
| Save | `Save` | |
| Undo | `Undo2` | |
| Redo | `Redo2` | |
| Print | `Printer` | |

#### 구분선 (빠른 실행과 메뉴 사이)

| 속성 | 값 |
|------|-----|
| 크기 | `w-[1px] h-4` (1px x 16px) |
| 색상 | `bg-[#3E4044]` |
| 마진 | `mx-2` (8px 좌우) |

### 2.3 중앙 영역 (메뉴 목록)

메뉴 항목: **File, Edit, View, Insert, Format, Tools, Draw, Dimension, Modify, Window, Help**

#### 메뉴 아이템

| 속성 | 값 | 비고 |
|------|-----|------|
| 패딩 | `px-2 py-1` (8px x 4px) | |
| 폰트 | `text-[12px] font-normal` | `--cad-text-sm` |
| 색상 | `text-gray-400` (`#9CA3AF`) | |
| 호버 | `hover:text-white hover:bg-[#323539]` | |
| 활성 (메뉴 열림) | `bg-[#323539] text-white` | |
| 모서리 | `rounded-sm` (2px) | |
| 간격 | `gap-0` | 간격 없이 연속 배치 |
| 트랜지션 | `transition-colors duration-100` | |

### 2.4 우측 영역 (검색바 + 라벨)

#### 검색바

| 속성 | 값 | 비고 |
|------|-----|------|
| 크기 | `w-48 h-6` (192px x 24px) | |
| 배경 | `bg-[#1E1F22]` | `--cad-bg-input` |
| 보더 | `border border-[#3E4044]` | |
| 모서리 | `rounded-sm` (2px) | |
| 아이콘 | `Search` (12px), `text-gray-500` | 좌측 내부 |
| 패딩 | `pl-7 pr-2` | 아이콘 공간 확보 |
| 플레이스홀더 | `text-gray-500 text-[11px]` | "Type a command or search..." |
| 포커스 보더 | `focus:border-blue-500` | `--cad-accent-primary` |

#### 앱 라벨

| 속성 | 값 | 비고 |
|------|-----|------|
| 텍스트 | "Clip-Inview 2026 Professional" | |
| 폰트 | `text-[11px] text-gray-500 font-normal` | |
| 마진 | `ml-3` (12px 왼쪽) | |

---

## 3. Ribbon Tabs

### 3.1 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 높이 | `h-8` (32px) | 고정 |
| 배경 | `bg-[#1E1F22]` | `--cad-bg-app` |
| 패딩 | `px-1` (4px 좌우) | |
| 정렬 | `flex items-center` | |
| 하단 보더 | `border-b border-[#3E4044]` | |

### 3.2 탭 목록

**탭**: Home, Annotate, Insert, Parametric, Views, Manage, Export

### 3.3 탭 아이템 상태

#### 비활성 탭 (default)

| 속성 | 값 |
|------|-----|
| 패딩 | `px-3 py-1.5` (12px x 6px) |
| 폰트 | `text-[12px] font-medium` (`--cad-text-sm`, weight 500) |
| 색상 | `text-gray-400` (`#9CA3AF`) |
| 배경 | `transparent` |
| 모서리 | `rounded-t-sm` (상단만 2px) |
| 커서 | `cursor-pointer` |

#### 호버 (hover)

| 속성 | 값 |
|------|-----|
| 배경 | `bg-[#323539]` (`--cad-hover-bg`) |
| 텍스트 | `text-white` |

#### 활성 탭 (active)

| 속성 | 값 | 비고 |
|------|-----|------|
| 배경 | `bg-[#27292D]` | `--cad-bg-panel` |
| 텍스트 | `text-white font-medium` | |
| 상단 보더 | `border-t-2 border-t-blue-500` (`#3B82F6`) | `--cad-accent-primary` |
| 좌우 보더 | `border-x border-[#3E4044]` | 탭 영역 구분 |
| 하단 보더 | `border-b-transparent` | 패널과 이어지는 느낌 |
| 패딩 보정 | `pt-[4px]` | border-t-2 만큼 보정 |

#### 트랜지션

| 속성 | 값 |
|------|-----|
| 전환 | `transition-all duration-150` (`--cad-transition-normal`) |

### 3.4 우측 접기/펼치기 버튼

| 속성 | 값 | 비고 |
|------|-----|------|
| 위치 | `ml-auto` | 우측 끝 |
| 크기 | `w-7 h-7` (28px) | |
| 아이콘 | `ChevronUp` / `ChevronDown` (14px) | 접힌 상태에 따라 전환 |
| 색상 | `text-gray-400` | |
| 호버 | `hover:bg-[#323539] hover:text-white` | |
| 모서리 | `rounded-sm` (2px) | |

---

## 4. Ribbon Panels

### 4.1 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 높이 | `h-[96px]` (96px) | 고정, 접기 시 0px |
| 배경 | `bg-[#27292D]` | `--cad-bg-panel` |
| 패딩 | `px-1 py-1` (4px) | |
| 정렬 | `flex items-stretch` | 패널들 수평 배치 |
| 하단 보더 | `border-b border-[#3E4044]` | |
| 오버플로 | `overflow-x-auto overflow-y-hidden` | 좁은 화면 대응 |

### 4.2 패널 그룹

각 패널은 수직 구분선으로 구분된다.

#### 패널 컨테이너

| 속성 | 값 | 비고 |
|------|-----|------|
| 정렬 | `flex flex-col items-center` | |
| 패딩 | `px-1.5` (6px 좌우) | |
| 우측 구분선 | `border-r border-[#3E4044]` | 마지막 패널 제외 |

#### 패널 라벨 (하단)

| 속성 | 값 |
|------|-----|
| 위치 | 패널 하단, `mt-auto` |
| 폰트 | `text-[10px] text-gray-500 font-normal` |
| 정렬 | `text-center` |
| 패딩 | `pt-0.5` (2px 상단) |

### 4.3 Home 탭 패널 구성

```
┌──────────┬──────────────┬──────────────┬────────────────────────┐
│  Draw    │   Modify     │  Annotation  │       Layers           │
│          │              │              │                        │
│ ┌──────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐          │
│ │ Line │ │ │   Move   │ │ │   Text   │ │ │Properties│          │
│ │ (큰) │ │ │   (큰)   │ │ │   (큰)   │ │ │  (큰)    │          │
│ └──────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘          │
│ ┌──┐┌──┐ │ ┌──┐┌──┐    │ ┌──────────┐ │ [Layer ▼] [색][잠금]  │
│ │Ci││Ar│ │ │Ro││Co│    │ │Dimension │ │                        │
│ └──┘└──┘ │ └──┘└──┘    │ │  (큰)    │ │                        │
│ ┌──┐┌──┐ │ ┌──┐┌──┐    │ └──────────┘ │                        │
│ │Re││Pl│ │ │Mi││Tr│    │              │                        │
│ └──┘└──┘ │ └──┘└──┘    │              │                        │
│  Draw    │  Modify      │  Annotation  │  Layers                │
└──────────┴──────────────┴──────────────┴────────────────────────┘
```

---

## 5. RibbonLargeButton

큰 버튼은 패널 내에서 주요 도구를 나타낸다. 아이콘 위 + 라벨 아래 세로 배치.

### 5.1 크기 및 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 크기 | `w-14 h-16` (56px x 64px) | |
| 정렬 | `flex flex-col items-center justify-center` | |
| 패딩 | `p-1` (4px) | |
| 간격 | `gap-1` (4px, 아이콘-라벨 사이) | |
| 모서리 | `rounded` (`--cad-radius-md`, 4px) | |
| 커서 | `cursor-pointer` | |

### 5.2 아이콘

| 속성 | 값 |
|------|-----|
| 크기 | `24px` (`--cad-icon-xl`) |
| stroke-width | `1.5` |

### 5.3 라벨

| 속성 | 값 |
|------|-----|
| 폰트 | `text-[10px] font-normal` (`--cad-text-2xs`) |
| 줄 높이 | `leading-tight` (1.2) |
| 정렬 | `text-center` |
| 최대 너비 | `max-w-[52px]` |
| 오버플로 | `truncate` |

### 5.4 상태

#### Default

| 속성 | 값 |
|------|-----|
| 배경 | `transparent` |
| 아이콘 색상 | `text-gray-400` (`#9CA3AF`) |
| 라벨 색상 | `text-gray-400` (`#9CA3AF`) |
| 보더 | `border border-transparent` |

#### Hover

| 속성 | 값 |
|------|-----|
| 배경 | `bg-[#3E4044]` (`--cad-hover-bg-strong`) |
| 아이콘 색상 | `text-gray-200` (`#E5E5E5`) |
| 라벨 색상 | `text-gray-200` |
| 보더 | `border border-[#52555A]` |

#### Active (선택된 도구)

| 속성 | 값 |
|------|-----|
| 배경 | `bg-blue-600/20` (`--cad-accent-active-bg`) |
| 아이콘 색상 | `text-blue-400` (`#60A5FA`, `--cad-accent-active-text`) |
| 라벨 색상 | `text-blue-400` |
| 보더 | `border border-blue-500/50` (`--cad-accent-active-border`) |

#### Disabled

| 속성 | 값 |
|------|-----|
| 배경 | `transparent` |
| 아이콘/라벨 색상 | `text-gray-600` |
| 투명도 | `opacity-50` |
| 포인터 | `pointer-events-none` |

#### 트랜지션

| 속성 | 값 |
|------|-----|
| 전환 | `transition-all duration-100` (`--cad-transition-fast`) |

---

## 6. RibbonSmallButton

작은 버튼은 보조 도구를 나타내며, 아이콘 + 라벨 수평 배치. 2x2 그리드로 배치된다.

### 6.1 크기 및 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 높이 | `h-6` (24px) | |
| 최소 너비 | `min-w-[60px]` | 라벨 길이에 따라 유동 |
| 정렬 | `flex items-center` | 수평 배치 |
| 패딩 | `px-1.5 py-1` (6px x 4px) | |
| 간격 | `gap-1.5` (6px, 아이콘-라벨 사이) | |
| 모서리 | `rounded-sm` (2px) | |
| 커서 | `cursor-pointer` | |

### 6.2 아이콘

| 속성 | 값 |
|------|-----|
| 크기 | `12px` (`--cad-icon-xs`) |
| stroke-width | `1.5` |
| flex 고정 | `flex-shrink-0` |

### 6.3 라벨

| 속성 | 값 |
|------|-----|
| 폰트 | `text-[10px] font-normal` (`--cad-text-2xs`) |
| 줄 높이 | `leading-tight` (1.2) |
| 오버플로 | `truncate` |
| white-space | `whitespace-nowrap` |

### 6.4 상태

#### Default

| 속성 | 값 |
|------|-----|
| 배경 | `transparent` |
| 아이콘 색상 | `text-gray-400` (`#9CA3AF`) |
| 라벨 색상 | `text-gray-400` |

#### Hover

| 속성 | 값 |
|------|-----|
| 배경 | `bg-[#3E4044]` (`--cad-hover-bg-strong`) |
| 아이콘 색상 | `text-gray-200` |
| 라벨 색상 | `text-gray-200` |

#### Active (선택된 도구)

| 속성 | 값 |
|------|-----|
| 배경 | `bg-blue-600/20` (`--cad-accent-active-bg`) |
| 아이콘 색상 | `text-blue-400` (`--cad-accent-active-text`) |
| 라벨 색상 | `text-blue-400` |

#### Disabled

| 속성 | 값 |
|------|-----|
| 투명도 | `opacity-50` |
| 포인터 | `pointer-events-none` |

### 6.5 작은 버튼 2x2 그리드

패널 내에서 큰 버튼 옆에 작은 버튼 4개가 2열 2행으로 배치된다.

| 속성 | 값 | 비고 |
|------|-----|------|
| 정렬 | `grid grid-cols-2 grid-rows-2` | |
| 간격 | `gap-0.5` (2px) | |
| 정렬 | `content-center` | 수직 중앙 |

---

## 7. 패널별 버튼 구성

### 7.1 Draw 패널

| 위치 | 타입 | 라벨 | lucide 아이콘 | 비고 |
|------|------|------|-------------|------|
| 큰 버튼 | Large | Line | `Minus` | 기본 선택 도구 |
| 작은 2x2 [0,0] | Small | Circle | `Circle` | |
| 작은 2x2 [0,1] | Small | Arc | `Undo2` (커스텀) | 호 그리기 |
| 작은 2x2 [1,0] | Small | Rectangle | `Square` | |
| 작은 2x2 [1,1] | Small | Polyline | `Spline` | |

### 7.2 Modify 패널

| 위치 | 타입 | 라벨 | lucide 아이콘 | 비고 |
|------|------|------|-------------|------|
| 큰 버튼 | Large | Move | `Move` | |
| 작은 2x2 [0,0] | Small | Rotate | `RotateCw` | |
| 작은 2x2 [0,1] | Small | Copy | `Copy` | |
| 작은 2x2 [1,0] | Small | Mirror | `FlipHorizontal2` | |
| 작은 2x2 [1,1] | Small | Trim | `Scissors` | |

### 7.3 Annotation 패널

| 위치 | 타입 | 라벨 | lucide 아이콘 | 비고 |
|------|------|------|-------------|------|
| 큰 버튼 1 | Large | Text | `Type` | 텍스트 주석 |
| 큰 버튼 2 | Large | Dimension | `Ruler` | 치수 기입 |

### 7.4 Layers 패널

| 위치 | 타입 | 라벨 | lucide 아이콘 | 비고 |
|------|------|------|-------------|------|
| 큰 버튼 | Large | Properties | `Settings2` | 속성 패널 토글 |

#### 레이어 선택 드롭다운

| 속성 | 값 | 비고 |
|------|-----|------|
| 크기 | `w-32 h-6` (128px x 24px) | |
| 배경 | `bg-[#1E1F22]` | `--cad-bg-input` |
| 보더 | `border border-[#3E4044]` | |
| 폰트 | `text-[11px] text-gray-300` | |
| 모서리 | `rounded-sm` (2px) | |
| 패딩 | `px-2` | |
| 화살표 | `ChevronDown` (10px), 우측 | |

#### 레이어 색상/잠금 아이콘

| 아이콘 | 크기 | 색상 | 비고 |
|--------|------|------|------|
| 색상 사각형 | `w-4 h-4` (16px) | 레이어 색상 | `rounded-sm`, 보더 1px |
| 잠금 | `Lock` / `Unlock` (14px) | `text-gray-400` | 토글 |

---

## 8. Ribbon 접기/펼치기 동작

### 8.1 접기 상태

| 속성 | 값 | 비고 |
|------|-----|------|
| Quick Access | 표시 | 항상 표시 |
| Ribbon Tabs | 표시 | 항상 표시 |
| Ribbon Panels | 숨김 | `h-0 overflow-hidden` |
| 총 높이 | `64px` | 32px + 32px |

### 8.2 펼치기 트리거

- 접기 버튼 클릭
- 탭 클릭 시 임시 펼침 (포커스 잃으면 다시 접힘)

### 8.3 애니메이션

| 속성 | 값 |
|------|-----|
| 전환 | `transition-[height] duration-150 ease-out` |
| 펼침 | `h-0` -> `h-[96px]` |
| 접힘 | `h-[96px]` -> `h-0` |

---

## 9. 반응형 동작

### 9.1 해상도별 대응

| 해상도 | 동작 |
|--------|------|
| >= 1920px | 모든 패널, 라벨 표시 |
| 1280-1919px | 작은 버튼 라벨 숨기고 아이콘만 + 툴팁 |
| < 1280px | Ribbon 자동 접기, 탭 클릭 시 드롭다운 |

### 9.2 오버플로 처리

패널이 화면 너비를 초과할 경우:
- `overflow-x-auto` + 좌우 스크롤 힌트 (그라데이션 fade)
- 또는 우측에 `>>` 확장 버튼으로 숨겨진 패널 드롭다운

---

## 10. 접근성

| 항목 | 구현 |
|------|------|
| 키보드 네비게이션 | `Tab` 키로 탭 이동, `Enter`/`Space`로 선택 |
| ARIA 역할 | 탭: `role="tablist"` + `role="tab"`, 패널: `role="tabpanel"` |
| ARIA 상태 | `aria-selected`, `aria-expanded` (접기), `aria-disabled` |
| 포커스 표시 | `focus-visible:ring-2 ring-blue-500 ring-offset-1 ring-offset-[#27292D]` |
| 툴팁 | 모든 아이콘 버튼에 `title` 또는 커스텀 툴팁 |
| 단축키 | 주요 도구에 단축키 표시 (예: "Line (L)") |

---

## 11. 컴포넌트 트리 (권장)

```
RibbonContainer
├── QuickAccessToolbar
│   ├── AppLogo
│   ├── QuickActionButton (Save, Undo, Redo, Print)
│   ├── Separator
│   ├── MenuBar
│   │   └── MenuItem (File, Edit, View, ...)
│   ├── SearchBar
│   └── AppLabel
├── RibbonTabBar
│   ├── RibbonTab (Home, Annotate, Insert, ...)
│   └── CollapseButton
└── RibbonPanelArea
    └── RibbonPanel (per active tab)
        ├── RibbonLargeButton
        ├── RibbonSmallButtonGrid
        │   └── RibbonSmallButton
        ├── RibbonDropdown (layer select 등)
        └── PanelLabel
```

---

## 부록: Tailwind 클래스 요약

### Quick Access Toolbar
```html
<div class="h-8 bg-[#1E1F22] border-b border-[#3E4044] flex items-center px-2">
```

### Ribbon Tab (active)
```html
<button class="px-3 py-1.5 text-[12px] font-medium text-white bg-[#27292D]
               border-t-2 border-t-blue-500 border-x border-[#3E4044]
               rounded-t-sm transition-all duration-150">
```

### Ribbon Tab (inactive)
```html
<button class="px-3 py-1.5 text-[12px] font-medium text-gray-400
               hover:text-white hover:bg-[#323539]
               rounded-t-sm transition-all duration-150 cursor-pointer">
```

### RibbonLargeButton (default)
```html
<button class="w-14 h-16 flex flex-col items-center justify-center
               p-1 gap-1 rounded border border-transparent
               text-gray-400 transition-all duration-100 cursor-pointer
               hover:bg-[#3E4044] hover:text-gray-200 hover:border-[#52555A]">
  <Icon :size="24" :stroke-width="1.5" />
  <span class="text-[10px] leading-tight text-center truncate max-w-[52px]">
    Line
  </span>
</button>
```

### RibbonLargeButton (active)
```html
<button class="w-14 h-16 flex flex-col items-center justify-center
               p-1 gap-1 rounded
               bg-blue-600/20 text-blue-400 border border-blue-500/50">
```

### RibbonSmallButton (default)
```html
<button class="h-6 min-w-[60px] flex items-center px-1.5 py-1 gap-1.5
               rounded-sm text-gray-400 transition-all duration-100
               cursor-pointer hover:bg-[#3E4044] hover:text-gray-200">
  <Icon :size="12" :stroke-width="1.5" class="flex-shrink-0" />
  <span class="text-[10px] leading-tight truncate whitespace-nowrap">
    Circle
  </span>
</button>
```

### Ribbon Panel Area
```html
<div class="h-[96px] bg-[#27292D] border-b border-[#3E4044]
            flex items-stretch px-1 py-1 overflow-x-auto">
```
