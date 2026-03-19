import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LayoutInfo } from '@/types/cad'

export const useLayoutStore = defineStore('layout', () => {
  const layouts = ref<LayoutInfo[]>([])
  const currentLayoutName = ref('Model')

  const currentLayout = computed(() =>
    layouts.value.find((l) => l.name === currentLayoutName.value) ?? null,
  )

  const isModelSpace = computed(() => currentLayoutName.value === 'Model')
  const hasMultipleLayouts = computed(() => layouts.value.length > 1)

  function setLayouts(list: LayoutInfo[]) {
    layouts.value = list
  }

  function setCurrentLayout(name: string) {
    currentLayoutName.value = name
  }

  function reset() {
    layouts.value = []
    currentLayoutName.value = 'Model'
  }

  return {
    layouts,
    currentLayoutName,
    currentLayout,
    isModelSpace,
    hasMultipleLayouts,
    setLayouts,
    setCurrentLayout,
    reset,
  }
})
