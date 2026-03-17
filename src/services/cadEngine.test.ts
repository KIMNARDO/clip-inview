import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import { CadEngine, StubCadViewer } from './cadEngine'
import type { ICadViewer } from '@/types/cad'

// jsdom에 없는 브라우저 API 모킹
beforeAll(() => {
  // ResizeObserver mock
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver

  // Canvas 2D context mock
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

describe('StubCadViewer', () => {
  let viewer: StubCadViewer
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 800 })
    Object.defineProperty(container, 'clientHeight', { value: 600 })
    document.body.appendChild(container)
    viewer = new StubCadViewer()
  })

  afterEach(() => {
    viewer.dispose()
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  })

  it('초기화할 수 있다', async () => {
    await viewer.initialize(container)
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it('줌 레벨을 반환한다', async () => {
    await viewer.initialize(container)
    expect(viewer.getZoomLevel()).toBe(100)
  })

  it('줌을 변경할 수 있다', async () => {
    await viewer.initialize(container)
    viewer.zoom(2)
    expect(viewer.getZoomLevel()).toBe(200)
  })

  it('줌이 1~6400 범위로 제한된다', async () => {
    await viewer.initialize(container)
    viewer.zoom(0.001)
    expect(viewer.getZoomLevel()).toBeGreaterThanOrEqual(1)

    // 리셋 후 큰 값 테스트
    viewer.fitToExtents()
    for (let i = 0; i < 100; i++) {
      viewer.zoom(2)
    }
    expect(viewer.getZoomLevel()).toBeLessThanOrEqual(6400)
  })

  it('fitToExtents가 줌과 팬을 리셋한다', async () => {
    await viewer.initialize(container)
    viewer.zoom(2)
    viewer.pan(100, 50)
    viewer.fitToExtents()
    expect(viewer.getZoomLevel()).toBe(100)
  })

  it('월드 좌표를 반환한다', async () => {
    await viewer.initialize(container)
    const coords = viewer.getWorldCoords(400, 300)
    expect(coords).toHaveProperty('x')
    expect(coords).toHaveProperty('y')
  })

  it('onZoomChange 콜백이 호출된다', async () => {
    await viewer.initialize(container)
    const callback = vi.fn()
    viewer.onZoomChange = callback
    viewer.zoom(1.5)
    expect(callback).toHaveBeenCalledWith(expect.any(Number))
  })

  it('dispose 후 캔버스가 제거된다', async () => {
    await viewer.initialize(container)
    expect(container.querySelector('canvas')).not.toBeNull()
    viewer.dispose()
    expect(container.querySelector('canvas')).toBeNull()
  })

  it('loadFile이 true를 반환한다', async () => {
    await viewer.initialize(container)
    const file = new File(['test'], 'test.dwg', { type: 'application/acad' })
    const result = await viewer.loadFile(file)
    expect(result).toBe(true)
  })
})

describe('CadEngine', () => {
  let engine: CadEngine
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 800 })
    Object.defineProperty(container, 'clientHeight', { value: 600 })
    document.body.appendChild(container)
    engine = new CadEngine()
  })

  afterEach(() => {
    engine.dispose()
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  })

  it('초기 상태가 올바르다', () => {
    expect(engine.container).toBeNull()
    expect(engine.viewer).toBeNull()
    expect(engine.fileInfo).toBeNull()
    expect(engine.isFileLoaded).toBe(false)
  })

  it('StubCadViewer로 초기화된다', async () => {
    await engine.initialize(container)
    expect(engine.container).toBe(container)
    expect(engine.viewer).toBeInstanceOf(StubCadViewer)
  })

  it('커스텀 뷰어로 초기화할 수 있다', async () => {
    const mockViewer: ICadViewer = {
      initialize: vi.fn().mockResolvedValue(undefined),
      loadFile: vi.fn().mockResolvedValue(true),
      fitToExtents: vi.fn(),
      pan: vi.fn(),
      zoom: vi.fn(),
      getZoomLevel: vi.fn().mockReturnValue(100),
      getWorldCoords: vi.fn().mockReturnValue({ x: 0, y: 0 }),
      getScreenCoords: vi.fn().mockReturnValue({ x: 0, y: 0 }),
      getLayers: vi.fn().mockReturnValue([]),
      setLayerVisibility: vi.fn(),
      getEntities: vi.fn().mockReturnValue([]),
      getSnapPoint: vi.fn().mockReturnValue(null),
      dispose: vi.fn(),
    }

    await engine.initialize(container, mockViewer)
    expect(engine.viewer).toBe(mockViewer)
    expect(mockViewer.initialize).toHaveBeenCalledWith(container)
  })

  it('파일을 로드하면 fileInfo가 설정된다', async () => {
    await engine.initialize(container)
    const file = new File(['data'], 'drawing.dwg', { type: 'application/acad' })
    await engine.loadFile(file)

    expect(engine.fileInfo).not.toBeNull()
    expect(engine.fileInfo?.name).toBe('drawing.dwg')
    expect(engine.fileInfo?.size).toBe(4)
    expect(engine.isFileLoaded).toBe(true)
  })

  it('초기화 전 loadFile 호출 시 에러를 던진다', async () => {
    const file = new File(['data'], 'test.dwg')
    await expect(engine.loadFile(file)).rejects.toThrow('CadEngine이 초기화되지 않았습니다')
  })

  it('파일 확장자에서 MIME type을 감지한다', async () => {
    await engine.initialize(container)

    const dwgFile = new File(['data'], 'test.dwg', { type: '' })
    await engine.loadFile(dwgFile)
    expect(engine.fileInfo?.type).toBe('application/acad')

    const dxfFile = new File(['data'], 'test.dxf', { type: '' })
    await engine.loadFile(dxfFile)
    expect(engine.fileInfo?.type).toBe('application/dxf')
  })

  it('dispose 후 상태가 초기화된다', async () => {
    await engine.initialize(container)
    const file = new File(['data'], 'test.dwg')
    await engine.loadFile(file)

    engine.dispose()
    expect(engine.container).toBeNull()
    expect(engine.viewer).toBeNull()
    expect(engine.fileInfo).toBeNull()
    expect(engine.isFileLoaded).toBe(false)
  })

  it('getZoomLevel이 올바른 값을 반환한다', async () => {
    await engine.initialize(container)
    expect(engine.getZoomLevel()).toBe(100)
  })

  it('getWorldCoords가 좌표를 반환한다', async () => {
    await engine.initialize(container)
    const coords = engine.getWorldCoords(400, 300)
    expect(coords).toHaveProperty('x')
    expect(coords).toHaveProperty('y')
  })
})
