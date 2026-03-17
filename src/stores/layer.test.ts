import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLayerStore } from './layer'
import type { Layer } from '@/types/cad'

const MOCK_LAYERS: Layer[] = [
  { name: '0', color: '#FFFFFF', visible: true, locked: false },
  { name: 'Dimensions', color: '#FF0000', visible: true, locked: false },
  { name: 'Hidden Lines', color: '#00FF00', visible: false, locked: false },
]

describe('useLayerStore', () => {
  let store: ReturnType<typeof useLayerStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useLayerStore()
  })

  it('초기 상태가 비어있다', () => {
    expect(store.layers).toEqual([])
    expect(store.selectedLayerName).toBeNull()
    expect(store.visibleCount).toBe(0)
    expect(store.totalCount).toBe(0)
  })

  it('setLayers로 레이어를 설정한다', () => {
    store.setLayers(MOCK_LAYERS)
    expect(store.layers).toHaveLength(3)
    expect(store.totalCount).toBe(3)
    expect(store.visibleCount).toBe(2)
  })

  it('setLayers가 깊은 복사를 한다', () => {
    store.setLayers(MOCK_LAYERS)
    expect(store.layers[0]).not.toBe(MOCK_LAYERS[0])
    expect(store.layers[0]!.name).toBe(MOCK_LAYERS[0]!.name)
  })

  it('setLayers가 selectedLayerName을 초기화한다', () => {
    store.setLayers(MOCK_LAYERS)
    store.selectLayer('0')
    store.setLayers(MOCK_LAYERS)
    expect(store.selectedLayerName).toBeNull()
  })

  it('toggleLayerVisibility로 가시성을 토글한다', () => {
    store.setLayers(MOCK_LAYERS)
    expect(store.layers[0]!.visible).toBe(true)

    store.toggleLayerVisibility('0')
    expect(store.layers[0]!.visible).toBe(false)

    store.toggleLayerVisibility('0')
    expect(store.layers[0]!.visible).toBe(true)
  })

  it('존재하지 않는 레이어 토글은 무시된다', () => {
    store.setLayers(MOCK_LAYERS)
    store.toggleLayerVisibility('nonexistent')
    expect(store.visibleCount).toBe(2)
  })

  it('setAllVisible(true)로 모두 표시한다', () => {
    store.setLayers(MOCK_LAYERS)
    store.setAllVisible(true)
    expect(store.visibleCount).toBe(3)
  })

  it('setAllVisible(false)로 모두 숨긴다', () => {
    store.setLayers(MOCK_LAYERS)
    store.setAllVisible(false)
    expect(store.visibleCount).toBe(0)
  })

  it('selectLayer로 레이어를 선택한다', () => {
    store.setLayers(MOCK_LAYERS)
    store.selectLayer('Dimensions')
    expect(store.selectedLayerName).toBe('Dimensions')
  })

  it('selectLayer(null)로 선택 해제한다', () => {
    store.setLayers(MOCK_LAYERS)
    store.selectLayer('0')
    store.selectLayer(null)
    expect(store.selectedLayerName).toBeNull()
  })

  it('clear로 모든 상태를 초기화한다', () => {
    store.setLayers(MOCK_LAYERS)
    store.selectLayer('0')
    store.clear()
    expect(store.layers).toEqual([])
    expect(store.selectedLayerName).toBeNull()
    expect(store.totalCount).toBe(0)
  })

  it('visibleCount가 가시 레이어 수를 반환한다', () => {
    store.setLayers(MOCK_LAYERS)
    expect(store.visibleCount).toBe(2)
    store.toggleLayerVisibility('0')
    expect(store.visibleCount).toBe(1)
  })
})
