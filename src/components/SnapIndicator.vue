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
</script>

<template>
  <svg
    v-if="snap && screenPos"
    class="snap-indicator"
    :style="{
      left: `${screenPos.x - 8}px`,
      top: `${screenPos.y - 8}px`,
    }"
    width="16"
    height="16"
    viewBox="0 0 16 16"
  >
    <!-- Endpoint: 사각형 -->
    <rect
      v-if="snap.type === 'endpoint'"
      x="2" y="2" width="12" height="12"
      fill="none"
      stroke="#4CAF50"
      stroke-width="2"
    />
    <!-- Midpoint: 삼각형 -->
    <polygon
      v-else-if="snap.type === 'midpoint'"
      points="8,2 14,14 2,14"
      fill="none"
      stroke="#FF9800"
      stroke-width="2"
    />
    <!-- Center: 원 -->
    <circle
      v-else-if="snap.type === 'center'"
      cx="8" cy="8" r="6"
      fill="none"
      stroke="#E94560"
      stroke-width="2"
    />
    <!-- Intersection: X 마크 -->
    <g v-else-if="snap.type === 'intersection'" stroke="#53C1DE" stroke-width="2">
      <line x1="2" y1="2" x2="14" y2="14" />
      <line x1="14" y1="2" x2="2" y2="14" />
    </g>
  </svg>
</template>

<style scoped>
.snap-indicator {
  position: absolute;
  pointer-events: none;
  z-index: 6;
}
</style>
