<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { useMarkupStore } from '@/stores/markup'
import { useKeyboard } from '@/composables/useKeyboard'
import { openFileDialog, validateFileType } from '@/utils/fileLoader'
import Ribbon from './Ribbon.vue'
import LeftToolbar from './LeftToolbar.vue'
import ViewerCanvas from './ViewerCanvas.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import LayerPanel from './LayerPanel.vue'
import BomPanel from './BomPanel.vue'
import CommandPalette from './CommandPalette.vue'
import StatusBar from './StatusBar.vue'
import ToastContainer from './ToastContainer.vue'

const store = useAppStore()
const measureStore = useMeasurementStore()
const markupStore = useMarkupStore()

const layoutClass = computed(() => ({
  'app-layout': true,
  'app-layout--ribbon-collapsed': store.isRibbonCollapsed,
  'app-layout--no-properties': !store.isPropertiesPanelOpen && !store.isLayerPanelOpen && !store.isBomPanelOpen,
}))

async function handleOpenFile() {
  const file = await openFileDialog()
  if (file && validateFileType(file)) {
    window.dispatchEvent(new CustomEvent('cad:open-file', { detail: file }))
  }
}

useKeyboard({
  'Ctrl+O': (e) => {
    e.preventDefault()
    handleOpenFile()
  },
  'HOME': () => {
    window.dispatchEvent(new CustomEvent('cad:fit-extents'))
  },
  '+': () => {
    window.dispatchEvent(new CustomEvent('cad:zoom', { detail: 1.2 }))
  },
  '=': () => {
    window.dispatchEvent(new CustomEvent('cad:zoom', { detail: 1.2 }))
  },
  '-': () => {
    window.dispatchEvent(new CustomEvent('cad:zoom', { detail: 0.8 }))
  },
  'F11': (e) => {
    e.preventDefault()
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  },
  'ESCAPE': () => {
    if (measureStore.isActive) {
      measureStore.cancelMeasurement()
      store.setActiveTool('select')
    } else if (markupStore.isActive) {
      markupStore.cancelMarkup()
      store.setActiveTool('select')
    }
  },
  'D': () => {
    if (!measureStore.isActive) {
      measureStore.setMeasureMode('distance')
      store.setActiveTool('measure-distance')
    }
  },
})

function handleLayerToggle(layerName: string, visible: boolean) {
  window.dispatchEvent(
    new CustomEvent('cad:layer-visibility', { detail: { layerName, visible } }),
  )
}

function handleLayerToggleAll(visible: boolean) {
  window.dispatchEvent(
    new CustomEvent('cad:layer-visibility-all', { detail: visible }),
  )
}
</script>

<template>
  <div :class="layoutClass" class="bg-[var(--cad-bg-app)]">
    <Ribbon class="ribbon" @open-file="handleOpenFile" />

    <LeftToolbar class="left-toolbar" />

    <div class="viewer-canvas relative overflow-hidden">
      <ViewerCanvas />
      <CommandPalette
        v-if="store.isCommandPaletteVisible"
        class="command-palette"
      />
    </div>

    <!-- 우측 패널: 속성/레이어/BOM (상호 배타) -->
    <PropertiesPanel
      v-if="store.isPropertiesPanelOpen && !store.isLayerPanelOpen && !store.isBomPanelOpen"
      class="properties-panel"
    />
    <LayerPanel
      v-if="store.isLayerPanelOpen"
      class="properties-panel"
      @toggle-visibility="handleLayerToggle"
      @toggle-all="handleLayerToggleAll"
    />
    <BomPanel
      v-if="store.isBomPanelOpen"
      class="properties-panel"
    />

    <StatusBar class="status-bar" />
    <ToastContainer />
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: var(--cad-left-toolbar-width) 1fr var(--cad-properties-width);
  grid-template-rows: auto 1fr var(--cad-statusbar-height);
  grid-template-areas:
    "ribbon      ribbon       ribbon"
    "left-tools  canvas       properties"
    "statusbar   statusbar    statusbar";
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: var(--cad-font-primary);
}

.app-layout--no-properties {
  grid-template-columns: var(--cad-left-toolbar-width) 1fr 0px;
}

.app-layout--ribbon-collapsed {
  /* 리본 접힘 시에도 auto로 자연스럽게 줄어듦 */
}

.ribbon {
  grid-area: ribbon;
}

.left-toolbar {
  grid-area: left-tools;
}

.viewer-canvas {
  grid-area: canvas;
  position: relative;
}

.properties-panel {
  grid-area: properties;
}

.status-bar {
  grid-area: statusbar;
}

.command-palette {
  position: absolute;
  bottom: var(--cad-space-2);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--cad-z-command);
  width: 100%;
  max-width: 560px;
}
</style>
