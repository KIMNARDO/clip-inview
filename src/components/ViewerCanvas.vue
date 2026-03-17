<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { useLayerStore } from '@/stores/layer'
import { useMeasurementStore } from '@/stores/measurement'
import { useMarkupStore } from '@/stores/markup'
import { useBomStore } from '@/stores/bom'
import { CadEngine } from '@/services/cadEngine'
import {
  validateFileType,
  validateFileSize,
  extractFileFromDragEvent,
} from '@/utils/fileLoader'
import { UploadIcon, LoaderIcon } from 'lucide-vue-next'
import MeasurementOverlay from './MeasurementOverlay.vue'
import MarkupOverlay from './MarkupOverlay.vue'
import MarkupTextInput from './MarkupTextInput.vue'
import SnapIndicator from './SnapIndicator.vue'
import type { SnapResult, Point2D } from '@/types/cad'

const store = useAppStore()
const toast = useToastStore()
const layerStore = useLayerStore()
const measureStore = useMeasurementStore()
const markupStore = useMarkupStore()
const bomStore = useBomStore()
const canvasContainer = ref<HTMLElement | null>(null)
const isDragOver = ref(false)
const isLoading = ref(false)
const currentSnap = ref<SnapResult | null>(null)
const measureOverlay = ref<InstanceType<typeof MeasurementOverlay> | null>(null)
const markupOverlay = ref<InstanceType<typeof MarkupOverlay> | null>(null)
const showTextInput = ref(false)
const textInputPos = ref({ x: 0, y: 0 })

let engine: CadEngine | null = null

const isMeasuring = computed(() => measureStore.isActive)
const isMarkingUp = computed(() => markupStore.isActive)

// --- CAD 엔진 초기화 ---
onMounted(async () => {
  if (!canvasContainer.value) return

  engine = new CadEngine()
  await engine.initialize(canvasContainer.value)

  if (engine.viewer) {
    engine.viewer.onMouseMove = (pos) => {
      store.setCursorPosition(pos.x, pos.y)
      measureStore.setCursorPosition(pos)

      // 스냅 감지
      if (store.isOsnapEnabled && engine) {
        currentSnap.value = engine.getSnapPoint(pos.x, pos.y, [
          'endpoint',
          'midpoint',
          'center',
        ])
      } else {
        currentSnap.value = null
      }
    }
    engine.viewer.onZoomChange = (level) => {
      store.setZoomLevel(level)
      measureOverlay.value?.render()
      markupOverlay.value?.render()
    }
  }

  window.addEventListener('cad:open-file', handleOpenFileEvent as EventListener)
  window.addEventListener('cad:fit-extents', handleFitExtents)
  window.addEventListener('cad:zoom', handleZoomEvent as EventListener)
  window.addEventListener('cad:layer-visibility', handleLayerVisibility as EventListener)
  window.addEventListener('cad:layer-visibility-all', handleLayerVisibilityAll as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('cad:open-file', handleOpenFileEvent as EventListener)
  window.removeEventListener('cad:fit-extents', handleFitExtents)
  window.removeEventListener('cad:zoom', handleZoomEvent as EventListener)
  window.removeEventListener('cad:layer-visibility', handleLayerVisibility as EventListener)
  window.removeEventListener('cad:layer-visibility-all', handleLayerVisibilityAll as EventListener)
  engine?.dispose()
  engine = null
})

// --- 파일 로드 ---
async function loadFile(file: File) {
  if (!engine) return

  if (!validateFileType(file)) {
    toast.show(`지원하지 않는 파일 형식: ${file.name} (.dwg, .dxf만 가능)`, 'error')
    return
  }

  if (!validateFileSize(file)) {
    toast.show(`파일 크기가 500MB를 초과합니다: ${file.name}`, 'error')
    return
  }

  isLoading.value = true
  try {
    const success = await engine.loadFile(file)
    if (success) {
      store.setCurrentFile(file.name)
      store.setFileInfo(engine.fileInfo)
      store.setZoomLevel(engine.getZoomLevel())

      // 레이어 스토어 업데이트
      layerStore.setLayers(engine.getLayers())

      // BOM 데이터 로드
      bomStore.setBomData(engine.getBomData())

      // 측정/마크업 초기화
      measureStore.clearMeasurements()
      measureStore.cancelMeasurement()
      markupStore.clearMarkups()
      markupStore.cancelMarkup()

      toast.show(`${file.name} 파일을 열었습니다`, 'success', 2000)
    } else {
      toast.show(`파일을 열 수 없습니다: ${file.name}`, 'error')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    toast.show(`파일 로드 실패: ${message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// --- 이벤트 핸들러 ---
function handleOpenFileEvent(event: CustomEvent<File>) {
  if (event.detail) {
    loadFile(event.detail)
  }
}

function handleFitExtents() {
  if (engine) {
    engine.fitToExtents()
    store.setZoomLevel(engine.getZoomLevel())
    measureOverlay.value?.render()
    markupOverlay.value?.render()
  }
}

function handleZoomEvent(event: CustomEvent<number>) {
  if (engine?.viewer) {
    engine.viewer.zoom(event.detail)
    store.setZoomLevel(engine.getZoomLevel())
    measureOverlay.value?.render()
    markupOverlay.value?.render()
  }
}

function handleLayerVisibility(event: CustomEvent<{ layerName: string; visible: boolean }>) {
  if (engine) {
    engine.setLayerVisibility(event.detail.layerName, event.detail.visible)
  }
}

function handleLayerVisibilityAll(event: CustomEvent<boolean>) {
  if (engine) {
    const layers = engine.getLayers()
    for (const layer of layers) {
      engine.setLayerVisibility(layer.name, event.detail)
    }
  }
}

// --- 측정/마크업 클릭 ---
function handleCanvasClick(event: MouseEvent) {
  if (!engine) return
  if (event.shiftKey || event.altKey) return

  const worldPos = engine.getWorldCoords(event.clientX, event.clientY)
  const point = currentSnap.value ? currentSnap.value.point : worldPos

  // 측정 모드
  if (isMeasuring.value) {
    measureStore.addPoint(point)
    return
  }

  // 마크업 모드
  if (isMarkingUp.value) {
    if (markupStore.activeMarkupType === 'text' && markupStore.currentPoints.length === 0) {
      markupStore.addPoint(point)
      // 텍스트 입력 UI 표시
      const screenPos = engine.getScreenCoords(point.x, point.y)
      textInputPos.value = screenPos
      showTextInput.value = true
    } else {
      markupStore.addPoint(point)
    }
    return
  }
}

function handleCanvasDblClick() {
  if (isMeasuring.value && measureStore.activeMeasureMode === 'area') {
    measureStore.completeMeasurement()
  }
}

// --- 텍스트 마크업 완료 ---
function handleTextSubmit(text: string) {
  markupStore.completeTextMarkup(text)
  showTextInput.value = false
}

function handleTextCancel() {
  markupStore.cancelMarkup()
  showTextInput.value = false
}

function getScreenCoords(worldX: number, worldY: number): Point2D {
  return engine?.getScreenCoords(worldX, worldY) ?? { x: 0, y: 0 }
}

// --- 드래그 앤 드롭 ---
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const file = extractFileFromDragEvent(event)
  if (file) {
    loadFile(file)
  }
}
</script>

<template>
  <div
    class="viewer-root"
    :class="{ 'viewer-root--measuring': isMeasuring, 'viewer-root--marking': isMarkingUp }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleCanvasClick"
    @dblclick="handleCanvasDblClick"
  >
    <div ref="canvasContainer" class="canvas-container" />

    <!-- 측정 오버레이 -->
    <MeasurementOverlay
      ref="measureOverlay"
      :get-screen-coords="getScreenCoords"
    />

    <!-- 마크업 오버레이 -->
    <MarkupOverlay
      ref="markupOverlay"
      :get-screen-coords="getScreenCoords"
    />

    <!-- 텍스트 마크업 입력 -->
    <MarkupTextInput
      v-if="showTextInput"
      :x="textInputPos.x"
      :y="textInputPos.y"
      @submit="handleTextSubmit"
      @cancel="handleTextCancel"
    />

    <!-- 스냅 인디케이터 -->
    <SnapIndicator
      :snap="currentSnap"
      :get-screen-coords="getScreenCoords"
    />

    <!-- 빈 상태 오버레이 -->
    <div v-if="!store.isFileLoaded" class="empty-state">
      <div class="empty-state-content">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="empty-state-icon"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p class="empty-state-title">DWG/DXF 파일을 열어주세요</p>
        <p class="empty-state-hint">파일 > 열기 또는 Ctrl+O</p>
        <p class="empty-state-hint">또는 파일을 여기에 드래그하세요</p>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <LoaderIcon :size="32" :stroke-width="1.5" class="loading-spinner" />
        <p>파일 로딩 중...</p>
      </div>
    </div>

    <!-- 드래그 오버레이 -->
    <div v-if="isDragOver" class="drag-overlay">
      <div class="drag-overlay-content">
        <UploadIcon :size="48" :stroke-width="1" />
        <p>파일을 놓아서 열기</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewer-root {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--cad-bg-canvas);
  overflow: hidden;
}

.viewer-root--measuring,
.viewer-root--marking {
  cursor: crosshair;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cad-space-3);
}

.empty-state-icon {
  color: var(--cad-text-muted);
  opacity: 0.6;
}

.empty-state-title {
  font-size: var(--cad-text-md);
  color: var(--cad-text-secondary);
}

.empty-state-hint {
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 26, 0.8);
  z-index: 15;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cad-space-3);
  color: var(--cad-text-secondary);
  font-size: var(--cad-text-md);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.drag-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed var(--cad-accent-primary);
  z-index: 10;
}

.drag-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cad-space-3);
  color: var(--cad-accent-active-text);
  font-size: var(--cad-text-md);
}
</style>
