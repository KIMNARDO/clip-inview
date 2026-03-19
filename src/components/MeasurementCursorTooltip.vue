<script setup lang="ts">
import { computed } from 'vue'
import { useMeasurementStore } from '@/stores/measurement'
import { useMeasurementSettingsStore } from '@/stores/measurementSettings'

const measureStore = useMeasurementStore()
const settingsStore = useMeasurementSettingsStore()

const isVisible = computed(() => measureStore.isActive)

const tooltipStyle = computed(() => ({
  left: `${measureStore.screenCursorPosition.x + 20}px`,
  top: `${measureStore.screenCursorPosition.y + 20}px`,
}))

/** 현재 좌표 표시 */
const coordsText = computed(() => {
  const { x, y } = measureStore.cursorPosition
  return settingsStore.formatCoordinate(x, y)
})

/** 실시간 측정값 표시 */
const liveValueText = computed(() => {
  const live = measureStore.liveValue
  if (!live) return null

  switch (live.unit) {
    case 'mm':
      return settingsStore.formatLength(live.value)
    case 'mm²':
      return settingsStore.formatArea(live.value)
    case '°':
      return settingsStore.formatAngle(live.value)
    default:
      return `${live.value.toFixed(2)} ${live.unit}`
  }
})

/** 안내 텍스트 */
const instruction = computed(() => measureStore.instructionText)

/** 측정 모드 레이블 */
const modeLabel = computed(() => {
  switch (measureStore.activeMeasureMode) {
    case 'distance': return '거리'
    case 'area': return '면적'
    case 'angle': return '각도'
    case 'coordinate': return '좌표'
    case 'point-to-line': return '점-선 거리'
    case 'object': return '객체'
    default: return ''
  }
})
</script>

<template>
  <div
    v-if="isVisible"
    class="cursor-tooltip"
    :style="tooltipStyle"
  >
    <div class="tooltip-header">
      <span class="tooltip-mode">{{ modeLabel }}</span>
    </div>

    <!-- 좌표 표시 -->
    <div class="tooltip-coords">{{ coordsText }}</div>

    <!-- 실시간 측정값 -->
    <div v-if="liveValueText" class="tooltip-live-value">
      {{ liveValueText }}
    </div>

    <!-- 안내 텍스트 -->
    <div class="tooltip-instruction">{{ instruction }}</div>
  </div>
</template>

<style scoped>
.cursor-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 100;
  min-width: 160px;
  max-width: 320px;
  padding: 6px 10px;
  background: rgba(20, 20, 24, 0.92);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  font-family: var(--cad-font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--cad-text-secondary);
}

.tooltip-header {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.tooltip-mode {
  font-size: 10px;
  font-weight: 600;
  color: var(--cad-accent-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tooltip-coords {
  color: #60A5FA;
  font-size: 11px;
  white-space: nowrap;
}

.tooltip-live-value {
  color: #FFD700;
  font-size: 13px;
  font-weight: 700;
  margin: 2px 0;
  white-space: nowrap;
}

.tooltip-instruction {
  color: var(--cad-text-muted);
  font-size: 10px;
  font-family: var(--cad-font-primary);
  margin-top: 2px;
}
</style>
