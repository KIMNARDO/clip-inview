import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBomStore } from './bom'
import type { BomData } from '@/types/cad'

const MOCK_BOM: BomData = {
  nodes: [
    {
      id: 'asm-1',
      partNumber: 'ASM-001',
      name: 'Main Assembly',
      quantity: 1,
      entityIds: ['e1', 'e2'],
      children: [
        {
          id: 'prt-1',
          partNumber: 'PRT-010',
          name: 'Base Plate',
          quantity: 2,
          entityIds: ['e1'],
          children: [],
        },
        {
          id: 'prt-2',
          partNumber: 'PRT-020',
          name: 'Shaft',
          quantity: 1,
          entityIds: ['e2'],
          children: [],
        },
      ],
    },
  ],
  totalParts: 4,
}

describe('useBomStore', () => {
  let store: ReturnType<typeof useBomStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBomStore()
  })

  it('초기 상태가 비어있다', () => {
    expect(store.nodes).toEqual([])
    expect(store.hasData).toBe(false)
    expect(store.totalParts).toBe(0)
    expect(store.selectedNodeId).toBeNull()
  })

  it('setBomData로 BOM 데이터를 설정한다', () => {
    store.setBomData(MOCK_BOM)
    expect(store.nodes).toHaveLength(1)
    expect(store.hasData).toBe(true)
    expect(store.totalParts).toBe(4) // 1 + 2 + 1
  })

  it('selectNode로 노드를 선택하고 엔티티를 하이라이트한다', () => {
    store.setBomData(MOCK_BOM)
    store.selectNode('prt-1')

    expect(store.selectedNodeId).toBe('prt-1')
    expect(store.highlightedEntityIds).toEqual(['e1'])
    expect(store.selectedNode?.name).toBe('Base Plate')
  })

  it('selectNode(null)로 선택 해제한다', () => {
    store.setBomData(MOCK_BOM)
    store.selectNode('prt-1')
    store.selectNode(null)

    expect(store.selectedNodeId).toBeNull()
    expect(store.highlightedEntityIds).toEqual([])
  })

  it('toggleExpand로 노드를 펼치고 접는다', () => {
    store.setBomData(MOCK_BOM)

    store.toggleExpand('asm-1')
    expect(store.expandedNodeIds.has('asm-1')).toBe(true)

    store.toggleExpand('asm-1')
    expect(store.expandedNodeIds.has('asm-1')).toBe(false)
  })

  it('expandAll로 모든 부모 노드를 펼친다', () => {
    store.setBomData(MOCK_BOM)
    store.expandAll()
    expect(store.expandedNodeIds.has('asm-1')).toBe(true)
  })

  it('collapseAll로 모두 접는다', () => {
    store.setBomData(MOCK_BOM)
    store.expandAll()
    store.collapseAll()
    expect(store.expandedNodeIds.size).toBe(0)
  })

  it('clear로 모든 상태를 초기화한다', () => {
    store.setBomData(MOCK_BOM)
    store.selectNode('prt-1')
    store.expandAll()

    store.clear()
    expect(store.nodes).toEqual([])
    expect(store.selectedNodeId).toBeNull()
    expect(store.expandedNodeIds.size).toBe(0)
    expect(store.highlightedEntityIds).toEqual([])
  })

  it('setBomData가 깊은 복사를 한다', () => {
    store.setBomData(MOCK_BOM)
    expect(store.nodes[0]).not.toBe(MOCK_BOM.nodes[0])
    expect(store.nodes[0]!.entityIds).not.toBe(MOCK_BOM.nodes[0]!.entityIds)
  })

  it('존재하지 않는 노드 선택 시 highlightedEntityIds가 빈다', () => {
    store.setBomData(MOCK_BOM)
    store.selectNode('nonexistent')
    expect(store.highlightedEntityIds).toEqual([])
  })
})
