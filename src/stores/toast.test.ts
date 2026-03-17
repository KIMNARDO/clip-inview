import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from './toast'

describe('useToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('초기 상태에서 토스트가 비어있다', () => {
    const store = useToastStore()
    expect(store.toasts).toEqual([])
  })

  it('토스트를 추가할 수 있다', () => {
    const store = useToastStore()
    store.show('테스트 메시지', 'info')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0]!.message).toBe('테스트 메시지')
    expect(store.toasts[0]!.type).toBe('info')
  })

  it('여러 타입의 토스트를 추가할 수 있다', () => {
    const store = useToastStore()
    store.show('정보', 'info')
    store.show('성공', 'success')
    store.show('경고', 'warning')
    store.show('오류', 'error')
    expect(store.toasts).toHaveLength(4)
    expect(store.toasts[3]!.type).toBe('error')
  })

  it('토스트를 수동으로 닫을 수 있다', () => {
    const store = useToastStore()
    store.show('닫을 메시지', 'info', 0) // duration 0 = 자동 닫기 없음
    const id = store.toasts[0]!.id
    store.dismiss(id)
    expect(store.toasts).toHaveLength(0)
  })

  it('지정 시간 후 자동으로 닫힌다', () => {
    const store = useToastStore()
    store.show('자동 닫기', 'info', 3000)
    expect(store.toasts).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    expect(store.toasts).toHaveLength(0)
  })

  it('존재하지 않는 ID 닫기는 무시된다', () => {
    const store = useToastStore()
    store.show('메시지', 'info', 0)
    store.dismiss(9999)
    expect(store.toasts).toHaveLength(1)
  })
})
