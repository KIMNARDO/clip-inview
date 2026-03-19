<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  active: boolean
  snapped?: boolean
}>()

const container = ref<HTMLElement | null>(null)
const x = ref(0)
const y = ref(0)
const visible = ref(false)

const lineColor = computed(() => props.snapped ? '#4CAF50' : '#00E5FF')
const glowColor = computed(() => props.snapped ? 'rgba(76,175,80,0.4)' : 'rgba(0,229,255,0.35)')

function updateFromEvent(event: MouseEvent) {
  const el = container.value?.parentElement
  if (!el) return
  const rect = el.getBoundingClientRect()
  x.value = event.clientX - rect.left
  y.value = event.clientY - rect.top
  visible.value = true
}

function hide() {
  visible.value = false
}

defineExpose({ updatePosition: updateFromEvent, hide })
</script>

<template>
  <div
    ref="container"
    v-show="active && visible"
    class="crosshair-overlay"
  >
    <svg class="crosshair-svg" width="100%" height="100%">
      <defs>
        <!-- 3D 글로우 필터 -->
        <filter :id="`ch-glow-${$.uid}`" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- 글로우 레이어 (뒤쪽) -->
      <!-- 세로선 -->
      <line
        :x1="x" y1="0" :x2="x" :y2="y - 0.5"
        :stroke="glowColor" stroke-width="3"
      />
      <line
        :x1="x" :y1="y + 0.5" :x2="x" y2="100%"
        :stroke="glowColor" stroke-width="3"
      />
      <!-- 가로선 -->
      <line
        x1="0" :y1="y" :x2="x - 0.5" :y2="y"
        :stroke="glowColor" stroke-width="3"
      />
      <line
        :x1="x + 0.5" :y1="y" x2="100%" :y2="y"
        :stroke="glowColor" stroke-width="3"
      />

      <!-- 메인 라인 (앞쪽, 선명한 1px) -->
      <!-- 세로선 -->
      <line
        :x1="x" y1="0" :x2="x" y2="100%"
        :stroke="lineColor" stroke-width="0.8"
        :filter="`url(#ch-glow-${$.uid})`"
      />
      <!-- 가로선 -->
      <line
        x1="0" :y1="y" x2="100%" :y2="y"
        :stroke="lineColor" stroke-width="0.8"
        :filter="`url(#ch-glow-${$.uid})`"
      />

      <!-- 중심 교차점 강조 도트 -->
      <circle
        :cx="x" :cy="y" r="1.5"
        :fill="lineColor"
        opacity="0.9"
      />
    </svg>
  </div>
</template>

<style scoped>
.crosshair-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
  overflow: hidden;
}

.crosshair-svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
