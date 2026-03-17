<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMeasurementStore } from '@/stores/measurement'
import type { Point2D } from '@/types/cad'

const props = defineProps<{
  getScreenCoords: (worldX: number, worldY: number) => Point2D
}>()

const measureStore = useMeasurementStore()
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

  // 완료된 측정 결과 렌더링
  for (const m of measureStore.measurements) {
    drawMeasurement(m.type, m.points, m.value, m.unit)
  }

  // 진행 중인 측정 렌더링
  if (measureStore.isActive && measureStore.currentPoints.length > 0) {
    const pts = [...measureStore.currentPoints, measureStore.cursorPosition]
    drawPreview(measureStore.activeMeasureMode!, pts)
  }
}

function drawMeasurement(type: string, points: Point2D[], value: number, unit: string) {
  if (!ctx) return

  if (type === 'distance' && points.length >= 2) {
    drawDistanceLine(points[0]!, points[1]!, value, unit, false)
  } else if (type === 'area' && points.length >= 3) {
    drawAreaPolygon(points, value, unit)
  } else if (type === 'angle' && points.length >= 3) {
    drawAngleArc(points[0]!, points[1]!, points[2]!, value, unit)
  }
}

function drawPreview(type: string, points: Point2D[]) {
  if (!ctx) return

  if (type === 'distance') {
    if (points.length >= 2) {
      drawDistanceLine(points[0]!, points[points.length - 1]!, 0, '', true)
    }
  } else if (type === 'area') {
    drawAreaPreview(points)
  } else if (type === 'angle') {
    if (points.length >= 2) {
      drawAnglePreview(points)
    }
  }
}

function drawDistanceLine(p1: Point2D, p2: Point2D, value: number, unit: string, isPreview: boolean) {
  if (!ctx) return
  const s1 = toScreen(p1)
  const s2 = toScreen(p2)

  ctx.strokeStyle = isPreview ? 'rgba(59, 130, 246, 0.6)' : '#3B82F6'
  ctx.lineWidth = isPreview ? 1 : 2
  ctx.setLineDash(isPreview ? [6, 4] : [])

  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.stroke()
  ctx.setLineDash([])

  // 끝점 마커
  drawEndpoint(s1)
  drawEndpoint(s2)

  // 수치 텍스트
  if (!isPreview && value > 0) {
    const midX = (s1.x + s2.x) / 2
    const midY = (s1.y + s2.y) / 2
    drawLabel(`${value.toFixed(2)} ${unit}`, midX, midY - 10)
  }
}

function drawAreaPolygon(points: Point2D[], value: number, unit: string) {
  if (!ctx || points.length < 3) return
  const screenPts = points.map(toScreen)

  // 반투명 채우기
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'
  ctx.strokeStyle = '#3B82F6'
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
  for (let i = 1; i < screenPts.length; i++) {
    ctx.lineTo(screenPts[i]!.x, screenPts[i]!.y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // 중심에 면적 표시
  const cx = screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length
  const cy = screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length
  drawLabel(`${value.toFixed(2)} ${unit}`, cx, cy)
}

function drawAreaPreview(points: Point2D[]) {
  if (!ctx || points.length < 2) return
  const screenPts = points.map(toScreen)

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])

  ctx.beginPath()
  ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
  for (let i = 1; i < screenPts.length; i++) {
    ctx.lineTo(screenPts[i]!.x, screenPts[i]!.y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  for (const sp of screenPts) {
    drawEndpoint(sp)
  }
}

function drawAngleArc(p1: Point2D, vertex: Point2D, p2: Point2D, value: number, unit: string) {
  if (!ctx) return
  const s1 = toScreen(p1)
  const sv = toScreen(vertex)
  const s2 = toScreen(p2)

  // 선분
  ctx.strokeStyle = '#3B82F6'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(sv.x, sv.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.stroke()

  // 호
  const angle1 = Math.atan2(s1.y - sv.y, s1.x - sv.x)
  const angle2 = Math.atan2(s2.y - sv.y, s2.x - sv.x)
  const radius = 30

  ctx.strokeStyle = '#60A5FA'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(sv.x, sv.y, radius, angle1, angle2, false)
  ctx.stroke()

  drawEndpoint(s1)
  drawEndpoint(sv)
  drawEndpoint(s2)

  // 각도 라벨
  const labelAngle = (angle1 + angle2) / 2
  const lx = sv.x + (radius + 15) * Math.cos(labelAngle)
  const ly = sv.y + (radius + 15) * Math.sin(labelAngle)
  drawLabel(`${value.toFixed(1)}${unit}`, lx, ly)
}

function drawAnglePreview(points: Point2D[]) {
  if (!ctx) return
  const screenPts = points.map(toScreen)

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])

  ctx.beginPath()
  ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
  for (let i = 1; i < screenPts.length; i++) {
    ctx.lineTo(screenPts[i]!.x, screenPts[i]!.y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  for (const sp of screenPts) {
    drawEndpoint(sp)
  }
}

function drawEndpoint(p: Point2D) {
  if (!ctx) return
  ctx.fillStyle = '#3B82F6'
  ctx.beginPath()
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
  ctx.fill()
}

function drawLabel(text: string, x: number, y: number) {
  if (!ctx) return
  ctx.font = '12px "JetBrains Mono", monospace'
  const metrics = ctx.measureText(text)
  const padding = 4
  const w = metrics.width + padding * 2
  const h = 16 + padding * 2

  ctx.fillStyle = 'rgba(30, 31, 34, 0.9)'
  ctx.fillRect(x - w / 2, y - h / 2, w, h)

  ctx.fillStyle = '#60A5FA'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

// 상태 변경 시 재렌더링
watch(
  () => [
    measureStore.measurements.length,
    measureStore.currentPoints.length,
    measureStore.cursorPosition.x,
    measureStore.cursorPosition.y,
  ],
  () => render(),
)

// Pan/Zoom 시 재렌더링을 위해 외부에서 호출
defineExpose({ render, resizeCanvas })
</script>

<template>
  <canvas
    ref="canvas"
    class="measurement-overlay"
  />
</template>

<style scoped>
.measurement-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
</style>
