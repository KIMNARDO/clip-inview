<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { useMarkupStore } from '@/stores/markup'
import type { ViewerTool, MarkupType } from '@/types/cad'
import {
  MousePointer2Icon,
  HandIcon,
  ZoomInIcon,
  Maximize2Icon,
  RulerIcon,
  SquareIcon,
  TriangleRightIcon,
  TypeIcon,
  CircleIcon,
  ArrowRightIcon,
} from 'lucide-vue-next'

const store = useAppStore()
const measureStore = useMeasurementStore()
const markupStore = useMarkupStore()

const viewerTools = [
  { id: 'select' as ViewerTool, label: '선택 (S)', icon: MousePointer2Icon },
  { id: 'pan' as ViewerTool, label: '이동 (P)', icon: HandIcon },
  { id: 'zoom-window' as ViewerTool, label: '줌 윈도우 (Z)', icon: ZoomInIcon },
  { id: 'fit' as ViewerTool, label: '전체 보기 (F)', icon: Maximize2Icon },
] as const

const measureTools = [
  { id: 'measure-distance' as ViewerTool, label: '거리 측정 (D)', icon: RulerIcon, mode: 'distance' as const },
  { id: 'measure-area' as ViewerTool, label: '면적 측정', icon: SquareIcon, mode: 'area' as const },
  { id: 'measure-angle' as ViewerTool, label: '각도 측정', icon: TriangleRightIcon, mode: 'angle' as const },
] as const

const markupTools = [
  { id: 'markup-text' as ViewerTool, label: '텍스트 마크업 (T)', icon: TypeIcon, markupType: 'text' as MarkupType },
  { id: 'markup-rect' as ViewerTool, label: '사각형 마크업', icon: SquareIcon, markupType: 'rect' as MarkupType },
  { id: 'markup-circle' as ViewerTool, label: '원 마크업', icon: CircleIcon, markupType: 'circle' as MarkupType },
  { id: 'markup-arrow' as ViewerTool, label: '화살표 마크업', icon: ArrowRightIcon, markupType: 'arrow' as MarkupType },
] as const

function handleToolClick(toolId: ViewerTool) {
  if (measureStore.isActive) {
    measureStore.cancelMeasurement()
  }
  if (markupStore.isActive) {
    markupStore.cancelMarkup()
  }

  store.setActiveTool(toolId)

  if (toolId === 'fit') {
    window.dispatchEvent(new CustomEvent('cad:fit-extents'))
    store.setActiveTool('select')
    return
  }

  const measureTool = measureTools.find((t) => t.id === toolId)
  if (measureTool) {
    measureStore.setMeasureMode(measureTool.mode)
    return
  }

  const markupTool = markupTools.find((t) => t.id === toolId)
  if (markupTool) {
    markupStore.setMarkupType(markupTool.markupType)
  }
}
</script>

<template>
  <aside class="left-toolbar-root">
    <button
      v-for="tool in viewerTools"
      :key="tool.id"
      :title="tool.label"
      class="tool-button"
      :class="{ 'tool-button--active': store.activeTool === tool.id }"
      @click="handleToolClick(tool.id)"
    >
      <component :is="tool.icon" :size="18" :stroke-width="1.5" />
    </button>

    <div class="tool-divider" />

    <button
      v-for="tool in measureTools"
      :key="tool.id"
      :title="tool.label"
      class="tool-button"
      :class="{ 'tool-button--active': store.activeTool === tool.id }"
      @click="handleToolClick(tool.id)"
    >
      <component :is="tool.icon" :size="18" :stroke-width="1.5" />
    </button>

    <div class="tool-divider" />

    <button
      v-for="tool in markupTools"
      :key="tool.id"
      :title="tool.label"
      class="tool-button"
      :class="{ 'tool-button--active': store.activeTool === tool.id }"
      @click="handleToolClick(tool.id)"
    >
      <component :is="tool.icon" :size="18" :stroke-width="1.5" />
    </button>
  </aside>
</template>

<style scoped>
.left-toolbar-root {
  width: var(--cad-left-toolbar-width);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cad-space-1);
  padding: var(--cad-space-2) 0;
  background: var(--cad-bg-panel);
  border-right: 1px solid var(--cad-border-default);
  user-select: none;
}

.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--cad-radius-md);
  color: var(--cad-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.tool-button:hover {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.tool-button--active {
  background: var(--cad-accent-active-bg);
  color: var(--cad-accent-active-text);
  border-color: var(--cad-accent-active-border);
}

.tool-divider {
  width: 24px;
  height: 1px;
  background: var(--cad-border-default);
  margin: var(--cad-space-1) 0;
}
</style>
