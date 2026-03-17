<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMarkupStore } from '@/stores/markup'
import type { Point2D, MarkupEntity } from '@/types/cad'

const props = defineProps<{
  getScreenCoords: (worldX: number, worldY: number) => Point2D
}>()

const markupStore = useMarkupStore()
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    resizeCanvas()
    resizeObserver = new ResizeObserver(resizeCanvas)
    if (canvas.value.parentElement) {
      resizeObserver.observe(canvas.value.parentElement)
    }
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

function resizeCanvas() {
  if (!canvas.value?.parentElement) return
  const parent = canvas.value.parentElement
  const dpr = window.devicePixelRatio || 1
  canvas.value.width = parent.clientWidth * dpr
  canvas.value.height = parent.clientHeight * dpr
  canvas.value.style.width = `${parent.clientWidth}px`
  canvas.value.style.height = `${parent.clientHeight}px`
  render()
}

function toScreen(world: Point2D): Point2D {
  return props.getScreenCoords(world.x, world.y)
}

function render() {
  if (!ctx || !canvas.value) return
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.value.width / dpr, canvas.value.height / dpr)

  // 완료된 마크업 렌더링
  for (const markup of markupStore.markups) {
    drawMarkup(markup, markup.id === markupStore.selectedMarkupId)
  }

  // 진행 중인 마크업 프리뷰
  if (markupStore.isActive && markupStore.currentPoints.length > 0) {
    drawPreview()
  }
}

function drawMarkup(markup: MarkupEntity, isSelected: boolean) {
  if (!ctx) return

  ctx.strokeStyle = markup.style.color
  ctx.lineWidth = markup.style.lineWidth
  ctx.globalAlpha = markup.style.opacity ?? 1

  switch (markup.type) {
    case 'text':
      drawText(markup, isSelected)
      break
    case 'rect':
      drawRect(markup.points, markup.style.color, markup.style.lineWidth, isSelected)
      break
    case 'circle':
      drawCircle(markup.points, markup.style.color, markup.style.lineWidth, isSelected)
      break
    case 'arrow':
      drawArrow(markup.points, markup.style.color, markup.style.lineWidth, isSelected)
      break
  }

  ctx.globalAlpha = 1
}

function drawText(markup: MarkupEntity, isSelected: boolean) {
  if (!ctx || !markup.text || markup.points.length < 1) return
  const s = toScreen(markup.points[0]!)
  const fontSize = markup.style.fontSize ?? 14

  ctx.font = `${fontSize}px "Inter", "Noto Sans KR", sans-serif`
  ctx.fillStyle = markup.style.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(markup.text, s.x, s.y)

  if (isSelected) {
    const metrics = ctx.measureText(markup.text)
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.strokeRect(s.x - 2, s.y - 2, metrics.width + 4, fontSize + 4)
    ctx.setLineDash([])
  }
}

function drawRect(points: Point2D[], color: string, lineWidth: number, isSelected: boolean) {
  if (!ctx || points.length < 2) return
  const s1 = toScreen(points[0]!)
  const s2 = toScreen(points[1]!)
  const x = Math.min(s1.x, s2.x)
  const y = Math.min(s1.y, s2.y)
  const w = Math.abs(s2.x - s1.x)
  const h = Math.abs(s2.y - s1.y)

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.strokeRect(x, y, w, h)

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6)
    ctx.setLineDash([])
  }
}

function drawCircle(points: Point2D[], color: string, lineWidth: number, isSelected: boolean) {
  if (!ctx || points.length < 2) return
  const center = toScreen(points[0]!)
  const edge = toScreen(points[1]!)
  const radius = Math.hypot(edge.x - center.x, edge.y - center.y)

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.stroke()

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius + 4, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawArrow(points: Point2D[], color: string, lineWidth: number, isSelected: boolean) {
  if (!ctx || points.length < 2) return
  const s1 = toScreen(points[0]!)
  const s2 = toScreen(points[1]!)

  // 선분
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.stroke()

  // 화살표 머리
  const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x)
  const headLen = 12
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(s2.x, s2.y)
  ctx.lineTo(
    s2.x - headLen * Math.cos(angle - Math.PI / 6),
    s2.y - headLen * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    s2.x - headLen * Math.cos(angle + Math.PI / 6),
    s2.y - headLen * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fill()

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    const dx = s2.x - s1.x
    const dy = s2.y - s1.y
    const len = Math.hypot(dx, dy)
    if (len > 0) {
      const nx = -dy / len * 4
      const ny = dx / len * 4
      ctx.beginPath()
      ctx.moveTo(s1.x + nx, s1.y + ny)
      ctx.lineTo(s2.x + nx, s2.y + ny)
      ctx.lineTo(s2.x - nx, s2.y - ny)
      ctx.lineTo(s1.x - nx, s1.y - ny)
      ctx.closePath()
      ctx.stroke()
    }
    ctx.setLineDash([])
  }
}

function drawPreview() {
  if (!ctx || !markupStore.activeMarkupType) return
  const pts = markupStore.currentPoints

  ctx.globalAlpha = 0.5
  ctx.setLineDash([6, 4])

  switch (markupStore.activeMarkupType) {
    case 'text':
      if (pts.length >= 1) {
        const s = toScreen(pts[0]!)
        ctx.strokeStyle = markupStore.currentStyle.color
        ctx.lineWidth = 1
        ctx.strokeRect(s.x - 1, s.y - 1, 80, 18)
        ctx.fillStyle = markupStore.currentStyle.color
        ctx.font = '12px Inter, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText('텍스트 입력...', s.x + 2, s.y + 2)
      }
      break
    case 'rect':
      if (pts.length === 1) {
        const s = toScreen(pts[0]!)
        drawEndpoint(s)
      }
      break
    case 'circle':
      if (pts.length === 1) {
        const s = toScreen(pts[0]!)
        drawEndpoint(s)
      }
      break
    case 'arrow':
      if (pts.length === 1) {
        const s = toScreen(pts[0]!)
        drawEndpoint(s)
      }
      break
  }

  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

function drawEndpoint(p: Point2D) {
  if (!ctx) return
  ctx.fillStyle = markupStore.currentStyle.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
  ctx.fill()
}

// 상태 변경 시 재렌더링
watch(
  () => [
    markupStore.markups.length,
    markupStore.currentPoints.length,
    markupStore.selectedMarkupId,
  ],
  () => render(),
)

defineExpose({ render, resizeCanvas })
</script>

<template>
  <canvas
    ref="canvas"
    class="markup-overlay"
  />
</template>

<style scoped>
.markup-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
}
</style>
