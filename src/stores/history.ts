import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMeasurementStore } from './measurement'
import { useMarkupStore } from './markup'
import type { MeasurementResult, MarkupEntity } from '@/types/cad'

interface HistorySnapshot {
  measurements: MeasurementResult[]
  markups: MarkupEntity[]
}

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  const undoStack = ref<HistorySnapshot[]>([])
  const redoStack = ref<HistorySnapshot[]>([])
  /** undo/redo 적용 중일 때 true — 외부 watch가 pushState를 호출하지 않도록 */
  const isRestoring = ref(false)

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function takeSnapshot(): HistorySnapshot {
    const measureStore = useMeasurementStore()
    const markupStore = useMarkupStore()
    return {
      measurements: JSON.parse(JSON.stringify(measureStore.measurements)),
      markups: JSON.parse(JSON.stringify(markupStore.markups)),
    }
  }

  function applySnapshot(snapshot: HistorySnapshot) {
    const measureStore = useMeasurementStore()
    const markupStore = useMarkupStore()
    measureStore.restoreFromSnapshot(snapshot.measurements)
    markupStore.restoreFromSnapshot(snapshot.markups)
  }

  /** 변경 전에 호출하여 현재 상태를 저장 */
  function pushState() {
    const snapshot = takeSnapshot()
    undoStack.value.push(snapshot)
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }
    // 새 액션이 발생하면 redo 스택 초기화
    redoStack.value = []
  }

  function undo() {
    if (!canUndo.value) return
    isRestoring.value = true
    const current = takeSnapshot()
    redoStack.value.push(current)
    const previous = undoStack.value.pop()!
    applySnapshot(previous)
    isRestoring.value = false
  }

  function redo() {
    if (!canRedo.value) return
    isRestoring.value = true
    const current = takeSnapshot()
    undoStack.value.push(current)
    const next = redoStack.value.pop()!
    applySnapshot(next)
    isRestoring.value = false
  }

  function clear() {
    undoStack.value = []
    redoStack.value = []
  }

  return {
    isRestoring,
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    clear,
  }
})
