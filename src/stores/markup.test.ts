import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarkupStore } from './markup'

describe('useMarkupStore', () => {
  let store: ReturnType<typeof useMarkupStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMarkupStore()
  })

  it('초기 상태가 올바르다', () => {
    expect(store.markups).toEqual([])
    expect(store.activeMarkupType).toBeNull()
    expect(store.currentPoints).toEqual([])
    expect(store.isActive).toBe(false)
    expect(store.selectedMarkupId).toBeNull()
  })

  it('setMarkupType으로 마크업 모드를 설정한다', () => {
    store.setMarkupType('rect')
    expect(store.activeMarkupType).toBe('rect')
    expect(store.isActive).toBe(true)
  })

  it('setMarkupType(null)로 모드를 해제한다', () => {
    store.setMarkupType('rect')
    store.setMarkupType(null)
    expect(store.isActive).toBe(false)
  })

  it('setMarkupType이 currentPoints를 초기화한다', () => {
    store.setMarkupType('arrow')
    store.addPoint({ x: 10, y: 20 })
    store.setMarkupType('circle')
    expect(store.currentPoints).toEqual([])
  })

  it('모드 없이 addPoint는 무시된다', () => {
    store.addPoint({ x: 10, y: 20 })
    expect(store.currentPoints).toEqual([])
  })

  // --- Rect auto-completion ---
  it('사각형: 2점 클릭 시 자동 완료된다', () => {
    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 100, y: 50 })

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('rect')
    expect(store.markups[0]!.points).toHaveLength(2)
    expect(store.currentPoints).toEqual([])
  })

  // --- Circle auto-completion ---
  it('원: 2점 클릭 시 자동 완료된다', () => {
    store.setMarkupType('circle')
    store.addPoint({ x: 50, y: 50 })
    store.addPoint({ x: 80, y: 50 })

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('circle')
  })

  // --- Arrow auto-completion ---
  it('화살표: 2점 클릭 시 자동 완료된다', () => {
    store.setMarkupType('arrow')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 100, y: 100 })

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('arrow')
  })

  // --- Text markup ---
  it('텍스트: 1점 클릭 후 completeTextMarkup으로 완료', () => {
    store.setMarkupType('text')
    store.addPoint({ x: 10, y: 20 })

    expect(store.markups).toHaveLength(0)
    store.completeTextMarkup('Hello World')

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('text')
    expect(store.markups[0]!.text).toBe('Hello World')
  })

  it('텍스트: 빈 텍스트로는 완료되지 않는다', () => {
    store.setMarkupType('text')
    store.addPoint({ x: 10, y: 20 })
    store.completeTextMarkup('   ')
    expect(store.markups).toHaveLength(0)
  })

  it('cancelMarkup이 모드와 포인트를 초기화한다', () => {
    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.cancelMarkup()

    expect(store.activeMarkupType).toBeNull()
    expect(store.currentPoints).toEqual([])
  })

  it('selectMarkup으로 마크업을 선택한다', () => {
    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 10, y: 10 })

    const id = store.markups[0]!.id
    store.selectMarkup(id)
    expect(store.selectedMarkupId).toBe(id)
    expect(store.selectedMarkup).not.toBeNull()
  })

  it('deleteMarkup으로 마크업을 삭제한다', () => {
    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 10, y: 10 })

    const id = store.markups[0]!.id
    store.deleteMarkup(id)
    expect(store.markups).toHaveLength(0)
  })

  it('clearMarkups로 모든 마크업을 삭제한다', () => {
    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 10, y: 10 })

    store.setMarkupType('circle')
    store.addPoint({ x: 50, y: 50 })
    store.addPoint({ x: 80, y: 50 })

    expect(store.markups).toHaveLength(2)
    store.clearMarkups()
    expect(store.markups).toHaveLength(0)
  })

  // --- Style ---
  it('setStyle로 스타일을 변경한다', () => {
    store.setStyle({ color: '#00FF00', lineWidth: 4 })
    expect(store.currentStyle.color).toBe('#00FF00')
    expect(store.currentStyle.lineWidth).toBe(4)
  })

  // --- Export/Import ---
  it('exportToJson이 올바른 구조를 반환한다', () => {
    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 100, y: 50 })

    const data = store.exportToJson('test.dwg')
    expect(data.version).toBe('1.0')
    expect(data.fileName).toBe('test.dwg')
    expect(data.markups).toHaveLength(1)
    expect(data.markups[0]!.type).toBe('rect')
  })

  it('importFromJson이 마크업을 복원한다', () => {
    const data = {
      version: '1.0',
      fileName: 'test.dwg',
      markups: [
        {
          id: 'mk-100',
          type: 'text' as const,
          points: [{ x: 10, y: 20 }],
          text: 'Imported',
          style: { color: '#FF0000', lineWidth: 2, fontSize: 14 },
          createdAt: 1000,
        },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    }

    store.importFromJson(data)
    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.text).toBe('Imported')
    expect(store.markups[0]!.id).toBe('mk-100')
  })

  it('마크업에 고유 ID가 부여된다', () => {
    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 10, y: 10 })

    store.setMarkupType('rect')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 20, y: 20 })

    expect(store.markups[0]!.id).not.toBe(store.markups[1]!.id)
  })

  // --- Sprint 2: 신규 마크업 타입 ---

  it('직선: 2점 클릭 시 자동 완료된다', () => {
    store.setMarkupType('line')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 100, y: 100 })

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('line')
    expect(store.markups[0]!.points).toHaveLength(2)
  })

  it('타원: 2점 클릭 시 자동 완료된다', () => {
    store.setMarkupType('ellipse')
    store.addPoint({ x: 10, y: 10 })
    store.addPoint({ x: 60, y: 40 })

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('ellipse')
  })

  it('구름형: 2점 클릭 시 자동 완료된다', () => {
    store.setMarkupType('revcloud')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 200, y: 100 })

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('revcloud')
  })

  it('지시선: 2점 클릭 후 completeTextMarkup으로 완료', () => {
    store.setMarkupType('leader')
    store.addPoint({ x: 50, y: 50 })
    store.addPoint({ x: 100, y: 30 })

    // 2점 후 텍스트 입력 대기 (leader는 twoPointTypes에 포함되지 않음)
    // leader는 addPoint에서 자동완료되지 않고 completeTextMarkup으로 완료
    expect(store.currentPoints).toHaveLength(2)
    expect(store.markups).toHaveLength(0)

    store.completeTextMarkup('주의사항')

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('leader')
    expect(store.markups[0]!.text).toBe('주의사항')
    expect(store.markups[0]!.points).toHaveLength(2)
  })

  it('지시선: 빈 텍스트로는 완료되지 않는다', () => {
    store.setMarkupType('leader')
    store.addPoint({ x: 50, y: 50 })
    store.addPoint({ x: 100, y: 30 })
    store.completeTextMarkup('')
    expect(store.markups).toHaveLength(0)
  })

  it('자유곡선: completeFreehand로 완료된다', () => {
    store.setMarkupType('freehand')
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 15 },
      { x: 30, y: 10 },
    ]
    store.completeFreehand(points)

    expect(store.markups).toHaveLength(1)
    expect(store.markups[0]!.type).toBe('freehand')
    expect(store.markups[0]!.points).toHaveLength(4)
  })

  it('자유곡선: 2점 미만이면 완료되지 않는다', () => {
    store.setMarkupType('freehand')
    store.completeFreehand([{ x: 0, y: 0 }])
    expect(store.markups).toHaveLength(0)
  })

  it('자유곡선: 포인트가 깊은 복사된다', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }]
    store.completeFreehand(points)

    points[0]!.x = 999
    expect(store.markups[0]!.points[0]!.x).toBe(0)
  })

  it('toggleVisibility로 마크업 표시/숨기기를 토글한다', () => {
    expect(store.isVisible).toBe(true)
    store.toggleVisibility()
    expect(store.isVisible).toBe(false)
    store.toggleVisibility()
    expect(store.isVisible).toBe(true)
  })

  it('신규 마크업 타입도 export/import가 된다', () => {
    store.setMarkupType('line')
    store.addPoint({ x: 0, y: 0 })
    store.addPoint({ x: 50, y: 50 })

    store.setMarkupType('freehand')
    store.completeFreehand([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 5 }])

    const data = store.exportToJson('test.dwg')
    expect(data.markups).toHaveLength(2)
    expect(data.markups[0]!.type).toBe('line')
    expect(data.markups[1]!.type).toBe('freehand')

    store.clearMarkups()
    store.importFromJson(data)
    expect(store.markups).toHaveLength(2)
    expect(store.markups[1]!.points).toHaveLength(3)
  })
})
