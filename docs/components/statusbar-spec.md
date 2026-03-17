# StatusBar UI Component Specification

| 항목 | 내용 |
|------|------|
| 문서 상태 | **v1.0** |
| 최종 수정 | 2026-03-17 |
| 작성자 | Design Agent |
| 대상 | DEV Agent |
| 관련 태스크 | T-031 |

---

## 1. 전체 구조

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ X: 0.0000  Y: 0.0000  Z: 0.0000 | LINE | 42 entities (3 selected)  ...    │
│                                          GRID SNAP ORTHO OSNAP [●Layer0] 100% ⛶│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 전체 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 높이 | `h-6` (24px) | `--cad-statusbar-height` |
| 배경 | `bg-[#27292D]` | `--cad-bg-panel` |
| 상단 보더 | `border-t border-[#3E4044]` | `--cad-border-default` |
| 패딩 | `px-2` (8px 좌우) | |
| 정렬 | `flex items-center justify-between` | 좌측/우측 영역 분리 |
| z-index | `20` | `--cad-z-toolbar` |
| grid-area | `statusbar` | 앱 레이아웃 그리드 |

### 1.2 텍스트 공통 스타일

| 속성 | 값 | 비고 |
|------|-----|------|
| 폰트 크기 | `text-[10px]` | `--cad-text-2xs` |
| 줄 높이 | `leading-tight` (1.2) | 컴팩트 UI |

---

## 2. 좌측 영역

`flex items-center gap-2` (8px 간격)

### 2.1 좌표 표시

현재 마우스 위치 또는 선택된 엔티티의 좌표를 실시간 표시한다.

| 속성 | 값 | 비고 |
|------|-----|------|
| 포맷 | `X: 0.0000  Y: 0.0000  Z: 0.0000` | 소수점 4자리 |
| 폰트 | `font-mono text-[10px]` | `--cad-font-mono`, `--cad-text-2xs` |
| 색상 | `text-gray-300` (`#D4D4D4`) | `--cad-text-primary` |
| 최소 너비 | `min-w-[200px]` | 좌표값 영역 고정 |
| 라벨 색상 | `text-gray-500` (`#737373`) | "X:", "Y:", "Z:" 라벨 |
| 값 색상 | `text-gray-300` | 숫자 값 |
| 간격 | 라벨 간 `gap-3` (12px) | X, Y, Z 세트 간 |
| 자릿수 정렬 | `tabular-nums` | 숫자 너비 고정 (font-variant-numeric) |

#### 좌표 내부 구조

```html
<div class="flex items-center gap-3 min-w-[200px] font-mono text-[10px]"
     style="font-variant-numeric: tabular-nums;">
  <span><span class="text-gray-500">X:</span> <span class="text-gray-300">0.0000</span></span>
  <span><span class="text-gray-500">Y:</span> <span class="text-gray-300">0.0000</span></span>
  <span><span class="text-gray-500">Z:</span> <span class="text-gray-300">0.0000</span></span>
</div>
```

### 2.2 구분선

| 속성 | 값 |
|------|-----|
| 크기 | `w-[1px] h-4` (1px x 16px) |
| 색상 | `bg-[#3E4044]` (`--cad-border-default`) |
| 마진 | 좌우 `gap-2`로 자동 처리 |

### 2.3 활성 도구명

현재 선택된 도구 이름을 대문자로 표시한다.

| 속성 | 값 | 비고 |
|------|-----|------|
| 폰트 | `text-[10px] font-medium uppercase` | 대문자 변환 |
| 색상 | `text-blue-400` (`#60A5FA`) | `--cad-accent-active-text` |
| 예시 | "LINE", "CIRCLE", "SELECT" | |
| 최소 너비 | `min-w-[50px]` | 텍스트 영역 확보 |

### 2.4 구분선

2.2와 동일.

### 2.5 엔티티 수 표시

현재 도면의 엔티티 수와 선택된 수를 표시한다.

| 속성 | 값 | 비고 |
|------|-----|------|
| 폰트 | `text-[10px] font-normal` | |
| 색상 | `text-gray-400` (`#9CA3AF`) | `--cad-text-secondary` |
| 포맷 | `42 entities (3 selected)` | 선택 없으면 괄호 부분 숨김 |
| 선택 강조 | `text-blue-400` | 선택 수 부분만 |

#### 엔티티 수 내부 구조

```html
<span class="text-[10px] text-gray-400">
  42 entities
  <span class="text-blue-400">(3 selected)</span>
</span>
```

---

## 3. 우측 영역

`flex items-center gap-1` (4px 간격)

### 3.1 기능 토글 버튼 (GRID, SNAP, ORTHO, OSNAP)

4개의 토글 버튼이 수평으로 배치된다.

#### 토글 버튼 공통 레이아웃

| 속성 | 값 | 비고 |
|------|-----|------|
| 패딩 | `px-1.5 py-0.5` (6px x 2px) | |
| 모서리 | `rounded-sm` (2px) | |
| 간격 | `gap-1` (4px, 아이콘-라벨 사이) | |
| 정렬 | `flex items-center` | |
| 커서 | `cursor-pointer` | |
| 트랜지션 | `transition-colors duration-100` | `--cad-transition-fast` |

#### 아이콘

| 속성 | 값 |
|------|-----|
| 크기 | `12px` (`--cad-icon-xs`) |
| stroke-width | `1.5` |
| flex 고정 | `flex-shrink-0` |

#### 라벨

| 속성 | 값 |
|------|-----|
| 폰트 | `text-[10px] font-medium uppercase` |

#### 비활성 상태 (inactive)

| 속성 | 값 |
|------|-----|
| 배경 | `transparent` |
| 아이콘/라벨 색상 | `text-gray-400` (`#9CA3AF`) |
| 호버 | `hover:bg-[#3E4044] hover:text-gray-300` |

#### 활성 상태 (active)

| 속성 | 값 |
|------|-----|
| 배경 | `bg-blue-600/20` (`--cad-accent-active-bg`) |
| 아이콘/라벨 색상 | `text-blue-400` (`#60A5FA`, `--cad-accent-active-text`) |
| 호버 | `hover:bg-blue-600/30` |

#### 토글 버튼 아이콘 매핑

| 버튼 | lucide 아이콘 | 라벨 | 단축키 |
|------|-------------|------|--------|
| GRID | `Grid3x3` | GRID | F7 |
| SNAP | `Magnet` | SNAP | F9 |
| ORTHO | `ArrowUpDown` | ORTHO | F8 |
| OSNAP | `Crosshair` | OSNAP | F3 |

#### 토글 버튼 Tailwind 예시

```html
<!-- 비활성 -->
<button class="flex items-center gap-1 px-1.5 py-0.5 rounded-sm
               text-gray-400 hover:bg-[#3E4044] hover:text-gray-300
               transition-colors duration-100 cursor-pointer">
  <Grid3x3 :size="12" :stroke-width="1.5" class="flex-shrink-0" />
  <span class="text-[10px] font-medium uppercase">GRID</span>
</button>

<!-- 활성 -->
<button class="flex items-center gap-1 px-1.5 py-0.5 rounded-sm
               bg-blue-600/20 text-blue-400 hover:bg-blue-600/30
               transition-colors duration-100 cursor-pointer">
  <Grid3x3 :size="12" :stroke-width="1.5" class="flex-shrink-0" />
  <span class="text-[10px] font-medium uppercase">GRID</span>
</button>
```

### 3.2 구분선

| 속성 | 값 |
|------|-----|
| 크기 | `w-[1px] h-4` (1px x 16px) |
| 색상 | `bg-[#3E4044]` |
| 마진 | `mx-1` (4px 좌우) |

### 3.3 레이어 인디케이터

현재 활성 레이어를 색상 도트와 이름으로 표시한다.

| 속성 | 값 | 비고 |
|------|-----|------|
| 정렬 | `flex items-center gap-1.5` (6px) | |
| 커서 | `cursor-pointer` | 클릭 시 레이어 변경 |
| 호버 | `hover:bg-[#3E4044] rounded-sm px-1.5 py-0.5` | |

#### 색상 도트

| 속성 | 값 | 비고 |
|------|-----|------|
| 크기 | `w-2 h-2` (8px) | |
| 모양 | `rounded-full` | 원형 |
| 색상 | 레이어 색상 (동적) | 예: `bg-white`, `bg-red-500` 등 |
| 보더 | `ring-1 ring-[#3E4044]` | 어두운 배경에서 가시성 |

#### 레이어 이름

| 속성 | 값 |
|------|-----|
| 폰트 | `text-[10px] font-normal` |
| 색상 | `text-gray-300` (`#D4D4D4`) |
| 최대 너비 | `max-w-[80px] truncate` |

```html
<div class="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm
            hover:bg-[#3E4044] cursor-pointer transition-colors duration-100">
  <span class="w-2 h-2 rounded-full bg-white ring-1 ring-[#3E4044]"></span>
  <span class="text-[10px] text-gray-300 max-w-[80px] truncate">Layer 0</span>
</div>
```

### 3.4 구분선

3.2와 동일.

### 3.5 줌 레벨

현재 뷰포트 줌 비율을 표시한다.

| 속성 | 값 | 비고 |
|------|-----|------|
| 폰트 | `text-[10px] font-mono font-normal` | 고정폭 |
| 색상 | `text-gray-400` (`#9CA3AF`) | |
| 포맷 | `100%` | 정수 퍼센트 |
| 최소 너비 | `min-w-[36px] text-right` | 정렬 |
| 커서 | `cursor-pointer` | 클릭 시 줌 입력 |
| 호버 | `hover:text-gray-300` | |

### 3.6 풀스크린 토글

| 속성 | 값 | 비고 |
|------|-----|------|
| 크기 | `w-5 h-5` (20px) | |
| 아이콘 | `Maximize2` / `Minimize2` (12px) | 상태에 따라 전환 |
| 색상 | `text-gray-400` | |
| 호버 | `hover:bg-[#3E4044] hover:text-gray-300` | |
| 모서리 | `rounded-sm` (2px) | |
| 정렬 | `flex items-center justify-center` | |
| 마진 | `ml-1` (4px 왼쪽) | |

---

## 4. 컴포넌트 트리 (권장)

```
StatusBar
├── StatusBarLeft
│   ├── CoordinateDisplay
│   │   ├── CoordLabel ("X:")
│   │   ├── CoordValue ("0.0000")
│   │   └── ... (Y, Z)
│   ├── Separator
│   ├── ActiveToolName
│   ├── Separator
│   └── EntityCount
├── StatusBarRight
│   ├── ToggleButton (GRID)
│   ├── ToggleButton (SNAP)
│   ├── ToggleButton (ORTHO)
│   ├── ToggleButton (OSNAP)
│   ├── Separator
│   ├── LayerIndicator
│   ├── Separator
│   ├── ZoomLevel
│   └── FullscreenToggle
```

---

## 5. 접근성

| 항목 | 구현 |
|------|------|
| 토글 ARIA | `role="switch"`, `aria-checked="true/false"` |
| 토글 라벨 | `aria-label="Toggle Grid"` 등 |
| 좌표 실시간 | `aria-live="polite"` (스크린리더에 변경 알림) |
| 키보드 | `Tab` 키로 토글 버튼 이동, `Enter`/`Space`로 토글 |
| 포커스 | `focus-visible:ring-1 ring-blue-500` |
| 단축키 힌트 | 툴팁에 단축키 표시 (예: "Grid (F7)") |

---

## 6. 반응형 동작

| 해상도 | 동작 |
|--------|------|
| >= 1920px | 모든 요소 표시 |
| 1280-1919px | 토글 라벨 숨기고 아이콘만 표시 + 툴팁 |
| < 1280px | 엔티티 수, 레이어 인디케이터 숨김. 좌표 + 토글 + 줌만 표시 |

---

## 7. 전체 StatusBar Tailwind 예시

```html
<div class="h-6 bg-[#27292D] border-t border-[#3E4044]
            flex items-center justify-between px-2 text-[10px]">

  <!-- 좌측 -->
  <div class="flex items-center gap-2">
    <!-- 좌표 -->
    <div class="flex items-center gap-3 min-w-[200px] font-mono"
         style="font-variant-numeric: tabular-nums;">
      <span><span class="text-gray-500">X:</span> <span class="text-gray-300">0.0000</span></span>
      <span><span class="text-gray-500">Y:</span> <span class="text-gray-300">0.0000</span></span>
      <span><span class="text-gray-500">Z:</span> <span class="text-gray-300">0.0000</span></span>
    </div>
    <!-- 구분선 -->
    <div class="w-[1px] h-4 bg-[#3E4044]"></div>
    <!-- 활성 도구 -->
    <span class="text-blue-400 font-medium uppercase min-w-[50px]">LINE</span>
    <!-- 구분선 -->
    <div class="w-[1px] h-4 bg-[#3E4044]"></div>
    <!-- 엔티티 수 -->
    <span class="text-gray-400">42 entities <span class="text-blue-400">(3 selected)</span></span>
  </div>

  <!-- 우측 -->
  <div class="flex items-center gap-1">
    <!-- 토글 버튼들 -->
    <!-- ... GRID, SNAP, ORTHO, OSNAP -->
    <!-- 구분선 -->
    <div class="w-[1px] h-4 bg-[#3E4044] mx-1"></div>
    <!-- 레이어 -->
    <div class="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm
                hover:bg-[#3E4044] cursor-pointer">
      <span class="w-2 h-2 rounded-full bg-white ring-1 ring-[#3E4044]"></span>
      <span class="text-gray-300 max-w-[80px] truncate">Layer 0</span>
    </div>
    <!-- 구분선 -->
    <div class="w-[1px] h-4 bg-[#3E4044] mx-1"></div>
    <!-- 줌 -->
    <span class="font-mono text-gray-400 min-w-[36px] text-right cursor-pointer
                 hover:text-gray-300">100%</span>
    <!-- 풀스크린 -->
    <button class="w-5 h-5 flex items-center justify-center ml-1
                   text-gray-400 hover:bg-[#3E4044] hover:text-gray-300
                   rounded-sm transition-colors duration-100">
      <Maximize2 :size="12" :stroke-width="1.5" />
    </button>
  </div>
</div>
```
