<script setup lang="ts">
import { useMeasurementStore } from '@/stores/measurement'
import { useMeasurementSettingsStore } from '@/stores/measurementSettings'
import { XIcon } from 'lucide-vue-next'

const measureStore = useMeasurementStore()
const settingsStore = useMeasurementSettingsStore()

function formatValue(m: { type: string; value: number; unit: string; points: { x: number; y: number }[] }): string {
  if (m.type === 'coordinate' && m.points.length > 0) {
    return settingsStore.formatCoordinate(m.points[0]!.x, m.points[0]!.y)
  }
  if (m.unit === '°') {
    return settingsStore.formatAngle(m.value)
  }
  if (m.unit === 'mm²') {
    return settingsStore.formatArea(m.value)
  }
  // distance, arc-length, point-to-line (mm 기반)
  return settingsStore.formatLength(m.value)
}

function removeMeasurement(id: string) {
  measureStore.removeMeasurement(id)
}
</script>

<template>
  <div v-if="measureStore.measurements.length > 0" class="measure-badge-container">
    <div
      v-for="m in measureStore.measurements"
      :key="m.id"
      class="measure-badge"
    >
      <span class="measure-badge-type">
        {{ { distance: '거리', area: '면적', angle: '각도', coordinate: '좌표', 'arc-length': '호 길이', 'point-to-line': '점-선', object: '객체' }[m.type] ?? m.type }}
      </span>
      <span class="measure-badge-value">
        {{ formatValue(m) }}
      </span>
      <button
        class="measure-badge-close"
        title="측정 삭제"
        @click="removeMeasurement(m.id)"
      >
        <XIcon :size="12" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.measure-badge-container {
  position: absolute;
  top: var(--cad-space-2);
  right: var(--cad-space-2);
  display: flex;
  flex-direction: column;
  gap: var(--cad-space-1);
  z-index: 8;
  pointer-events: auto;
  max-height: 200px;
  overflow-y: auto;
}

.measure-badge {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  padding: var(--cad-space-1) var(--cad-space-2);
  background: rgba(30, 31, 34, 0.92);
  border: 1px solid var(--cad-accent-primary);
  border-radius: var(--cad-radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  font-size: var(--cad-text-sm);
  backdrop-filter: blur(4px);
}

.measure-badge-type {
  color: var(--cad-text-muted);
  font-size: var(--cad-text-xs);
  min-width: 24px;
}

.measure-badge-value {
  color: #60A5FA;
  font-family: var(--cad-font-mono);
  font-weight: var(--cad-font-semibold);
  font-size: var(--cad-text-md);
  letter-spacing: 0.5px;
}

.measure-badge-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--cad-text-muted);
  cursor: pointer;
  border-radius: var(--cad-radius-sm);
  transition: all var(--cad-transition-fast);
  margin-left: var(--cad-space-1);
}

.measure-badge-close:hover {
  background: rgba(255, 68, 68, 0.2);
  color: #FF4444;
}
</style>
