<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { useMarkupStore } from '@/stores/markup'
import { useToastStore } from '@/stores/toast'
import type { ViewerTool } from '@/types/cad'
import MeasurementSettingsDialog from './MeasurementSettingsDialog.vue'
import ExportDialog from './ExportDialog.vue'
import { exportToPng, exportToJpeg, printDrawing } from '@/utils/exporter'
import {
  DownloadIcon,
  FileTextIcon,
  Maximize2Icon,
  ZoomInIcon,
  MonitorIcon,
  SunMoonIcon,
  RulerIcon,
  StickyNoteIcon,
  EyeOffIcon,
  MousePointer2Icon,
  HandIcon,
  LayersIcon,
  ListTreeIcon,
  FolderOpenIcon,
  SquareIcon,
  TriangleRightIcon,
  CrosshairIcon,
  MoveIcon,
  BoxIcon,
  SplineIcon,
  TypeIcon,
  CircleIcon,
  ArrowRightIcon,
  MinusIcon,
  CloudIcon,
  CornerDownRightIcon,
  PenToolIcon,
  SettingsIcon,
  Trash2Icon,
  SaveIcon,
  UploadIcon,
  PrinterIcon,
  ImageIcon,
} from 'lucide-vue-next'

const store = useAppStore()
const measureStore = useMeasurementStore()
const markupStore = useMarkupStore()
const toastStore = useToastStore()

// 활성 서브메뉴
const activeSubmenu = ref<string | null>(null)
const showSettingsDialog = ref(false)
const showExportDialog = ref(false)

// 팝오버 위치
const popoverStyle = ref<Record<string, string>>({})

// 버튼 refs
const exportBtnRef = ref<HTMLElement | null>(null)
const measureBtnRef = ref<HTMLElement | null>(null)
const markupBtnRef = ref<HTMLElement | null>(null)

function toggleSubmenu(menuId: string, btnRef: HTMLElement | null) {
  if (activeSubmenu.value === menuId) {
    activeSubmenu.value = null
    return
  }
  activeSubmenu.value = menuId

  // 팝오버 위치 계산
  nextTick(() => {
    if (btnRef) {
      const rect = btnRef.getBoundingClientRect()
      popoverStyle.value = {
        position: 'fixed',
        left: `${rect.right + 6}px`,
        top: `${rect.top}px`,
        zIndex: '100',
      }
    }
  })
}

function closeSubmenu() {
  activeSubmenu.value = null
}

// 클릭 외부 감지
function handleBodyClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  // 서브메뉴 팝오버 내부 클릭이면 무시
  if (target.closest('.submenu-popover') || target.closest('.sidebar-item-wrapper')) return
  closeSubmenu()
}

// body 클릭 리스너
document.addEventListener('click', handleBodyClick)
onUnmounted(() => {
  document.removeEventListener('click', handleBodyClick)
})

function handleToolClick(toolId: ViewerTool) {
  if (measureStore.isActive) measureStore.cancelMeasurement()
  if (markupStore.isActive) markupStore.cancelMarkup()
  store.setActiveTool(toolId)
  if (toolId === 'fit') {
    window.dispatchEvent(new CustomEvent('cad:fit-extents'))
    store.setActiveTool('select')
  }
}

function activateMeasure(mode: string, tool: string) {
  if (markupStore.isActive) markupStore.cancelMarkup()
  measureStore.setMeasureMode(mode as any)
  store.setActiveTool(tool as any)
  closeSubmenu()
}

function activateMarkup(type: string, tool: string) {
  if (measureStore.isActive) measureStore.cancelMeasurement()
  markupStore.setMarkupType(type as any)
  store.setActiveTool(tool as any)
  closeSubmenu()
}

function handleOpenFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dwg,.dxf'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) {
      window.dispatchEvent(new CustomEvent('cad:open-file', { detail: file }))
    }
  }
  input.click()
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

function toggleBackground() {
  document.documentElement.style.setProperty(
    '--cad-bg-canvas',
    getComputedStyle(document.documentElement).getPropertyValue('--cad-bg-canvas').trim() === '#1A1A1A'
      ? '#FFFFFF'
      : '#1A1A1A',
  )
}

function handleMarkupSave() {
  const fileName = store.currentFile ?? 'untitled'
  const data = markupStore.exportToJson(fileName)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName.replace(/\.[^.]+$/, '')}_markup.json`
  a.click()
  URL.revokeObjectURL(url)
  toastStore.show('마크업을 저장했습니다', 'success', 2000)
}

function handleMarkupLoad() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      markupStore.importFromJson(data)
      toastStore.show('마크업을 불러왔습니다', 'success', 2000)
    } catch {
      toastStore.show('마크업 파일을 읽을 수 없습니다', 'error')
    }
  }
  input.click()
}

function handleExportPng() {
  const success = exportToPng(store.currentFile ?? undefined)
  if (success) {
    toastStore.show('PNG으로 내보냈습니다', 'success', 2000)
  } else {
    toastStore.show('내보내기 실패: 캔버스를 캡처할 수 없습니다', 'error')
  }
  closeSubmenu()
}

function handleExportJpeg() {
  const success = exportToJpeg(store.currentFile ?? undefined)
  if (success) {
    toastStore.show('JPEG으로 내보냈습니다', 'success', 2000)
  } else {
    toastStore.show('내보내기 실패: 캔버스를 캡처할 수 없습니다', 'error')
  }
  closeSubmenu()
}

function handleExportPdf() {
  closeSubmenu()
  showExportDialog.value = true
}

function handlePrint() {
  const success = printDrawing()
  if (!success) {
    toastStore.show('인쇄 실패: 캔버스를 캡처할 수 없습니다', 'error')
  }
  closeSubmenu()
}

const isMeasureActive = (tool: ViewerTool) => store.activeTool === tool
</script>

<template>
  <aside class="sidebar-root">
    <!-- 파일 열기 -->
    <button class="sidebar-item" title="파일 열기 (Ctrl+O)" @click="handleOpenFile">
      <FolderOpenIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">열기</span>
    </button>

    <!-- 내보내기 -->
    <div class="sidebar-item-wrapper" ref="exportBtnRef">
      <button
        class="sidebar-item"
        :class="{ 'sidebar-item--active': activeSubmenu === 'export' }"
        title="내보내기"
        @click.stop="toggleSubmenu('export', exportBtnRef)"
      >
        <DownloadIcon :size="22" :stroke-width="1.5" />
        <span class="sidebar-label">내보내기</span>
      </button>
    </div>

    <div class="sidebar-divider" />

    <!-- 선택 -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.activeTool === 'select' }"
      title="선택 (S)"
      @click="handleToolClick('select')"
    >
      <MousePointer2Icon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">선택</span>
    </button>

    <!-- 이동 (Pan) -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.activeTool === 'pan' }"
      title="이동 (P)"
      @click="handleToolClick('pan')"
    >
      <HandIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">이동</span>
    </button>

    <!-- 전체 도면보기 -->
    <button class="sidebar-item" title="전체 도면보기 (Home)" @click="handleToolClick('fit')">
      <Maximize2Icon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">전체보기</span>
    </button>

    <!-- 줌 -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.activeTool === 'zoom-window' }"
      title="줌 윈도우 (Z)"
      @click="handleToolClick('zoom-window')"
    >
      <ZoomInIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">줌</span>
    </button>

    <!-- 전체 화면 -->
    <button class="sidebar-item" title="전체 화면 (F11)" @click="toggleFullscreen">
      <MonitorIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">전체 화면</span>
    </button>

    <!-- 배경 전환 -->
    <button class="sidebar-item" title="배경 전환" @click="toggleBackground">
      <SunMoonIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">배경 전환</span>
    </button>

    <div class="sidebar-divider" />

    <!-- 치수 (측정) - 서브메뉴 있음 -->
    <div class="sidebar-item-wrapper" ref="measureBtnRef">
      <button
        class="sidebar-item"
        :class="{
          'sidebar-item--active': activeSubmenu === 'measure' || store.activeTool.startsWith('measure-'),
        }"
        title="치수 측정"
        @click.stop="toggleSubmenu('measure', measureBtnRef)"
      >
        <RulerIcon :size="22" :stroke-width="1.5" />
        <span class="sidebar-label">치수</span>
      </button>
    </div>

    <!-- 주석 (마크업) - 서브메뉴 있음 -->
    <div class="sidebar-item-wrapper" ref="markupBtnRef">
      <button
        class="sidebar-item"
        :class="{
          'sidebar-item--active': activeSubmenu === 'markup' || store.activeTool.startsWith('markup-'),
        }"
        title="주석 (마크업)"
        @click.stop="toggleSubmenu('markup', markupBtnRef)"
      >
        <StickyNoteIcon :size="22" :stroke-width="1.5" />
        <span class="sidebar-label">주석</span>
      </button>
    </div>

    <!-- 주석 숨기기 -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': markupStore.markups.length > 0 && !markupStore.isVisible }"
      title="주석 숨기기"
      @click="markupStore.toggleVisibility()"
      :disabled="markupStore.markups.length === 0"
    >
      <EyeOffIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">주석 숨기기</span>
    </button>

    <div class="sidebar-divider" />

    <!-- 레이어 -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.isLayerPanelOpen }"
      title="레이어 패널"
      @click="store.toggleLayerPanel()"
    >
      <LayersIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">레이어</span>
    </button>

    <!-- BOM -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.isBomPanelOpen }"
      title="BOM 트리"
      @click="store.toggleBomPanel()"
    >
      <ListTreeIcon :size="22" :stroke-width="1.5" />
      <span class="sidebar-label">BOM</span>
    </button>

    <!-- 측정 설정 다이얼로그 -->
    <MeasurementSettingsDialog
      v-if="showSettingsDialog"
      @close="showSettingsDialog = false"
    />

    <!-- PDF 내보내기 다이얼로그 -->
    <ExportDialog
      v-if="showExportDialog"
      @close="showExportDialog = false"
    />
  </aside>

  <!-- 팝오버를 Teleport로 body에 렌더링 (overflow 클리핑 방지) -->
  <Teleport to="body">
    <!-- 내보내기 서브메뉴 팝오버 -->
    <Transition name="popover">
      <div
        v-if="activeSubmenu === 'export'"
        class="submenu-popover"
        :style="popoverStyle"
        @click.stop
      >
        <div class="submenu-header">내보내기</div>
        <button class="submenu-item" @click="handleExportPdf">
          <FileTextIcon :size="18" :stroke-width="1.5" />
          <span>PDF 문서</span>
        </button>
        <button class="submenu-item" @click="handleExportPng">
          <ImageIcon :size="18" :stroke-width="1.5" />
          <span>PNG 이미지</span>
        </button>
        <button class="submenu-item" @click="handleExportJpeg">
          <ImageIcon :size="18" :stroke-width="1.5" />
          <span>JPEG 이미지</span>
        </button>
        <div class="submenu-divider" />
        <button class="submenu-item" @click="handlePrint">
          <PrinterIcon :size="18" :stroke-width="1.5" />
          <span>인쇄</span>
        </button>
      </div>
    </Transition>

    <!-- 측정 서브메뉴 팝오버 -->
    <Transition name="popover">
      <div
        v-if="activeSubmenu === 'measure'"
        class="submenu-popover"
        :style="popoverStyle"
        @click.stop
      >
        <div class="submenu-header">치수 측정</div>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': isMeasureActive('measure-distance') }"
          @click="activateMeasure('distance', 'measure-distance')"
        >
          <RulerIcon :size="18" :stroke-width="1.5" />
          <span>거리</span>
          <kbd class="submenu-shortcut">D</kbd>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': isMeasureActive('measure-area') }"
          @click="activateMeasure('area', 'measure-area')"
        >
          <SquareIcon :size="18" :stroke-width="1.5" />
          <span>면적</span>
          <kbd class="submenu-shortcut">A</kbd>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': isMeasureActive('measure-angle') }"
          @click="activateMeasure('angle', 'measure-angle')"
        >
          <TriangleRightIcon :size="18" :stroke-width="1.5" />
          <span>각도</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': isMeasureActive('measure-coordinate') }"
          @click="activateMeasure('coordinate', 'measure-coordinate')"
        >
          <CrosshairIcon :size="18" :stroke-width="1.5" />
          <span>좌표</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': isMeasureActive('measure-arc-length') }"
          @click="activateMeasure('arc-length', 'measure-arc-length')"
        >
          <SplineIcon :size="18" :stroke-width="1.5" />
          <span>호 길이</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': isMeasureActive('measure-point-to-line') }"
          @click="activateMeasure('point-to-line', 'measure-point-to-line')"
        >
          <MoveIcon :size="18" :stroke-width="1.5" />
          <span>점-선 거리</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': isMeasureActive('measure-object') }"
          @click="activateMeasure('object', 'measure-object')"
        >
          <BoxIcon :size="18" :stroke-width="1.5" />
          <span>객체</span>
        </button>
        <div class="submenu-divider" />
        <button class="submenu-item" @click="showSettingsDialog = true; closeSubmenu()">
          <SettingsIcon :size="18" :stroke-width="1.5" />
          <span>축척 설정</span>
        </button>
        <button class="submenu-item" @click="measureStore.clearMeasurements(); closeSubmenu()">
          <Trash2Icon :size="18" :stroke-width="1.5" />
          <span>측정 지우기</span>
        </button>
      </div>
    </Transition>

    <!-- 주석 서브메뉴 팝오버 -->
    <Transition name="popover">
      <div
        v-if="activeSubmenu === 'markup'"
        class="submenu-popover"
        :style="popoverStyle"
        @click.stop
      >
        <div class="submenu-header">주석 도구</div>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-text' }"
          @click="activateMarkup('text', 'markup-text')"
        >
          <TypeIcon :size="18" :stroke-width="1.5" />
          <span>텍스트</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-rect' }"
          @click="activateMarkup('rect', 'markup-rect')"
        >
          <SquareIcon :size="18" :stroke-width="1.5" />
          <span>사각형</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-circle' }"
          @click="activateMarkup('circle', 'markup-circle')"
        >
          <CircleIcon :size="18" :stroke-width="1.5" />
          <span>원</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-arrow' }"
          @click="activateMarkup('arrow', 'markup-arrow')"
        >
          <ArrowRightIcon :size="18" :stroke-width="1.5" />
          <span>화살표</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-line' }"
          @click="activateMarkup('line', 'markup-line')"
        >
          <MinusIcon :size="18" :stroke-width="1.5" />
          <span>직선</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-ellipse' }"
          @click="activateMarkup('ellipse', 'markup-ellipse')"
        >
          <CircleIcon :size="18" :stroke-width="1.5" />
          <span>타원</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-revcloud' }"
          @click="activateMarkup('revcloud', 'markup-revcloud')"
        >
          <CloudIcon :size="18" :stroke-width="1.5" />
          <span>구름형</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-leader' }"
          @click="activateMarkup('leader', 'markup-leader')"
        >
          <CornerDownRightIcon :size="18" :stroke-width="1.5" />
          <span>지시선</span>
        </button>
        <button
          class="submenu-item"
          :class="{ 'submenu-item--active': store.activeTool === 'markup-freehand' }"
          @click="activateMarkup('freehand', 'markup-freehand')"
        >
          <PenToolIcon :size="18" :stroke-width="1.5" />
          <span>자유곡선</span>
        </button>
        <div class="submenu-divider" />
        <button class="submenu-item" @click="handleMarkupSave(); closeSubmenu()">
          <SaveIcon :size="18" :stroke-width="1.5" />
          <span>저장</span>
        </button>
        <button class="submenu-item" @click="handleMarkupLoad(); closeSubmenu()">
          <UploadIcon :size="18" :stroke-width="1.5" />
          <span>불러오기</span>
        </button>
        <button class="submenu-item" @click="markupStore.clearMarkups(); closeSubmenu()">
          <Trash2Icon :size="18" :stroke-width="1.5" />
          <span>전체 삭제</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sidebar-root {
  width: var(--cad-left-toolbar-width);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--cad-space-2) 0;
  background: var(--cad-bg-panel);
  border-right: 1px solid var(--cad-border-default);
  user-select: none;
  overflow-y: auto;
  overflow-x: visible;
}

.sidebar-item-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 64px;
  height: 56px;
  border-radius: var(--cad-radius-md);
  color: var(--cad-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
  padding: 4px 2px;
}

.sidebar-item:hover:not(:disabled) {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.sidebar-item:disabled {
  opacity: 0.35;
  cursor: default;
}

.sidebar-item--active {
  background: var(--cad-accent-active-bg);
  color: var(--cad-accent-active-text);
  border-color: var(--cad-accent-active-border);
}

.sidebar-label {
  font-size: 9px;
  font-weight: var(--cad-font-medium);
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
}

.sidebar-divider {
  width: 48px;
  height: 1px;
  background: var(--cad-border-default);
  margin: 4px 0;
  flex-shrink: 0;
}
</style>

<!-- 팝오버 스타일은 Teleport로 body에 렌더링되므로 scoped 밖에서 정의 -->
<style>
.submenu-popover {
  min-width: 180px;
  background: var(--cad-bg-panel, #27292D);
  border: 1px solid var(--cad-border-default, #3E4044);
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
}

.submenu-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--cad-text-muted, #737373);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--cad-border-default, #3E4044);
  margin-bottom: 4px;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--cad-text-secondary, #A3A3A3);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 100ms ease-out;
  text-align: left;
}

.submenu-item > span {
  flex: 1;
}

.submenu-shortcut {
  font-size: 10px;
  font-family: var(--cad-font-mono, 'Consolas', monospace);
  color: var(--cad-text-muted, #737373);
  padding: 1px 5px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  line-height: 1.2;
  flex-shrink: 0;
}

.submenu-item:hover {
  background: var(--cad-hover-bg, #323539);
  color: var(--cad-text-primary, #D4D4D4);
}

.submenu-item--active {
  background: rgba(37, 99, 235, 0.2);
  color: #60A5FA;
}

.submenu-divider {
  height: 1px;
  background: var(--cad-border-default, #3E4044);
  margin: 4px 8px;
}

/* ─── 팝오버 트랜지션 ─── */
.popover-enter-active {
  transition: opacity 120ms ease-out, transform 120ms ease-out;
}
.popover-leave-active {
  transition: opacity 80ms ease-in, transform 80ms ease-in;
}
.popover-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.popover-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
