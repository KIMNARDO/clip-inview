<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { useLayerStore } from '@/stores/layer'
import { useMeasurementStore } from '@/stores/measurement'
import { useMeasurementSettingsStore } from '@/stores/measurementSettings'
import { useMarkupStore } from '@/stores/markup'
import { useBomStore } from '@/stores/bom'
import { useLayoutStore } from '@/stores/layout'
import { useHistoryStore } from '@/stores/history'
import { useSettingsStore } from '@/stores/settings'
import { CadEngine } from '@/services/cadEngine'
import { convertDwgToDxf } from '@/services/converterClient'
import {
  validateFileType,
  validateFileSize,
  extractFileFromDragEvent,
} from '@/utils/fileLoader'
import { UploadIcon, LoaderIcon } from 'lucide-vue-next'
import MarkupOverlay from './MarkupOverlay.vue'
import MeasurementOverlay from './MeasurementOverlay.vue'
import MarkupTextInput from './MarkupTextInput.vue'
import SnapIndicator from './SnapIndicator.vue'
import GridOverlay from './GridOverlay.vue'
import CrosshairOverlay from './CrosshairOverlay.vue'
import type { SnapResult, Point2D, MarkupEntity } from '@/types/cad'

const store = useAppStore()
const toast = useToastStore()
const layerStore = useLayerStore()
const measureStore = useMeasurementStore()
const measureSettings = useMeasurementSettingsStore()
const markupStore = useMarkupStore()
const bomStore = useBomStore()
const layoutStore = useLayoutStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()
const viewerRoot = ref<HTMLElement | null>(null)
const canvasContainer = ref<HTMLElement | null>(null)
const isDragOver = ref(false)
const isLoading = ref(false)
const currentSnap = ref<SnapResult | null>(null)
const markupOverlay = ref<InstanceType<typeof MarkupOverlay> | null>(null)
const measurementOverlay = ref<InstanceType<typeof MeasurementOverlay> | null>(null)
const gridOverlay = ref<InstanceType<typeof GridOverlay> | null>(null)
const crosshairOverlay = ref<InstanceType<typeof CrosshairOverlay> | null>(null)
const showTextInput = ref(false)
const textInputPos = ref({ x: 0, y: 0 })
const isFreehandDrawing = ref(false)
const freehandPoints = ref<Point2D[]>([])
const isConverting = ref(false)
/** 현재 로딩 중인 원본 DWG File — 자동 변환 시 사용 */
let pendingDwgFile: File | null = null

let engine: CadEngine | null = null
let resizeObserver: ResizeObserver | null = null
/** mlightcad mouseMove 이벤트에서 받은 정확한 월드 좌표 (클릭 시 사용) */
let lastAccurateWorldPos: Point2D = { x: 0, y: 0 }

const isMeasuring = computed(() => measureStore.isActive)
const isMarkingUp = computed(() => markupStore.isActive)

// --- 좌클릭 드래그 → 팬 상태 추적 ---
const isPanning = ref(false)
/** 드래그 판별을 위한 클릭 시작 좌표 */
let clickStartX = 0
let clickStartY = 0
const PAN_DRAG_THRESHOLD = 3

// --- CAD 엔진 초기화 ---
onMounted(async () => {
  if (!canvasContainer.value) return

  engine = new CadEngine()
  await engine.initialize(canvasContainer.value)

  // 측정 렌더러를 CadEngine에 바인딩
  measureStore.bindEngine(engine)
  measureStore.setFormatter({
    formatLength: (v: number) => measureSettings.formatLength(v),
    formatArea: (v: number) => measureSettings.formatArea(v),
    formatAngle: (v: number) => measureSettings.formatAngle(v),
    formatCoordinate: (x: number, y: number) => measureSettings.formatCoordinate(x, y),
  })

  // 측정 스타일 설정 초기화 및 변경 감시
  measureStore.setStyle(measureSettings.settings.style)
  watch(
    () => measureSettings.settings.style,
    (style) => measureStore.setStyle(style),
    { deep: true },
  )

  if (engine.viewer) {
    engine.viewer.onMouseMove = (pos) => {
      lastAccurateWorldPos = { x: pos.x, y: pos.y }
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
      // 팬 드래그 중에는 handleMouseMove에서 이미 오버레이 갱신하므로 중복 스킵
      if (!isPanning.value) {
        markupOverlay.value?.render()
        measurementOverlay.value?.render()
        gridOverlay.value?.render()
      }
    }
  }

  // 선택 이벤트 연결
  if (engine.viewer) {
    engine.viewer.onSelectionChanged = (entityIds) => {
      store.selectedEntityIds = entityIds
    }

    // 문서 품질 경고 — 타입별 알림 분기 + DWG 자동 변환
    engine.viewer.onDocumentWarning = (warning) => {
      const msg = warning.suggestion
        ? `${warning.message}\n${warning.suggestion}`
        : warning.message

      switch (warning.type) {
        case 'webgl-context-lost':
          toast.show(msg, 'error', 0)
          break
        case 'empty-document':
        case 'font-load-failed':
          toast.show(msg, 'error', 8000)
          break
        case 'exploded-text':
          handleExplodedTextWarning(msg)
          break
        case 'missing-fonts':
        case 'large-file':
        case 'unsupported-entities':
          toast.show(msg, 'warning', 6000)
          break
        default:
          toast.show(msg, 'info', 5000)
      }
    }
  }

  // 컨테이너 크기 변화 감시 — 속성 패널 토글 등 CSS Grid 변경 시
  // mlightcad의 autoResize는 window resize만 감지하므로 수동 트리거 필요
  resizeObserver = new ResizeObserver(() => {
    engine?.resize()
  })
  resizeObserver.observe(canvasContainer.value)

  // 브라우저 기본 줌(Ctrl+휠) 차단 — passive: false 필수
  viewerRoot.value?.addEventListener('wheel', handleWheel, { passive: false })

  window.addEventListener('cad:open-file', handleOpenFileEvent as EventListener)
  window.addEventListener('cad:fit-extents', handleFitExtents)
  window.addEventListener('cad:zoom', handleZoomEvent as EventListener)
  window.addEventListener('cad:layer-visibility', handleLayerVisibility as EventListener)
  window.addEventListener('cad:layer-visibility-all', handleLayerVisibilityAll as EventListener)
  window.addEventListener('cad:highlight-entities', handleHighlightEntities as EventListener)
  window.addEventListener('cad:clear-highlight', handleClearHighlight)
  window.addEventListener('cad:switch-layout', handleSwitchLayout as EventListener)
})

// 측정/마크업 완료 시 Undo 스택에 자동 저장
watch(() => measureStore.measurements.length, (newLen, oldLen) => {
  if (newLen !== oldLen && !historyStore.isRestoring) historyStore.pushState()
})
watch(() => markupStore.markups.length, (newLen, oldLen) => {
  if (newLen !== oldLen && !historyStore.isRestoring) historyStore.pushState()
})

// mlightcad는 항상 PAN 모드 유지 — SELECTION 모드는 내부적으로 뷰를 변경하여 도면이 사라지는 문제 발생
// 선택/클릭 처리는 handleCanvasClick에서 자체적으로 수행

onUnmounted(() => {
  viewerRoot.value?.removeEventListener('wheel', handleWheel)
  window.removeEventListener('cad:open-file', handleOpenFileEvent as EventListener)
  window.removeEventListener('cad:fit-extents', handleFitExtents)
  window.removeEventListener('cad:zoom', handleZoomEvent as EventListener)
  window.removeEventListener('cad:layer-visibility', handleLayerVisibility as EventListener)
  window.removeEventListener('cad:layer-visibility-all', handleLayerVisibilityAll as EventListener)
  window.removeEventListener('cad:highlight-entities', handleHighlightEntities as EventListener)
  window.removeEventListener('cad:clear-highlight', handleClearHighlight)
  window.removeEventListener('cad:switch-layout', handleSwitchLayout as EventListener)
  window.removeEventListener('cad:convert-to-dxf', handleConvertToDxf)
  resizeObserver?.disconnect()
  resizeObserver = null
  measureStore.unbindEngine()
  engine?.dispose()
  engine = null
})

function handleOpenFileBtn() {
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

  // DWG 파일인 경우 자동 변환을 위해 원본 보관
  if (file.name.toLowerCase().endsWith('.dwg')) {
    pendingDwgFile = file
  } else {
    pendingDwgFile = null
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

      // Layout 정보 로드
      layoutStore.setLayouts(engine.getLayouts())
      layoutStore.setCurrentLayout(engine.getCurrentLayoutName())

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

// --- DWG 텍스트 깨짐 → 자동/수동 DXF 변환 ---
function handleExplodedTextWarning(msg: string) {
  if (!settingsStore.isOdaConfigured()) {
    // ODA 미설정 → 안내 메시지만 표시
    toast.show(
      `${msg}\n\n설정에서 ODA File Converter 경로를 지정하면 자동 변환할 수 있습니다.`,
      'warning',
      10000,
    )
    return
  }

  if (settingsStore.autoConvert && pendingDwgFile) {
    // 자동 변환 모드 → 바로 변환 시도
    toast.show('텍스트 깨짐 감지 — DXF 자동 변환 중...', 'info', 3000)
    attemptDwgConversion(pendingDwgFile)
  } else {
    // 수동 모드 → 변환 안내
    toast.show(
      `${msg}\n\n파일 메뉴에서 "DXF로 변환"을 선택하거나, 설정에서 자동 변환을 활성화하세요.`,
      'warning',
      10000,
    )
  }
}

/** 백엔드 ODA 서비스를 통해 DWG→DXF 변환 후 자동 로드 */
async function attemptDwgConversion(dwgFile: File) {
  if (!engine || isConverting.value) return

  isConverting.value = true
  isLoading.value = true

  try {
    const result = await convertDwgToDxf(
      dwgFile,
      settingsStore.odaPath,
      settingsStore.outputVersion,
    )

    if (result.success && result.file) {
      toast.show('DXF 변환 성공 — 변환된 파일을 로드합니다.', 'success', 2000)
      // 변환된 DXF로 다시 로드 (pendingDwgFile을 null로 설정하여 재귀 방지)
      pendingDwgFile = null
      await loadFile(result.file)
    } else {
      toast.show(
        `DXF 변환 실패: ${result.error}\n원본 DWG를 그대로 표시합니다.`,
        'error',
        8000,
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '변환 오류'
    toast.show(`DXF 변환 중 오류: ${message}`, 'error', 8000)
  } finally {
    isConverting.value = false
    isLoading.value = false
  }
}

// 외부에서 수동 변환 트리거 가능
function handleConvertToDxf() {
  if (pendingDwgFile) {
    attemptDwgConversion(pendingDwgFile)
  } else {
    toast.show('현재 열린 DWG 파일이 없습니다.', 'info', 3000)
  }
}
window.addEventListener('cad:convert-to-dxf', handleConvertToDxf)

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
    markupOverlay.value?.render()
    measurementOverlay.value?.render()
    gridOverlay.value?.render()
  }
}

function handleZoomEvent(event: CustomEvent<number>) {
  if (engine?.viewer) {
    engine.viewer.zoom(event.detail)
    store.setZoomLevel(engine.getZoomLevel())
    markupOverlay.value?.render()
    measurementOverlay.value?.render()
    gridOverlay.value?.render()
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

function handleHighlightEntities(event: CustomEvent<string[]>) {
  store.selectedEntityIds = event.detail
}

function handleClearHighlight() {
  store.selectedEntityIds = []
}

function handleSwitchLayout(event: CustomEvent<string>) {
  if (!engine) return
  const name = event.detail
  const success = engine.switchLayout(name)
  if (success) {
    layoutStore.setCurrentLayout(name)
    store.setZoomLevel(engine.getZoomLevel())
    markupOverlay.value?.render()
    measurementOverlay.value?.render()
    gridOverlay.value?.render()
  }
}

// Pan/Zoom 후 오버레이 재렌더링은 viewChanged 이벤트에서 처리

// --- Ortho 제약 적용 ---
function applyOrthoConstraint(point: Point2D, previousPoints: Point2D[]): Point2D {
  if (!store.isOrthoEnabled || previousPoints.length === 0) return point
  const last = previousPoints[previousPoints.length - 1]!
  const dx = Math.abs(point.x - last.x)
  const dy = Math.abs(point.y - last.y)
  // X축 또는 Y축 중 더 가까운 방향으로 제약
  if (dx >= dy) {
    return { x: point.x, y: last.y }
  } else {
    return { x: last.x, y: point.y }
  }
}

// --- 마크업 히트 테스트 ---
function hitTestMarkups(worldPoint: Point2D): MarkupEntity | null {
  if (!markupStore.isVisible) return null
  const tolerance = 10 // 픽셀 허용 오차

  // 역순으로 검색 (최상위 마크업 우선)
  for (let i = markupStore.markups.length - 1; i >= 0; i--) {
    const m = markupStore.markups[i]!
    if (isPointNearMarkup(worldPoint, m, tolerance)) {
      return m
    }
  }
  return null
}

function isPointNearMarkup(worldPoint: Point2D, markup: MarkupEntity, _tolerance: number): boolean {
  if (markup.points.length === 0) return false

  switch (markup.type) {
    case 'text': {
      const p = markup.points[0]!
      // 텍스트 영역 근처 (월드 좌표 기준 대략적 판단)
      const dx = Math.abs(worldPoint.x - p.x)
      const dy = Math.abs(worldPoint.y - p.y)
      return dx < 50 && dy < 20
    }
    case 'rect': {
      if (markup.points.length < 2) return false
      const p1 = markup.points[0]!
      const p2 = markup.points[1]!
      const minX = Math.min(p1.x, p2.x) - 5
      const maxX = Math.max(p1.x, p2.x) + 5
      const minY = Math.min(p1.y, p2.y) - 5
      const maxY = Math.max(p1.y, p2.y) + 5
      return worldPoint.x >= minX && worldPoint.x <= maxX &&
             worldPoint.y >= minY && worldPoint.y <= maxY
    }
    case 'circle': {
      if (markup.points.length < 2) return false
      const center = markup.points[0]!
      const edge = markup.points[1]!
      const r = Math.hypot(edge.x - center.x, edge.y - center.y)
      const dist = Math.hypot(worldPoint.x - center.x, worldPoint.y - center.y)
      return Math.abs(dist - r) < 10
    }
    case 'arrow':
    case 'line':
    case 'leader': {
      if (markup.points.length < 2) return false
      const a = markup.points[0]!
      const b = markup.points[1]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len2 = dx * dx + dy * dy
      if (len2 === 0) return Math.hypot(worldPoint.x - a.x, worldPoint.y - a.y) < 10
      const t = Math.max(0, Math.min(1, ((worldPoint.x - a.x) * dx + (worldPoint.y - a.y) * dy) / len2))
      const projX = a.x + t * dx
      const projY = a.y + t * dy
      return Math.hypot(worldPoint.x - projX, worldPoint.y - projY) < 10
    }
    case 'ellipse':
    case 'revcloud': {
      if (markup.points.length < 2) return false
      const p1 = markup.points[0]!
      const p2 = markup.points[1]!
      const minX = Math.min(p1.x, p2.x) - 5
      const maxX = Math.max(p1.x, p2.x) + 5
      const minY = Math.min(p1.y, p2.y) - 5
      const maxY = Math.max(p1.y, p2.y) + 5
      return worldPoint.x >= minX && worldPoint.x <= maxX &&
             worldPoint.y >= minY && worldPoint.y <= maxY
    }
    case 'freehand': {
      if (markup.points.length < 2) return false
      // 각 세그먼트에 대해 거리 검사
      for (let i = 0; i < markup.points.length - 1; i++) {
        const a = markup.points[i]!
        const b = markup.points[i + 1]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len2 = dx * dx + dy * dy
        if (len2 === 0) continue
        const t = Math.max(0, Math.min(1, ((worldPoint.x - a.x) * dx + (worldPoint.y - a.y) * dy) / len2))
        const projX = a.x + t * dx
        const projY = a.y + t * dy
        if (Math.hypot(worldPoint.x - projX, worldPoint.y - projY) < 10) return true
      }
      return false
    }
  }
  return false
}

// --- 측정/마크업 클릭 ---
function handleCanvasClick(event: MouseEvent) {
  if (!engine) return
  if (event.shiftKey || event.altKey) return

  // 드래그 팬 후 클릭 무시
  const dragDist = Math.hypot(event.clientX - clickStartX, event.clientY - clickStartY)
  if (dragDist >= PAN_DRAG_THRESHOLD) return

  // mlightcad mouseMove에서 받은 정확한 월드 좌표 사용
  const worldPos = { ...lastAccurateWorldPos }
  let point = currentSnap.value ? currentSnap.value.point : worldPos

  // 선택 모드에서 마크업 히트 테스트
  if (!isMeasuring.value && !isMarkingUp.value && store.activeTool === 'select') {
    const hitMarkup = hitTestMarkups(point)
    markupStore.selectMarkup(hitMarkup?.id ?? null)
    return
  }

  // 측정 모드
  if (isMeasuring.value) {
    point = applyOrthoConstraint(point, measureStore.currentPoints)
    measureStore.addPoint(point)
    return
  }

  // 마크업 모드
  if (isMarkingUp.value) {
    point = applyOrthoConstraint(point, markupStore.currentPoints)

    // 텍스트: 1점 → 텍스트 입력 UI
    if (markupStore.activeMarkupType === 'text' && markupStore.currentPoints.length === 0) {
      markupStore.addPoint(point)
      const screenPos = engine.getScreenCoords(point.x, point.y)
      textInputPos.value = screenPos
      showTextInput.value = true
      return
    }

    // 지시선: 2점 → 텍스트 입력 UI
    if (markupStore.activeMarkupType === 'leader') {
      markupStore.addPoint(point)
      if (markupStore.currentPoints.length === 2) {
        const screenPos = engine.getScreenCoords(point.x, point.y)
        textInputPos.value = screenPos
        showTextInput.value = true
      }
      return
    }

    // freehand는 mousedown/mousemove/mouseup으로 처리
    if (markupStore.activeMarkupType === 'freehand') return

    markupStore.addPoint(point)
    return
  }
}

function handleCanvasDblClick() {
  if (isMeasuring.value && measureStore.activeMeasureMode === 'area' && measureStore.currentPoints.length >= 3) {
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

// --- 마우스 이벤트 (자유곡선 + 좌클릭 드래그 팬) ---
function handleMouseDown(event: MouseEvent) {
  if (!engine) return
  if (event.button !== 0) return // 좌클릭만

  // 자유곡선 모드
  if (markupStore.activeMarkupType === 'freehand') {
    const worldPos = { ...lastAccurateWorldPos }
    isFreehandDrawing.value = true
    freehandPoints.value = [worldPos]
    return
  }

  // 좌클릭 드래그 → 팬 상태 추적 준비 (측정/마크업 모드가 아닐 때)
  clickStartX = event.clientX
  clickStartY = event.clientY
}

function handleMouseMove(event: MouseEvent) {
  if (!engine) return

  // 십자 커서 위치 업데이트
  crosshairOverlay.value?.updatePosition(event)

  // 자유곡선 드래그
  if (isFreehandDrawing.value) {
    const worldPos = { ...lastAccurateWorldPos }
    freehandPoints.value.push(worldPos)
    markupOverlay.value?.render()
    return
  }

  // 좌클릭 드래그 → 팬 상태 추적 (측정/마크업이 아닐 때만)
  // mlightcad PAN 모드가 자체적으로 뷰를 이동하므로 engine.pan() 호출은 하지 않음
  // (이중 팬 방지 — 커스텀 pan + mlightcad 내장 pan이 동시 적용되면 뷰가 이탈함)
  if (event.buttons === 1 && !isMeasuring.value && !isMarkingUp.value) {
    const dx = event.clientX - clickStartX
    const dy = event.clientY - clickStartY
    if (!isPanning.value && Math.hypot(dx, dy) >= PAN_DRAG_THRESHOLD) {
      isPanning.value = true
    }
    if (isPanning.value) {
      // 오버레이 갱신은 mlightcad viewChanged 이벤트에서 처리됨
      // 단, 팬 중 빠른 갱신이 필요한 오버레이만 여기서 추가 갱신
      markupOverlay.value?.render()
      measurementOverlay.value?.render()
    }
  }
}

function handleMouseUp() {
  if (isFreehandDrawing.value) {
    isFreehandDrawing.value = false
    if (freehandPoints.value.length >= 2) {
      markupStore.completeFreehand(freehandPoints.value)
    }
    freehandPoints.value = []
    markupOverlay.value?.render()
  }
  if (isPanning.value) {
    isPanning.value = false
    // 팬 종료 시 그리드 오버레이 갱신 (팬 중에는 성능상 스킵)
    gridOverlay.value?.render()
  }
  isPanning.value = false
}

/** 브라우저 기본 줌(Ctrl+휠) 차단 — CAD 뷰어만 줌되어야 한다 */
function handleWheel(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
  }
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
    ref="viewerRoot"
    class="viewer-root"
    :class="{
      'viewer-root--measuring': isMeasuring,
      'viewer-root--marking': isMarkingUp,
      'viewer-root--panning': isPanning,
      'viewer-root--file-loaded': store.isFileLoaded,
    }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleCanvasClick"
    @dblclick="handleCanvasDblClick"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="crosshairOverlay?.hide()"
  >
    <div ref="canvasContainer" class="canvas-container" />

    <!-- 정밀 십자 커서 오버레이 -->
    <CrosshairOverlay
      ref="crosshairOverlay"
      :active="isMeasuring || isMarkingUp"
      :snapped="currentSnap !== null"
    />

    <!-- 그리드 오버레이 -->
    <GridOverlay
      ref="gridOverlay"
      :get-screen-coords="getScreenCoords"
    />

    <!-- 측정 오버레이 (도면 위 측정선 + 텍스트) -->
    <MeasurementOverlay
      ref="measurementOverlay"
      :get-screen-coords="getScreenCoords"
    />

    <!-- 마크업 오버레이 -->
    <MarkupOverlay
      ref="markupOverlay"
      :get-screen-coords="getScreenCoords"
      :freehand-points="freehandPoints"
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

    <!-- 빈 상태 — 웰컴 스크린 -->
    <div v-if="!store.isFileLoaded && !isLoading" class="empty-state">
      <div class="empty-state-content">
        <div class="welcome-logo-mark">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" class="welcome-blueprint-icon">
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <line x1="2" y1="8" x2="22" y2="8" />
            <line x1="8" y1="2" x2="8" y2="22" />
            <line x1="2" y1="15" x2="22" y2="15" />
            <line x1="15" y1="2" x2="15" y2="22" />
          </svg>
        </div>

        <div class="welcome-text-group">
          <p class="empty-state-title">Clip-inView</p>
          <p class="empty-state-subtitle">보안 온프레미스 DWG/DXF 뷰어</p>
        </div>

        <div class="welcome-actions">
          <button class="welcome-action-btn welcome-action-btn--primary" @click="handleOpenFileBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>파일 열기</span>
            <kbd class="welcome-kbd">Ctrl+O</kbd>
          </button>
          <div class="welcome-drop-hint">
            <UploadIcon :size="14" :stroke-width="1.5" />
            <span>또는 파일을 여기에 드래그하세요</span>
          </div>
        </div>

        <div class="welcome-shortcuts">
          <span class="welcome-shortcuts-label">단축키</span>
          <div class="welcome-shortcuts-row">
            <span class="shortcut-chip"><kbd>S</kbd> 선택</span>
            <span class="shortcut-chip"><kbd>P</kbd> 이동</span>
            <span class="shortcut-chip"><kbd>Z</kbd> 줌</span>
            <span class="shortcut-chip"><kbd>D</kbd> 거리</span>
            <span class="shortcut-chip"><kbd>Home</kbd> 전체보기</span>
          </div>
        </div>
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

/* 파일 로드 후 기본: grab 커서 (드래그 팬 유도) */
.viewer-root--file-loaded {
  cursor: grab;
}

/* 드래그 팬 중: grabbing */
.viewer-root--panning {
  cursor: grabbing !important;
}

/* 측정/마크업 모드: 시스템 커서 완전 숨김 → CrosshairOverlay가 전체 뷰포트 십자선 표시 */
.viewer-root--measuring,
.viewer-root--marking {
  cursor: none !important;
}

/* mlightcad 캔버스 포함 모든 자식 요소의 커서도 숨김 (:deep으로 scoped 범위 관통) */
.viewer-root--measuring :deep(*),
.viewer-root--marking :deep(*) {
  cursor: none !important;
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
  pointer-events: auto;
  z-index: 5;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cad-space-5, 20px);
  animation: welcome-fade-in 400ms ease-out;
}

@keyframes welcome-fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 20px;
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.welcome-blueprint-icon {
  color: var(--cad-accent-primary);
  opacity: 0.5;
}

.welcome-text-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.empty-state-title {
  font-size: 20px;
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-primary);
  letter-spacing: -0.3px;
}

.empty-state-subtitle {
  font-size: var(--cad-text-sm);
  color: var(--cad-text-muted);
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cad-space-3);
}

.welcome-action-btn {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  padding: 10px 24px;
  font-size: var(--cad-text-sm);
  border-radius: var(--cad-radius-md);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
  border: 1px solid transparent;
  font-weight: var(--cad-font-medium);
}

.welcome-action-btn--primary {
  background: var(--cad-accent-primary);
  color: #fff;
  border-color: var(--cad-accent-primary);
}

.welcome-action-btn--primary:hover {
  background: var(--cad-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.welcome-kbd {
  padding: 1px 6px;
  font-size: 10px;
  font-family: var(--cad-font-mono);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.8);
}

.welcome-drop-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
}

.welcome-shortcuts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: var(--cad-space-2);
}

.welcome-shortcuts-label {
  font-size: 9px;
  color: var(--cad-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: var(--cad-font-semibold);
}

.welcome-shortcuts-row {
  display: flex;
  gap: var(--cad-space-2);
  flex-wrap: wrap;
  justify-content: center;
}

.shortcut-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--cad-text-muted);
}

.shortcut-chip kbd {
  padding: 1px 5px;
  font-size: 9px;
  font-family: var(--cad-font-mono);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--cad-border-default);
  border-radius: 3px;
  color: var(--cad-text-secondary);
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
