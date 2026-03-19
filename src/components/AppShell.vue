<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { useMarkupStore } from '@/stores/markup'
import { useHistoryStore } from '@/stores/history'
import { useKeyboard } from '@/composables/useKeyboard'
import { openFileDialog, validateFileType } from '@/utils/fileLoader'
import Ribbon from './Ribbon.vue'
import LeftToolbar from './LeftToolbar.vue'
import ViewerCanvas from './ViewerCanvas.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import LayerPanel from './LayerPanel.vue'
import BomPanel from './BomPanel.vue'
import CommandPalette from './CommandPalette.vue'
import LayoutTabs from './LayoutTabs.vue'
import StatusBar from './StatusBar.vue'
import ToastContainer from './ToastContainer.vue'

const store = useAppStore()
const measureStore = useMeasurementStore()
const markupStore = useMarkupStore()
const historyStore = useHistoryStore()

const layoutClass = computed(() => ({
  'app-layout': true,
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
  'Ctrl+Z': (e) => {
    e.preventDefault()
    historyStore.undo()
  },
  'Ctrl+Y': (e) => {
    e.preventDefault()
    historyStore.redo()
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
  'S': () => {
    if (!measureStore.isActive && !markupStore.isActive) {
      store.setActiveTool('select')
    }
  },
  'P': () => {
    if (!measureStore.isActive && !markupStore.isActive) {
      store.setActiveTool('pan')
    }
  },
  'Z': () => {
    if (!measureStore.isActive && !markupStore.isActive) {
      store.setActiveTool('zoom-window')
    }
  },
  'D': () => {
    if (!measureStore.isActive && !markupStore.isActive) {
      measureStore.setMeasureMode('distance')
      store.setActiveTool('measure-distance')
    }
  },
  'A': () => {
    if (!measureStore.isActive && !markupStore.isActive) {
      measureStore.setMeasureMode('area')
      store.setActiveTool('measure-area')
    }
  },
  'G': () => {
    store.toggleGrid()
  },
  'F3': (e) => {
    e.preventDefault()
    store.toggleOsnap()
  },
  'F8': (e) => {
    e.preventDefault()
    store.toggleOrtho()
  },
  'DELETE': () => {
    if (markupStore.selectedMarkupId) {
      markupStore.deleteMarkup(markupStore.selectedMarkupId)
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

function handleHighlightEntities(entityIds: string[]) {
  window.dispatchEvent(
    new CustomEvent('cad:highlight-entities', { detail: entityIds }),
  )
}

function handleClearHighlight() {
  window.dispatchEvent(new CustomEvent('cad:clear-highlight'))
}

function handleSwitchLayout(name: string) {
  window.dispatchEvent(new CustomEvent('cad:switch-layout', { detail: name }))
}
</script>

<template>
  <div :class="layoutClass" class="bg-[var(--cad-bg-app)]">
    <Ribbon class="ribbon" />

    <LeftToolbar class="left-toolbar" />

    <div class="viewer-area">
      <div class="viewer-canvas relative overflow-hidden">
        <ViewerCanvas />
        <CommandPalette
          v-if="store.isCommandPaletteVisible"
          class="command-palette"
        />
      </div>
      <LayoutTabs @switch-layout="handleSwitchLayout" />
    </div>

    <!-- 우측 패널: 속성/레이어/BOM (상호 배타) -->
    <Transition name="panel-slide">
      <PropertiesPanel
        v-if="store.isPropertiesPanelOpen && !store.isLayerPanelOpen && !store.isBomPanelOpen"
        class="properties-panel"
      />
    </Transition>
    <Transition name="panel-slide">
      <LayerPanel
        v-if="store.isLayerPanelOpen"
        class="properties-panel"
        @toggle-visibility="handleLayerToggle"
        @toggle-all="handleLayerToggleAll"
      />
    </Transition>
    <Transition name="panel-slide">
      <BomPanel
        v-if="store.isBomPanelOpen"
        class="properties-panel"
        @highlight-entities="handleHighlightEntities"
        @clear-highlight="handleClearHighlight"
      />
    </Transition>

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

.ribbon {
  grid-area: ribbon;
}

.left-toolbar {
  grid-area: left-tools;
}

.viewer-area {
  grid-area: canvas;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewer-canvas {
  flex: 1;
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

/* ─── 패널 슬라이드 트랜지션 ─── */
.panel-slide-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.panel-slide-leave-active {
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}
.panel-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
