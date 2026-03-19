<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import type { Point2D } from '@/types/cad'

const props = defineProps<{
  getScreenCoords: (worldX: number, worldY: number) => Point2D
}>()

const store = useAppStore()
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let rafId: number | null = null

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  resizeObserver = new ResizeObserver(() => render())
  resizeObserver.observe(canvas.value.parentElement!)
  renderImmediate()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (rafId !== null) cancelAnimationFrame(rafId)
})

// 줌 레벨에 따라 그리드 간격을 동적 조정
function getGridSpacing(): number {
  const zoom = store.zoomLevel
  if (zoom > 800) return 1
  if (zoom > 400) return 5
  if (zoom > 200) return 10
  if (zoom > 100) return 25
  if (zoom > 50) return 50
  if (zoom > 25) return 100
  return 250
}

/** RAF 스로틀 렌더 */
function render() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    renderImmediate()
  })
}

function renderImmediate() {
  if (!canvas.value || !ctx || !store.isGridEnabled) return

  const parent = canvas.value.parentElement
  if (!parent) return

  const w = parent.clientWidth
  const h = parent.clientHeight
  canvas.value.width = w
  canvas.value.height = h

  ctx.clearRect(0, 0, w, h)

  const spacing = getGridSpacing()

  // 화면 사방 모서리의 월드 좌표를 역산하기 어려우므로
  // 원점 기준으로 넓은 범위의 그리드를 그립니다
  const origin = props.getScreenCoords(0, 0)

  // 그리드 점을 그리기 위한 간격을 화면 픽셀로 계산
  const nextPoint = props.getScreenCoords(spacing, 0)
  const pixelSpacing = Math.abs(nextPoint.x - origin.x)

  // 간격이 너무 좁으면 그리지 않음
  if (pixelSpacing < 8) return

  // 원점으로부터의 오프셋 계산
  const offsetX = ((origin.x % pixelSpacing) + pixelSpacing) % pixelSpacing
  const offsetY = ((origin.y % pixelSpacing) + pixelSpacing) % pixelSpacing

  // 그리드 점 렌더링 (점 패턴)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'

  for (let x = offsetX; x < w; x += pixelSpacing) {
    for (let y = offsetY; y < h; y += pixelSpacing) {
      ctx.fillRect(Math.round(x) - 0.5, Math.round(y) - 0.5, 1, 1)
    }
  }

  // 원점 축 표시
  if (origin.x > 0 && origin.x < w && origin.y > 0 && origin.y < h) {
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(origin.x, 0)
    ctx.lineTo(origin.x, h)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(81, 207, 102, 0.3)'
    ctx.beginPath()
    ctx.moveTo(0, origin.y)
    ctx.lineTo(w, origin.y)
    ctx.stroke()
  }
}

// 그리드 on/off 또는 줌 변경 시 재렌더링
watch([() => store.isGridEnabled, () => store.zoomLevel], () => {
  if (store.isGridEnabled) {
    render()
  } else if (canvas.value && ctx) {
    const w = canvas.value.width
    const h = canvas.value.height
    ctx.clearRect(0, 0, w, h)
  }
})

defineExpose({ render })
</script>

<template>
  <canvas
    v-show="store.isGridEnabled"
    ref="canvas"
    class="grid-canvas"
  />
</template>

<style scoped>
.grid-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
</style>
