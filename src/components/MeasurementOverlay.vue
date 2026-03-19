<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMeasurementStore } from '@/stores/measurement'
import { useMeasurementSettingsStore } from '@/stores/measurementSettings'
import type { Point2D, MeasurementResult } from '@/types/cad'

const props = defineProps<{
  getScreenCoords: (worldX: number, worldY: number) => Point2D
}>()

const measureStore = useMeasurementStore()
const settingsStore = useMeasurementSettingsStore()
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null

/** 라벨 색상은 측정 설정의 textColor를 사용 */
const labelColor = () => settingsStore.settings.style.textColor

/** 고정 화면 폰트 크기 (px) — 모든 측정 라벨이 동일한 크기로 표시 */
const FIXED_LABEL_FONT_PX = 12

/** RAF 기반 렌더 스로틀링 */
let rafId: number | null = null

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
  if (rafId !== null) cancelAnimationFrame(rafId)
})

function resizeCanvas() {
  if (!canvas.value?.parentElement) return
  const parent = canvas.value.parentElement
  const dpr = window.devicePixelRatio || 1
  canvas.value.width = parent.clientWidth * dpr
  canvas.value.height = parent.clientHeight * dpr
  canvas.value.style.width = `${parent.clientWidth}px`
  canvas.value.style.height = `${parent.clientHeight}px`
  renderImmediate()
}

function toScreen(world: Point2D): Point2D {
  return props.getScreenCoords(world.x, world.y)
}

/** 라벨 오프셋 계산용 — 현재 줌의 화면 픽셀/월드 비율 */
function getPixelsPerWorld(): number {
  try {
    const s1 = toScreen({ x: 0, y: 0 })
    const s2 = toScreen({ x: 100, y: 0 })
    const ppw = Math.hypot(s2.x - s1.x, s2.y - s1.y) / 100
    if (!isFinite(ppw) || ppw <= 0) return 1
    return ppw
  } catch {
    return 1
  }
}

/** RAF 스로틀 렌더 — 프레임당 최대 1회 */
function render() {
  if (rafId !== null) return // 이미 예약됨
  rafId = requestAnimationFrame(() => {
    rafId = null
    renderImmediate()
  })
}

/** 실제 렌더링 로직 */
function renderImmediate() {
  if (!ctx || !canvas.value) return
  try {
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, canvas.value.width / dpr, canvas.value.height / dpr)

    // 완료된 측정 결과 — 치수 라벨 표시
    for (const m of measureStore.measurements) {
      drawMeasurementLabel(m)
    }

    // 진행 중인 측정 — 실시간 값 표시 (커서 근처, 고정 10px)
    if (measureStore.isActive && measureStore.currentPoints.length > 0 && measureStore.liveValue) {
      const live = measureStore.liveValue
      let text: string
      if (live.unit === '°') text = settingsStore.formatAngle(live.value)
      else if (live.unit === 'mm²') text = settingsStore.formatArea(live.value)
      else text = settingsStore.formatLength(live.value)

      const cursorScreen = toScreen(measureStore.cursorPosition)
      drawLabelFixed(text, cursorScreen.x + 18, cursorScreen.y - 8, 10)
    }
  } catch (err) {
    console.warn('[MeasurementOverlay] render error:', err)
  }
}

/** 완료된 측정의 치수 라벨을 측정 좌표 위에 표시 */
function drawMeasurementLabel(m: MeasurementResult) {
  const pos = getLabelPosition(m)
  if (!pos) return
  const screen = toScreen(pos)
  const text = formatMeasurementValue(m)
  drawLabelFixed(text, screen.x, screen.y, FIXED_LABEL_FONT_PX)
}

/** 측정 유형별 라벨 위치 계산 (월드 좌표) */
function getLabelPosition(m: MeasurementResult): Point2D | null {
  switch (m.type) {
    case 'distance': {
      if (m.points.length < 2) return null
      const p1 = m.points[0]!
      const p2 = m.points[1]!
      const mx = (p1.x + p2.x) / 2
      const my = (p1.y + p2.y) / 2
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const len = Math.hypot(dx, dy)
      const nx = len > 0 ? -dy / len : 0
      const ny = len > 0 ? dx / len : 1
      // 고정 픽셀 오프셋을 월드 좌표로 변환
      const worldOffset = FIXED_LABEL_FONT_PX * 1.5 / getPixelsPerWorld()
      return { x: mx + nx * worldOffset, y: my + ny * worldOffset }
    }
    case 'area': {
      if (m.points.length < 3) return null
      const cx = m.points.reduce((s, p) => s + p.x, 0) / m.points.length
      const cy = m.points.reduce((s, p) => s + p.y, 0) / m.points.length
      return { x: cx, y: cy }
    }
    case 'angle': {
      if (m.points.length < 3) return null
      const vertex = m.points[1]!
      const p1 = m.points[0]!
      const p2 = m.points[2]!
      const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x)
      const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x)
      const bisect = (a1 + a2) / 2
      const worldOffset = FIXED_LABEL_FONT_PX * 3 / getPixelsPerWorld()
      return { x: vertex.x + Math.cos(bisect) * worldOffset, y: vertex.y + Math.sin(bisect) * worldOffset }
    }
    case 'coordinate': {
      if (m.points.length < 1) return null
      const pt = m.points[0]!
      const worldOffset = FIXED_LABEL_FONT_PX * 1.5 / getPixelsPerWorld()
      return { x: pt.x + worldOffset, y: pt.y + worldOffset }
    }
    case 'arc-length': {
      if (m.points.length < 3) return null
      const mid = m.points[1]!
      const worldOffset = FIXED_LABEL_FONT_PX * 1.5 / getPixelsPerWorld()
      return { x: mid.x + worldOffset, y: mid.y + worldOffset }
    }
    case 'point-to-line': {
      if (m.points.length < 3) return null
      const point = m.points[2]!
      const projection = m.auxiliary?.projection ?? point
      return { x: (point.x + projection.x) / 2, y: (point.y + projection.y) / 2 }
    }
    default:
      return null
  }
}

/** 측정 결과를 포맷팅된 문자열로 변환 */
function formatMeasurementValue(m: MeasurementResult): string {
  switch (m.type) {
    case 'distance':
    case 'arc-length':
    case 'point-to-line':
      return settingsStore.formatLength(m.value)
    case 'area':
      return settingsStore.formatArea(m.value)
    case 'angle':
      return settingsStore.formatAngle(m.value)
    case 'coordinate': {
      if (m.points.length < 1) return ''
      const pt = m.points[0]!
      return settingsStore.formatCoordinate(pt.x, pt.y)
    }
    default:
      return `${m.value.toFixed(2)} ${m.unit}`
  }
}

/** 고정 폰트 크기로 라벨 렌더링 */
function drawLabelFixed(text: string, x: number, y: number, fontSize: number) {
  if (!ctx || !canvas.value) return
  const dpr = window.devicePixelRatio || 1
  const cw = canvas.value.width / dpr
  const ch = canvas.value.height / dpr

  const fs = Math.round(Math.max(1, fontSize))
  ctx.font = `${fs}px "JetBrains Mono", "Cascadia Code", monospace`
  const metrics = ctx.measureText(text)
  const padding = Math.max(1, fs * 0.2)
  const w = metrics.width + padding * 2
  const h = fs + padding * 2

  // 화면 밖으로 넘어가지 않도록 클램핑
  const margin = 2
  const lx = Math.max(margin + w / 2, Math.min(cw - margin - w / 2, x))
  const ly = Math.max(margin + h / 2, Math.min(ch - margin - h / 2, y))

  // 배경 (반투명 다크)
  ctx.fillStyle = 'rgba(16, 20, 24, 0.75)'
  ctx.beginPath()
  ctx.roundRect(lx - w / 2, ly - h / 2, w, h, Math.min(3, fs * 0.2))
  ctx.fill()

  // 텍스트 (선 색상과 동일)
  ctx.fillStyle = labelColor()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, lx, ly)
}

// 커서 이동 및 측정 결과 변경 시 재렌더링 (RAF로 자동 스로틀)
watch(
  () => [
    measureStore.currentPoints.length,
    measureStore.cursorPosition.x,
    measureStore.cursorPosition.y,
    measureStore.measurements.length,
  ],
  () => render(),
)

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
