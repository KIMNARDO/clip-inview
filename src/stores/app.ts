import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ViewerTool, FileInfo, Point2D } from '@/types/cad'

export const useAppStore = defineStore('app', () => {
  // --- 파일 상태 ---
  const currentFile = ref<string | null>(null)
  const fileInfo = ref<FileInfo | null>(null)
  const isFileLoaded = ref(false)

  // --- 뷰어 상태 ---
  const zoomLevel = ref(100)
  const cursorPosition = ref<Point2D>({ x: 0, y: 0 })
  const activeTool = ref<ViewerTool>('select')

  // --- UI 상태 ---
  const isRibbonCollapsed = ref(false)
  const isPropertiesPanelOpen = ref(true)
  const isLayerPanelOpen = ref(false)
  const isBomPanelOpen = ref(false)
  const isCommandPaletteVisible = ref(true)

  // --- 선택 상태 ---
  const selectedEntityIds = ref<string[]>([])

  // --- 상태바 토글 ---
  const isGridEnabled = ref(false)
  const isSnapEnabled = ref(false)
  const isOrthoEnabled = ref(false)
  const isOsnapEnabled = ref(false)

  // --- Computed ---
  const formattedZoom = computed(() => `${Math.round(zoomLevel.value)}%`)
  const formattedCoords = computed(() => ({
    x: cursorPosition.value.x.toFixed(2),
    y: cursorPosition.value.y.toFixed(2),
  }))
  const activeToolLabel = computed(() => {
    const labels: Record<ViewerTool, string> = {
      select: '선택',
      pan: '이동',
      'zoom-window': '줌 윈도우',
      'zoom-extents': '전체 보기',
      fit: '맞춤',
      'measure-distance': '거리 측정',
      'measure-area': '면적 측정',
      'measure-angle': '각도 측정',
      'measure-coordinate': '좌표 측정',
      'measure-arc-length': '호 길이 측정',
      'measure-point-to-line': '점-선 거리',
      'measure-object': '객체 측정',
      'markup-text': '텍스트 마크업',
      'markup-rect': '사각형 마크업',
      'markup-circle': '원 마크업',
      'markup-arrow': '화살표 마크업',
      'markup-line': '직선 마크업',
      'markup-ellipse': '타원 마크업',
      'markup-revcloud': '구름형 마크업',
      'markup-leader': '지시선 마크업',
      'markup-freehand': '자유곡선 마크업',
    }
    return labels[activeTool.value]
  })

  // --- 파일 액션 ---
  function setCurrentFile(filePath: string | null) {
    currentFile.value = filePath
  }

  function setFileInfo(info: FileInfo | null) {
    fileInfo.value = info
    isFileLoaded.value = info !== null
  }

  // --- 뷰어 액션 ---
  function setZoomLevel(level: number) {
    zoomLevel.value = Math.max(1, Math.min(6400, level))
  }

  function setCursorPosition(x: number, y: number) {
    cursorPosition.value = { x, y }
  }

  function setActiveTool(tool: ViewerTool) {
    activeTool.value = tool
  }

  // --- UI 액션 ---
  function toggleRibbon() {
    isRibbonCollapsed.value = !isRibbonCollapsed.value
  }

  function togglePropertiesPanel() {
    isPropertiesPanelOpen.value = !isPropertiesPanelOpen.value
    if (isPropertiesPanelOpen.value) {
      isLayerPanelOpen.value = false
      isBomPanelOpen.value = false
    }
  }

  function toggleLayerPanel() {
    isLayerPanelOpen.value = !isLayerPanelOpen.value
    if (isLayerPanelOpen.value) {
      isPropertiesPanelOpen.value = false
      isBomPanelOpen.value = false
    }
  }

  function toggleBomPanel() {
    isBomPanelOpen.value = !isBomPanelOpen.value
    if (isBomPanelOpen.value) {
      isPropertiesPanelOpen.value = false
      isLayerPanelOpen.value = false
    }
  }

  function toggleGrid() {
    isGridEnabled.value = !isGridEnabled.value
  }

  function toggleSnap() {
    isSnapEnabled.value = !isSnapEnabled.value
  }

  function toggleOrtho() {
    isOrthoEnabled.value = !isOrthoEnabled.value
  }

  function toggleOsnap() {
    isOsnapEnabled.value = !isOsnapEnabled.value
  }

  return {
    // 상태
    currentFile,
    fileInfo,
    isFileLoaded,
    zoomLevel,
    cursorPosition,
    activeTool,
    isRibbonCollapsed,
    isPropertiesPanelOpen,
    isLayerPanelOpen,
    isBomPanelOpen,
    isCommandPaletteVisible,
    isGridEnabled,
    isSnapEnabled,
    isOrthoEnabled,
    isOsnapEnabled,
    selectedEntityIds,

    // Computed
    formattedZoom,
    formattedCoords,
    activeToolLabel,

    // 액션
    setCurrentFile,
    setFileInfo,
    setZoomLevel,
    setCursorPosition,
    setActiveTool,
    toggleRibbon,
    togglePropertiesPanel,
    toggleLayerPanel,
    toggleBomPanel,
    toggleGrid,
    toggleSnap,
    toggleOrtho,
    toggleOsnap,
  }
})
