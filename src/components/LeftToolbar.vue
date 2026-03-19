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

function activateMeasure(mode: string, tool: string, areaSubType?: string) {
  if (markupStore.isActive) markupStore.cancelMarkup()
  measureStore.setMeasureMode(mode as any, areaSubType as any)
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
  <div class="left-toolbar-wrapper">
  <aside class="sidebar-root">
    <!-- 파일 열기 -->
    <button class="sidebar-item" title="파일 열기 (Ctrl+O)" @click="handleOpenFile">
      <FolderOpenIcon :size="18" :stroke-width="1.5" />
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
        <DownloadIcon :size="18" :stroke-width="1.5" />
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
      <MousePointer2Icon :size="18" :stroke-width="1.5" />
      <span class="sidebar-label">선택</span>
    </button>

    <!-- 이동 (Pan) -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.activeTool === 'pan' }"
      title="이동 (P)"
      @click="handleToolClick('pan')"
    >
      <HandIcon :size="18" :stroke-width="1.5" />
      <span class="sidebar-label">이동</span>
    </button>

    <!-- 전체 도면보기 -->
    <button class="sidebar-item" title="전체 도면보기 (Home)" @click="handleToolClick('fit')">
      <Maximize2Icon :size="18" :stroke-width="1.5" />
      <span class="sidebar-label">전체보기</span>
    </button>

    <!-- 줌 -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.activeTool === 'zoom-window' }"
      title="줌 윈도우 (Z)"
      @click="handleToolClick('zoom-window')"
    >
      <ZoomInIcon :size="18" :stroke-width="1.5" />
      <span class="sidebar-label">줌</span>
    </button>

    <!-- 전체 화면 -->
    <button class="sidebar-item" title="전체 화면 (F11)" @click="toggleFullscreen">
      <MonitorIcon :size="18" :stroke-width="1.5" />
      <span class="sidebar-label">전체 화면</span>
    </button>

    <!-- 배경 전환 -->
    <button class="sidebar-item" title="배경 전환" @click="toggleBackground">
      <SunMoonIcon :size="18" :stroke-width="1.5" />
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
        <RulerIcon :size="18" :stroke-width="1.5" />
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
        <StickyNoteIcon :size="18" :stroke-width="1.5" />
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
      <EyeOffIcon :size="18" :stroke-width="1.5" />
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
      <LayersIcon :size="18" :stroke-width="1.5" />
      <span class="sidebar-label">레이어</span>
    </button>

    <!-- BOM -->
    <button
      class="sidebar-item"
      :class="{ 'sidebar-item--active': store.isBomPanelOpen }"
      title="BOM 트리"
      @click="store.toggleBomPanel()"
    >
      <ListTreeIcon :size="18" :stroke-width="1.5" />
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
        class="submenu-popover submenu-popover--measure"
        :style="popoverStyle"
        @click.stop
      >
        <!-- 길이 -->
        <button
          class="measure-menu-item"
          :class="{ 'measure-menu-item--active': isMeasureActive('measure-distance') }"
          @click="activateMeasure('distance', 'measure-distance')"
        >
          <div class="measure-menu-icon">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <line x1="4" y1="16" x2="36" y2="16" stroke="currentColor" stroke-width="1.5" />
              <line x1="4" y1="10" x2="4" y2="22" stroke="currentColor" stroke-width="1.5" />
              <line x1="36" y1="10" x2="36" y2="22" stroke="currentColor" stroke-width="1.5" />
              <polygon points="8,16 4,13 4,19" fill="currentColor" />
              <polygon points="32,16 36,13 36,19" fill="currentColor" />
            </svg>
          </div>
          <span class="measure-menu-label">길이</span>
        </button>

        <!-- 면적 — 삼각형 (3점) -->
        <button
          class="measure-menu-item"
          :class="{ 'measure-menu-item--active': isMeasureActive('measure-area') && measureStore.areaSubType === 'triangle' }"
          @click="activateMeasure('area', 'measure-area', 'triangle')"
        >
          <div class="measure-menu-icon">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <polygon points="8,26 20,4 32,26" fill="rgba(96,165,250,0.15)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
              <circle cx="8" cy="26" r="2" fill="#4ADE80" />
              <circle cx="20" cy="4" r="2" fill="#4ADE80" />
              <circle cx="32" cy="26" r="2" fill="#4ADE80" />
            </svg>
          </div>
          <span class="measure-menu-label">삼각형</span>
        </button>

        <!-- 면적 — 사각형 (4점) -->
        <button
          class="measure-menu-item"
          :class="{ 'measure-menu-item--active': isMeasureActive('measure-area') && measureStore.areaSubType === 'rectangle' }"
          @click="activateMeasure('area', 'measure-area', 'rectangle')"
        >
          <div class="measure-menu-icon">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <rect x="6" y="6" width="28" height="20" fill="rgba(96,165,250,0.15)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
              <circle cx="6" cy="6" r="2" fill="#4ADE80" />
              <circle cx="34" cy="6" r="2" fill="#4ADE80" />
              <circle cx="34" cy="26" r="2" fill="#4ADE80" />
              <circle cx="6" cy="26" r="2" fill="#4ADE80" />
            </svg>
          </div>
          <span class="measure-menu-label">사각형</span>
        </button>

        <!-- 면적 — 다각형 (n점, 더블클릭 완료) -->
        <button
          class="measure-menu-item"
          :class="{ 'measure-menu-item--active': isMeasureActive('measure-area') && measureStore.areaSubType === 'polygon' }"
          @click="activateMeasure('area', 'measure-area', 'polygon')"
        >
          <div class="measure-menu-icon">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <polygon points="10,26 4,14 14,4 28,4 36,14 30,26" fill="rgba(96,165,250,0.15)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
              <circle cx="10" cy="26" r="1.5" fill="#4ADE80" />
              <circle cx="4" cy="14" r="1.5" fill="#4ADE80" />
              <circle cx="14" cy="4" r="1.5" fill="#4ADE80" />
              <circle cx="28" cy="4" r="1.5" fill="#4ADE80" />
              <circle cx="36" cy="14" r="1.5" fill="#4ADE80" />
              <circle cx="30" cy="26" r="1.5" fill="#4ADE80" />
            </svg>
          </div>
          <span class="measure-menu-label">다각형</span>
        </button>

        <!-- 좌표 측정 -->
        <button
          class="measure-menu-item"
          :class="{ 'measure-menu-item--active': isMeasureActive('measure-coordinate') }"
          @click="activateMeasure('coordinate', 'measure-coordinate')"
        >
          <div class="measure-menu-icon">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <line x1="4" y1="28" x2="36" y2="28" stroke="currentColor" stroke-width="1" opacity="0.5" />
              <line x1="4" y1="28" x2="4" y2="4" stroke="currentColor" stroke-width="1" opacity="0.5" />
              <path d="M8 24 L16 10 L24 18 L32 6" stroke="#60A5FA" stroke-width="1.5" fill="none" stroke-dasharray="3 2" />
              <circle cx="16" cy="10" r="2.5" fill="#4ADE80" />
              <circle cx="24" cy="18" r="2.5" fill="#F59E0B" />
              <circle cx="32" cy="6" r="2.5" fill="#4ADE80" />
            </svg>
          </div>
          <span class="measure-menu-label">좌표 측정</span>
        </button>

        <!-- 호 길이 측정 -->
        <button
          class="measure-menu-item"
          :class="{ 'measure-menu-item--active': isMeasureActive('measure-arc-length') }"
          @click="activateMeasure('arc-length', 'measure-arc-length')"
        >
          <div class="measure-menu-icon">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <path d="M6 26 Q20 0 34 26" stroke="currentColor" stroke-width="1.5" fill="none" />
              <line x1="6" y1="26" x2="6" y2="20" stroke="currentColor" stroke-width="1.2" />
              <line x1="34" y1="26" x2="34" y2="20" stroke="currentColor" stroke-width="1.2" />
              <path d="M14 10 Q20 4 26 10" stroke="#60A5FA" stroke-width="1.2" fill="none" stroke-dasharray="2 2" />
            </svg>
          </div>
          <span class="measure-menu-label">호 길이 측정</span>
        </button>

        <!-- 각도 측정 -->
        <button
          class="measure-menu-item"
          :class="{ 'measure-menu-item--active': isMeasureActive('measure-angle') }"
          @click="activateMeasure('angle', 'measure-angle')"
        >
          <div class="measure-menu-icon">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <line x1="6" y1="28" x2="34" y2="28" stroke="currentColor" stroke-width="1.5" />
              <line x1="6" y1="28" x2="22" y2="4" stroke="currentColor" stroke-width="1.5" />
              <path d="M14 28 A8 8 0 0 1 12 20" stroke="#F59E0B" stroke-width="1.5" fill="none" />
              <text x="17" y="24" fill="#F59E0B" font-size="8" font-weight="600">°</text>
            </svg>
          </div>
          <span class="measure-menu-label">각도 측정</span>
        </button>

        <!-- 측정 설정 -->
        <button class="measure-menu-item measure-menu-item--full measure-menu-item--settings" @click="showSettingsDialog = true; closeSubmenu()">
          <div class="measure-menu-icon">
            <SettingsIcon :size="16" :stroke-width="1.3" />
          </div>
          <span class="measure-menu-label">측정 설정</span>
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
  </div>
</template>

<style scoped>
.sidebar-root {
  width: var(--cad-left-toolbar-width);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 4px 0;
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
  gap: 2px;
  width: 56px;
  height: 44px;
  border-radius: var(--cad-radius-md);
  color: var(--cad-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
  padding: 3px 2px;
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
  font-size: 8px;
  font-weight: var(--cad-font-medium);
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 52px;
}

.sidebar-divider {
  width: 40px;
  height: 1px;
  background: var(--cad-border-default);
  margin: 2px 0;
  flex-shrink: 0;
}
</style>

<!-- 팝오버 스타일은 Teleport로 body에 렌더링되므로 scoped 밖에서 정의 -->
<style>
.submenu-popover {
  min-width: 180px;
  /* 항상 다크 테마 — 배경 전환과 무관하게 고정 */
  background: #27292D;
  border: 1px solid #3E4044;
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
  color-scheme: dark;
}

.submenu-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3E4044;
  margin-bottom: 4px;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  font-size: 12px;
  color: #A3A3A3;
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
  color: #737373;
  padding: 1px 5px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  line-height: 1.2;
  flex-shrink: 0;
}

.submenu-item:hover {
  background: #323539;
  color: #D4D4D4;
}

.submenu-item--active {
  background: rgba(37, 99, 235, 0.2);
  color: #60A5FA;
}

.submenu-divider {
  height: 1px;
  background: #3E4044;
  margin: 4px 8px;
}

/* ─── 측정 메뉴 (2열 그리드) ─── */
.submenu-popover--measure {
  min-width: 180px;
  max-width: 200px;
  padding: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  /* 다크 테마 강제 적용 (배경 전환 시에도 항상 다크) */
  background: #1E1F22 !important;
  border-color: #3E4044 !important;
}

.submenu-popover--measure .submenu-header {
  grid-column: 1 / -1;
  margin-bottom: 2px;
  border-bottom: 1px solid #3E4044;
  padding: 3px 6px 6px;
}

.measure-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 4px;
  background: #27292D;
  border: 1px solid #3E4044;
  color: #A3A3A3;
  cursor: pointer;
  transition: all 100ms ease-out;
  min-height: 40px;
}

.measure-menu-item:hover {
  background: #323539;
  color: #D4D4D4;
  border-color: #525660;
}

.measure-menu-item--active {
  background: rgba(37, 99, 235, 0.15);
  color: #60A5FA;
  border-color: rgba(59, 130, 246, 0.4);
}

.measure-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  color: inherit;
}

.measure-menu-icon svg {
  color: inherit;
  width: 28px;
  height: 22px;
}

.measure-menu-label {
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

.measure-menu-item--full {
  grid-column: 1 / -1;
  flex-direction: row;
  gap: 6px;
  min-height: 28px;
  padding: 5px 8px;
}

.measure-menu-item--settings {
  margin-top: 2px;
  border-top: 1px solid #3E4044;
  border-radius: 0 0 4px 4px;
  background: #1E1F22;
}

.submenu-item--danger {
  color: #EF4444 !important;
}
.submenu-item--danger:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #F87171 !important;
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
