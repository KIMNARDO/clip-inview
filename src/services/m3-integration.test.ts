import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { CadEngine } from './cadEngine'
import { useMarkupStore } from '@/stores/markup'
import { useBomStore } from '@/stores/bom'
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

describe('M3 통합 테스트: 마크업 + BOM', () => {
  let engine: CadEngine
  let container: HTMLElement
  let markupStore: ReturnType<typeof useMarkupStore>
  let bomStore: ReturnType<typeof useBomStore>
  let appStore: ReturnType<typeof useAppStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    markupStore = useMarkupStore()
    bomStore = useBomStore()
    appStore = useAppStore()

    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 800 })
    Object.defineProperty(container, 'clientHeight', { value: 600 })
    document.body.appendChild(container)

    engine = new CadEngine()
    await engine.initialize(container)
  })

  // --- 마크업 통합 ---
  it('텍스트 마크업 E2E: 모드 → 클릭 → 텍스트 입력 → 완료', () => {
    markupStore.setMarkupType('text')
    appStore.setActiveTool('markup-text')

    expect(markupStore.isActive).toBe(true)

    markupStore.addPoint({ x: 50, y: 100 })
    markupStore.completeTextMarkup('검사 필요')

    expect(markupStore.markups).toHaveLength(1)
    expect(markupStore.markups[0]!.text).toBe('검사 필요')
    expect(markupStore.markups[0]!.points[0]).toEqual({ x: 50, y: 100 })
  })

  it('사각형 마크업 E2E: 2점 클릭 → 자동 완료', () => {
    markupStore.setMarkupType('rect')
    appStore.setActiveTool('markup-rect')

    markupStore.addPoint({ x: 0, y: 0 })
    markupStore.addPoint({ x: 100, y: 50 })

    expect(markupStore.markups).toHaveLength(1)
    expect(markupStore.markups[0]!.type).toBe('rect')
  })

  it('화살표 마크업 E2E: 2점 클릭 → 자동 완료', () => {
    markupStore.setMarkupType('arrow')
    markupStore.addPoint({ x: 0, y: 0 })
    markupStore.addPoint({ x: 100, y: 100 })

    expect(markupStore.markups).toHaveLength(1)
    expect(markupStore.markups[0]!.type).toBe('arrow')
  })

  it('Escape로 진행 중인 마크업을 취소한다', () => {
    markupStore.setMarkupType('rect')
    markupStore.addPoint({ x: 0, y: 0 })

    markupStore.cancelMarkup()
    expect(markupStore.isActive).toBe(false)
    expect(markupStore.currentPoints).toHaveLength(0)
  })

  // --- 마크업 저장/로드 ---
  it('마크업 JSON 내보내기/가져오기 라운드트립', () => {
    markupStore.setMarkupType('rect')
    markupStore.addPoint({ x: 0, y: 0 })
    markupStore.addPoint({ x: 100, y: 50 })

    markupStore.setMarkupType('text')
    markupStore.addPoint({ x: 10, y: 20 })
    markupStore.completeTextMarkup('Test')

    const exported = markupStore.exportToJson('test.dwg')
    expect(exported.markups).toHaveLength(2)

    // 클리어 후 가져오기
    markupStore.clearMarkups()
    expect(markupStore.markups).toHaveLength(0)

    markupStore.importFromJson(exported)
    expect(markupStore.markups).toHaveLength(2)
    expect(markupStore.markups[1]!.text).toBe('Test')
  })

  // --- BOM 통합 ---
  it('파일 로드 후 BOM 데이터를 가져올 수 있다', async () => {
    const file = new File(['data'], 'test.dwg', { type: 'application/acad' })
    await engine.loadFile(file)

    const bomData = engine.getBomData()
    bomStore.setBomData(bomData)

    expect(bomStore.hasData).toBe(true)
    expect(bomStore.totalParts).toBeGreaterThan(0)
  })

  it('BOM 노드 선택 시 entityIds가 반환된다', async () => {
    const file = new File(['data'], 'test.dwg')
    await engine.loadFile(file)

    const bomData = engine.getBomData()
    bomStore.setBomData(bomData)

    const firstChild = bomData.nodes[0]?.children[0]
    if (firstChild) {
      bomStore.selectNode(firstChild.id)
      expect(bomStore.highlightedEntityIds.length).toBeGreaterThan(0)
    }
  })

  it('파일 재로드 시 마크업과 BOM이 초기화된다', async () => {
    // 마크업 추가
    markupStore.setMarkupType('rect')
    markupStore.addPoint({ x: 0, y: 0 })
    markupStore.addPoint({ x: 10, y: 10 })

    // BOM 설정
    const file = new File(['data'], 'test.dwg')
    await engine.loadFile(file)
    bomStore.setBomData(engine.getBomData())

    // 재로드 시뮬레이션
    markupStore.clearMarkups()
    markupStore.cancelMarkup()
    bomStore.clear()

    expect(markupStore.markups).toHaveLength(0)
    expect(bomStore.hasData).toBe(false)
  })

  // --- 앱 스토어 연동 ---
  it('BOM 패널 토글이 상태에 반영된다', () => {
    expect(appStore.isBomPanelOpen).toBe(false)
    appStore.toggleBomPanel()
    expect(appStore.isBomPanelOpen).toBe(true)
    // 다른 패널은 닫힌다
    expect(appStore.isPropertiesPanelOpen).toBe(false)
    expect(appStore.isLayerPanelOpen).toBe(false)
  })

  it('마크업 도구 레이블이 올바르다', () => {
    appStore.setActiveTool('markup-text')
    expect(appStore.activeToolLabel).toBe('텍스트 마크업')
    appStore.setActiveTool('markup-arrow')
    expect(appStore.activeToolLabel).toBe('화살표 마크업')
  })
})
