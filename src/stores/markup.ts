import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MarkupEntity, MarkupType, MarkupStyle, MarkupData, Point2D } from '@/types/cad'

let nextId = 0

const DEFAULT_STYLE: MarkupStyle = {
  color: '#FF4444',
  lineWidth: 2,
  fontSize: 14,
  opacity: 1,
}

export const useMarkupStore = defineStore('markup', () => {
  const markups = ref<MarkupEntity[]>([])
  const activeMarkupType = ref<MarkupType | null>(null)
  const currentPoints = ref<Point2D[]>([])
  const currentStyle = ref<MarkupStyle>({ ...DEFAULT_STYLE })
  const selectedMarkupId = ref<string | null>(null)
  const pendingText = ref<string>('')

  const isActive = computed(() => activeMarkupType.value !== null)
  const selectedMarkup = computed(() =>
    markups.value.find((m) => m.id === selectedMarkupId.value) ?? null,
  )

  function setMarkupType(type: MarkupType | null) {
    activeMarkupType.value = type
    currentPoints.value = []
    pendingText.value = ''
  }

  function addPoint(point: Point2D) {
    if (!activeMarkupType.value) return

    currentPoints.value.push({ ...point })

    // 자동 완료 조건
    switch (activeMarkupType.value) {
      case 'text':
        // 텍스트는 1점 클릭 → 텍스트 입력 대기
        break
      case 'rect':
        if (currentPoints.value.length === 2) {
          completeMarkup()
        }
        break
      case 'circle':
        if (currentPoints.value.length === 2) {
          completeMarkup()
        }
        break
      case 'arrow':
        if (currentPoints.value.length === 2) {
          completeMarkup()
        }
        break
    }
  }

  /** 텍스트 마크업 완료 (위치 + 텍스트) */
  function completeTextMarkup(text: string) {
    if (!activeMarkupType.value || activeMarkupType.value !== 'text') return
    if (currentPoints.value.length < 1 || !text.trim()) return

    const entity: MarkupEntity = {
      id: `mk-${nextId++}`,
      type: 'text',
      points: [...currentPoints.value],
      text: text.trim(),
      style: { ...currentStyle.value },
      createdAt: Date.now(),
    }
    markups.value.push(entity)
    currentPoints.value = []
    pendingText.value = ''
  }

  function completeMarkup() {
    if (!activeMarkupType.value) return
    if (activeMarkupType.value === 'text') return // 텍스트는 completeTextMarkup 사용

    const minPoints: Record<string, number> = { rect: 2, circle: 2, arrow: 2 }
    if (currentPoints.value.length < (minPoints[activeMarkupType.value] ?? 2)) return

    const entity: MarkupEntity = {
      id: `mk-${nextId++}`,
      type: activeMarkupType.value,
      points: [...currentPoints.value],
      style: { ...currentStyle.value },
      createdAt: Date.now(),
    }
    markups.value.push(entity)
    currentPoints.value = []
  }

  function cancelMarkup() {
    activeMarkupType.value = null
    currentPoints.value = []
    pendingText.value = ''
  }

  function selectMarkup(id: string | null) {
    selectedMarkupId.value = id
  }

  function deleteMarkup(id: string) {
    markups.value = markups.value.filter((m) => m.id !== id)
    if (selectedMarkupId.value === id) {
      selectedMarkupId.value = null
    }
  }

  function clearMarkups() {
    markups.value = []
    selectedMarkupId.value = null
  }

  function setStyle(style: Partial<MarkupStyle>) {
    currentStyle.value = { ...currentStyle.value, ...style }
  }

  /** JSON으로 내보내기 */
  function exportToJson(fileName: string): MarkupData {
    const now = Date.now()
    return {
      version: '1.0',
      fileName,
      markups: markups.value.map((m) => ({ ...m, points: [...m.points] })),
      createdAt: markups.value[0]?.createdAt ?? now,
      updatedAt: now,
    }
  }

  /** JSON에서 가져오기 */
  function importFromJson(data: MarkupData) {
    markups.value = data.markups.map((m) => ({
      ...m,
      points: m.points.map((p) => ({ ...p })),
      style: { ...m.style },
    }))
    selectedMarkupId.value = null
  }

  return {
    markups,
    activeMarkupType,
    currentPoints,
    currentStyle,
    selectedMarkupId,
    pendingText,
    isActive,
    selectedMarkup,
    setMarkupType,
    addPoint,
    completeMarkup,
    completeTextMarkup,
    cancelMarkup,
    selectMarkup,
    deleteMarkup,
    clearMarkups,
    setStyle,
    exportToJson,
    importFromJson,
  }
})
