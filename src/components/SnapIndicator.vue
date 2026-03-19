<script setup lang="ts">
import { computed } from 'vue'
import type { SnapResult, Point2D } from '@/types/cad'

const props = defineProps<{
  snap: SnapResult | null
  getScreenCoords: (worldX: number, worldY: number) => Point2D
}>()

const screenPos = computed(() => {
  if (!props.snap) return null
  return props.getScreenCoords(props.snap.point.x, props.snap.point.y)
})

const snapLabel = computed(() => {
  if (!props.snap) return ''
  const labels: Record<string, string> = {
    endpoint: '끝점',
    midpoint: '중점',
    center: '중심',
    intersection: '교차점',
    nearest: '최근점',
    perpendicular: '수직',
    tangent: '접선',
  }
  return labels[props.snap.type] ?? props.snap.type
})

const snapColor = computed(() => {
  if (!props.snap) return '#4CAF50'
  const colors: Record<string, string> = {
    endpoint: '#4CAF50',
    midpoint: '#FF9800',
    center: '#E94560',
    intersection: '#53C1DE',
    nearest: '#AB47BC',
    perpendicular: '#26A69A',
    tangent: '#FFA726',
  }
  return colors[props.snap.type] ?? '#4CAF50'
})
</script>

<template>
  <div v-if="snap && screenPos" class="snap-wrapper">
    <!-- 스냅 심볼 -->
    <svg
      class="snap-indicator"
      :style="{
        left: `${screenPos.x - 10}px`,
        top: `${screenPos.y - 10}px`,
      }"
      width="20"
      height="20"
      viewBox="0 0 20 20"
    >
      <!-- Endpoint: 사각형 -->
      <rect
        v-if="snap.type === 'endpoint'"
        x="3" y="3" width="14" height="14"
        fill="none"
        stroke="#4CAF50"
        stroke-width="2"
      />
      <!-- Midpoint: 삼각형 -->
      <polygon
        v-else-if="snap.type === 'midpoint'"
        points="10,2 18,18 2,18"
        fill="none"
        stroke="#FF9800"
        stroke-width="2"
      />
      <!-- Center: 원 -->
      <circle
        v-else-if="snap.type === 'center'"
        cx="10" cy="10" r="7"
        fill="none"
        stroke="#E94560"
        stroke-width="2"
      />
      <!-- Intersection: X 마크 -->
      <g v-else-if="snap.type === 'intersection'" stroke="#53C1DE" stroke-width="2">
        <line x1="3" y1="3" x2="17" y2="17" />
        <line x1="17" y1="3" x2="3" y2="17" />
      </g>
      <!-- 기타: 다이아몬드 -->
      <polygon
        v-else
        points="10,2 18,10 10,18 2,10"
        fill="none"
        :stroke="snapColor"
        stroke-width="2"
      />
    </svg>

    <!-- 스냅 타입 라벨 -->
    <div
      class="snap-label"
      :style="{
        left: `${screenPos.x + 14}px`,
        top: `${screenPos.y - 8}px`,
        borderColor: snapColor,
        color: snapColor,
      }"
    >
      {{ snapLabel }}
    </div>
  </div>
</template>

<style scoped>
.snap-wrapper {
  pointer-events: none;
}

.snap-indicator {
  position: absolute;
  pointer-events: none;
  z-index: 8;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.6));
}

.snap-label {
  position: absolute;
  z-index: 8;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  background: rgba(26, 26, 26, 0.85);
  border: 1px solid;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
  letter-spacing: 0.3px;
}
</style>
