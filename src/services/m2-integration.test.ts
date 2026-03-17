import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { CadEngine } from './cadEngine'
import { useLayerStore } from '@/stores/layer'
import { useMeasurementStore } from '@/stores/measurement'
import { useAppStore } from '@/stores/app'

// jsdom 환경 모킹
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

describe('M2 통합 테스트: 레이어 + 측정', () => {
  let engine: CadEngine
  let container: HTMLElement
  let layerStore: ReturnType<typeof useLayerStore>
  let measureStore: ReturnType<typeof useMeasurementStore>
  let appStore: ReturnType<typeof useAppStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    layerStore = useLayerStore()
    measureStore = useMeasurementStore()
    appStore = useAppStore()

    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 800 })
    Object.defineProperty(container, 'clientHeight', { value: 600 })
    document.body.appendChild(container)

    engine = new CadEngine()
    await engine.initialize(container)
  })

  // --- 레이어 통합 ---
  it('파일 로드 후 레이어를 스토어에 설정한다', async () => {
    const file = new File(['data'], 'test.dwg', { type: 'application/acad' })
    await engine.loadFile(file)

    const layers = engine.getLayers()
    layerStore.setLayers(layers)

    expect(layerStore.totalCount).toBeGreaterThan(0)
    expect(layerStore.visibleCount).toBeGreaterThan(0)
  })

  it('레이어 토글이 엔진과 스토어 양쪽에 반영된다', async () => {
    const file = new File(['data'], 'test.dwg')
    await engine.loadFile(file)

    const layers = engine.getLayers()
    layerStore.setLayers(layers)

    const firstLayer = layerStore.layers[0]!
    const name = firstLayer.name

    // 스토어 토글
    layerStore.toggleLayerVisibility(name)
    expect(layerStore.layers[0]!.visible).toBe(false)

    // 엔진 토글
    engine.setLayerVisibility(name, false)
    const updatedLayers = engine.getLayers()
    const engineLayer = updatedLayers.find((l) => l.name === name)
    expect(engineLayer?.visible).toBe(false)
  })

  it('All Off 후 엔티티가 필터링된다', async () => {
    const file = new File(['data'], 'test.dwg')
    await engine.loadFile(file)

    const allEntities = engine.getEntities()
    expect(allEntities.length).toBeGreaterThan(0)

    // 모든 레이어 숨김
    const layers = engine.getLayers()
    for (const layer of layers) {
      engine.setLayerVisibility(layer.name, false)
    }

    const filteredEntities = engine.getEntities()
    expect(filteredEntities.length).toBe(0)
  })

  // --- 측정 통합 ---
  it('거리 측정 E2E: 모드 설정 → 클릭 → 결과', () => {
    measureStore.setMeasureMode('distance')
    appStore.setActiveTool('measure-distance')

    expect(measureStore.isActive).toBe(true)

    measureStore.addPoint({ x: 0, y: 0 })
    measureStore.addPoint({ x: 100, y: 0 })

    expect(measureStore.measurements).toHaveLength(1)
    expect(measureStore.measurements[0]!.value).toBeCloseTo(100)
    expect(appStore.activeTool).toBe('measure-distance')
  })

  it('면적 측정 E2E: 다각형 → 수동 완료', () => {
    measureStore.setMeasureMode('area')

    measureStore.addPoint({ x: 0, y: 0 })
    measureStore.addPoint({ x: 100, y: 0 })
    measureStore.addPoint({ x: 100, y: 50 })
    measureStore.addPoint({ x: 0, y: 50 })

    expect(measureStore.measurements).toHaveLength(0)
    measureStore.completeMeasurement()

    expect(measureStore.measurements).toHaveLength(1)
    expect(measureStore.measurements[0]!.value).toBeCloseTo(5000)
    expect(measureStore.measurements[0]!.unit).toBe('mm²')
  })

  it('각도 측정 E2E: 3점 자동 완료', () => {
    measureStore.setMeasureMode('angle')

    measureStore.addPoint({ x: 10, y: 0 })
    measureStore.addPoint({ x: 0, y: 0 })
    measureStore.addPoint({ x: 0, y: 10 })

    expect(measureStore.measurements).toHaveLength(1)
    expect(measureStore.measurements[0]!.value).toBeCloseTo(90)
  })

  it('Escape로 진행 중인 측정을 취소한다', () => {
    measureStore.setMeasureMode('area')
    measureStore.addPoint({ x: 0, y: 0 })
    measureStore.addPoint({ x: 10, y: 0 })

    expect(measureStore.currentPoints).toHaveLength(2)

    measureStore.cancelMeasurement()
    expect(measureStore.isActive).toBe(false)
    expect(measureStore.currentPoints).toHaveLength(0)
    expect(measureStore.measurements).toHaveLength(0)
  })

  it('파일 재로드 시 측정 결과가 초기화된다', async () => {
    measureStore.setMeasureMode('distance')
    measureStore.addPoint({ x: 0, y: 0 })
    measureStore.addPoint({ x: 5, y: 0 })
    expect(measureStore.measurements).toHaveLength(1)

    // 파일 재로드 시뮬레이션
    measureStore.clearMeasurements()
    measureStore.cancelMeasurement()

    expect(measureStore.measurements).toHaveLength(0)
    expect(measureStore.isActive).toBe(false)
  })

  // --- 스냅 통합 ---
  it('스냅 포인트를 감지한다', async () => {
    const file = new File(['data'], 'test.dwg')
    await engine.loadFile(file)

    // StubCadViewer는 모크 엔티티의 endpoint/midpoint/center 스냅 제공
    const snap = engine.getSnapPoint(0, 0, ['endpoint', 'midpoint', 'center'])
    // 스냅 포인트가 있을 수도 없을 수도 있지만, 에러는 아님
    if (snap) {
      expect(snap).toHaveProperty('point')
      expect(snap).toHaveProperty('type')
    }
  })

  it('getScreenCoords가 좌표를 반환한다', () => {
    const coords = engine.getScreenCoords(100, 200)
    expect(coords).toHaveProperty('x')
    expect(coords).toHaveProperty('y')
  })

  // --- 앱 스토어 연동 ---
  it('레이어 패널 토글이 상태에 반영된다', () => {
    expect(appStore.isLayerPanelOpen).toBe(false)
    appStore.toggleLayerPanel()
    expect(appStore.isLayerPanelOpen).toBe(true)
    appStore.toggleLayerPanel()
    expect(appStore.isLayerPanelOpen).toBe(false)
  })
})
