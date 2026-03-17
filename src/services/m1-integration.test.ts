/**
 * M1 데모 시나리오 통합 테스트
 *
 * M1 마일스톤 수용 기준:
 * 1. DWG/DXF 파일 열기 (File dialog + Drag-and-drop)
 * 2. Pan (중간버튼, Alt+좌클릭, Shift+좌클릭)
 * 3. Zoom (마우스 휠)
 * 4. Fit-to-Extents (Home 키, 버튼)
 * 5. StatusBar 실시간 좌표/줌 업데이트
 * 6. 보안: FileReader API만 사용, 외부 전송 없음
 */
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { CadEngine } from './cadEngine'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { validateFileType, validateFileSize } from '@/utils/fileLoader'

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver

  HTMLCanvasElement.prototype.getContext = (() => {
    return {
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      setTransform: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    }
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext
})

describe('M1 데모 시나리오', () => {
  let engine: CadEngine
  let container: HTMLElement
  let appStore: ReturnType<typeof useAppStore>
  let toastStore: ReturnType<typeof useToastStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    appStore = useAppStore()
    toastStore = useToastStore()
    vi.useFakeTimers()

    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 1280 })
    Object.defineProperty(container, 'clientHeight', { value: 720 })
    document.body.appendChild(container)

    engine = new CadEngine()
    await engine.initialize(container)

    // Store에 콜백 연결 (ViewerCanvas가 하는 것과 동일)
    if (engine.viewer) {
      engine.viewer.onMouseMove = (pos) => {
        appStore.setCursorPosition(pos.x, pos.y)
      }
      engine.viewer.onZoomChange = (level) => {
        appStore.setZoomLevel(level)
      }
    }
  })

  afterEach(() => {
    engine.dispose()
    if (container.parentNode) {
      document.body.removeChild(container)
    }
    vi.useRealTimers()
  })

  // --- 시나리오 1: 파일 열기 ---
  it('DWG 파일 열기 → fileInfo 업데이트 → isFileLoaded true', async () => {
    const file = new File(['dwg-data'], 'building-plan.dwg', { type: '' })
    expect(validateFileType(file)).toBe(true)

    const success = await engine.loadFile(file)
    expect(success).toBe(true)

    appStore.setFileInfo(engine.fileInfo)
    appStore.setCurrentFile(file.name)

    expect(appStore.isFileLoaded).toBe(true)
    expect(appStore.fileInfo?.name).toBe('building-plan.dwg')
    expect(engine.fileInfo?.type).toBe('application/acad')
  })

  it('DXF 파일 열기도 성공한다', async () => {
    const file = new File(['dxf-data'], 'floor-plan.dxf', { type: '' })
    expect(validateFileType(file)).toBe(true)

    const success = await engine.loadFile(file)
    expect(success).toBe(true)
    expect(engine.fileInfo?.type).toBe('application/dxf')
  })

  it('지원하지 않는 파일 형식은 거부된다', () => {
    const pdfFile = new File(['pdf'], 'document.pdf', { type: 'application/pdf' })
    expect(validateFileType(pdfFile)).toBe(false)

    const jpgFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    expect(validateFileType(jpgFile)).toBe(false)
  })

  it('500MB 초과 파일은 거부된다', () => {
    const bigFile = new File(['x'], 'huge.dwg')
    Object.defineProperty(bigFile, 'size', { value: 600 * 1024 * 1024 })
    expect(validateFileSize(bigFile)).toBe(false)
  })

  // --- 시나리오 2: Pan ---
  it('Pan 동작 후에도 줌 레벨은 변하지 않는다', async () => {
    const initialZoom = engine.getZoomLevel()
    engine.viewer!.pan(100, -50)
    expect(engine.getZoomLevel()).toBe(initialZoom)
  })

  // --- 시나리오 3: Zoom ---
  it('Zoom 변경 시 store의 zoomLevel이 업데이트된다', async () => {
    engine.viewer!.zoom(2)
    expect(appStore.zoomLevel).toBe(200)
    expect(appStore.formattedZoom).toBe('200%')
  })

  it('Zoom 범위가 1~6400%로 제한된다', () => {
    // 극도로 축소
    for (let i = 0; i < 200; i++) {
      engine.viewer!.zoom(0.5)
    }
    expect(engine.getZoomLevel()).toBeGreaterThanOrEqual(1)

    // 극도로 확대
    engine.viewer!.fitToExtents()
    for (let i = 0; i < 200; i++) {
      engine.viewer!.zoom(2)
    }
    expect(engine.getZoomLevel()).toBeLessThanOrEqual(6400)
  })

  // --- 시나리오 4: Fit-to-Extents ---
  it('Fit-to-Extents가 줌을 100%로 리셋한다', () => {
    engine.viewer!.zoom(3)
    engine.viewer!.pan(500, 300)
    engine.fitToExtents()
    expect(engine.getZoomLevel()).toBe(100)
  })

  // --- 시나리오 5: StatusBar 연동 ---
  it('마우스 이동 콜백이 store 좌표를 업데이트한다', () => {
    engine.viewer!.onMouseMove!({ x: 123.456, y: -789.012 })
    expect(appStore.cursorPosition).toEqual({ x: 123.456, y: -789.012 })
    expect(appStore.formattedCoords.x).toBe('123.46')
    expect(appStore.formattedCoords.y).toBe('-789.01')
  })

  it('줌 변경 콜백이 store 줌을 업데이트한다', () => {
    engine.viewer!.zoom(1.5)
    expect(appStore.formattedZoom).toBe('150%')
  })

  // --- 시나리오 6: 도구 전환 ---
  it('도구 전환이 올바르게 동작한다', () => {
    appStore.setActiveTool('pan')
    expect(appStore.activeTool).toBe('pan')
    expect(appStore.activeToolLabel).toBe('이동')

    appStore.setActiveTool('select')
    expect(appStore.activeToolLabel).toBe('선택')
  })

  // --- 시나리오 7: Toast 알림 ---
  it('토스트 알림이 표시되고 자동으로 닫힌다', () => {
    toastStore.show('파일을 열었습니다', 'success', 2000)
    expect(toastStore.toasts).toHaveLength(1)

    vi.advanceTimersByTime(2000)
    expect(toastStore.toasts).toHaveLength(0)
  })

  it('에러 토스트가 올바르게 표시된다', () => {
    toastStore.show('지원하지 않는 형식', 'error')
    expect(toastStore.toasts[0]!.type).toBe('error')
  })

  // --- 시나리오 8: UI 토글 ---
  it('리본 접기/펼치기가 동작한다', () => {
    expect(appStore.isRibbonCollapsed).toBe(false)
    appStore.toggleRibbon()
    expect(appStore.isRibbonCollapsed).toBe(true)
  })

  it('속성 패널 토글이 동작한다', () => {
    expect(appStore.isPropertiesPanelOpen).toBe(true)
    appStore.togglePropertiesPanel()
    expect(appStore.isPropertiesPanelOpen).toBe(false)
  })

  it('상태바 토글 (GRID/SNAP/ORTHO/OSNAP)이 동작한다', () => {
    appStore.toggleGrid()
    appStore.toggleSnap()
    appStore.toggleOrtho()
    appStore.toggleOsnap()
    expect(appStore.isGridEnabled).toBe(true)
    expect(appStore.isSnapEnabled).toBe(true)
    expect(appStore.isOrthoEnabled).toBe(true)
    expect(appStore.isOsnapEnabled).toBe(true)
  })

  // --- 전체 E2E 시나리오 ---
  it('E2E: 파일 열기 → 줌 → 팬 → Fit → 좌표 확인', async () => {
    // 1. 파일 열기
    const file = new File(['dwg-data'], 'assembly.dwg')
    await engine.loadFile(file)
    appStore.setFileInfo(engine.fileInfo)
    expect(appStore.isFileLoaded).toBe(true)

    // 2. 줌 인
    engine.viewer!.zoom(2)
    expect(appStore.zoomLevel).toBe(200)

    // 3. 팬
    engine.viewer!.pan(100, 50)
    // 줌은 변하지 않아야 함
    expect(appStore.zoomLevel).toBe(200)

    // 4. Fit to Extents
    engine.fitToExtents()
    appStore.setZoomLevel(engine.getZoomLevel())
    expect(appStore.zoomLevel).toBe(100)

    // 5. 좌표 업데이트 확인
    engine.viewer!.onMouseMove!({ x: 50.5, y: 25.3 })
    expect(appStore.formattedCoords).toEqual({ x: '50.50', y: '25.30' })
  })
})
