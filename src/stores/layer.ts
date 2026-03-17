import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Layer } from '@/types/cad'

export const useLayerStore = defineStore('layer', () => {
  const layers = ref<Layer[]>([])
  const selectedLayerName = ref<string | null>(null)

  const visibleCount = computed(() => layers.value.filter((l) => l.visible).length)
  const totalCount = computed(() => layers.value.length)

  function setLayers(newLayers: Layer[]) {
    layers.value = newLayers.map((l) => ({ ...l }))
    selectedLayerName.value = null
  }

  function toggleLayerVisibility(name: string) {
    const layer = layers.value.find((l) => l.name === name)
    if (layer) {
      layer.visible = !layer.visible
    }
  }

  function setAllVisible(visible: boolean) {
    layers.value.forEach((l) => {
      l.visible = visible
    })
  }

  function selectLayer(name: string | null) {
    selectedLayerName.value = name
  }

  function clear() {
    layers.value = []
    selectedLayerName.value = null
  }

  return {
    layers,
    selectedLayerName,
    visibleCount,
    totalCount,
    setLayers,
    toggleLayerVisibility,
    setAllVisible,
    selectLayer,
    clear,
  }
})
