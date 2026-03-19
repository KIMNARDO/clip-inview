<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMeasurementStore } from '@/stores/measurement'
import { formatMeasurement } from '@/utils/measurement'
import type { Point2D, MeasurementResult } from '@/types/cad'

const props = defineProps<{
  getScreenCoords: (worldX: number, worldY: number) => Point2D
}>()

const measureStore = useMeasurementStore()
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null

const MEASURE_COLOR = '#FFD700'
const MEASURE_TEXT_COLOR = '#FFEE58'
const PREVIEW_COLOR = '#B8960E'

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
  const viewport = props.getScreenCoords(world.x, world.y)
  // getScreenCoords는 브라우저 viewport 좌표를 반환하지만,
  // 오버레이 캔버스는 .viewer-root 내부에 위치하므로 컨테이너 위치를 빼줘야 함
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return viewport
  return { x: viewport.x - rect.left, y: viewport.y - rect.top }
}

function render() {
  if (!ctx || !canvas.value) return
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.value.width / dpr, canvas.value.height / dpr)

  // 완료된 측정 결과 렌더링
  for (const m of measureStore.measurements) {
    drawMeasurement(m)
  }

  // 진행 중인 측정 렌더링
  if (measureStore.isActive && measureStore.currentPoints.length > 0) {
    const pts = [...measureStore.currentPoints, measureStore.cursorPosition]
    drawPreview(measureStore.activeMeasureMode!, pts)
  }
}

// ─── 완료된 측정 결과 그리기 ───

function drawMeasurement(m: MeasurementResult) {
  if (!ctx) return

  switch (m.type) {
    case 'distance':
      if (m.points.length >= 2) drawDistance(m.points[0]!, m.points[1]!, m.value, m.unit)
      break
    case 'area':
      if (m.points.length >= 3) drawArea(m.points, m.value, m.unit)
      break
    case 'angle':
      if (m.points.length >= 3) drawAngle(m.points[0]!, m.points[1]!, m.points[2]!, m.value, m.unit)
      break
    case 'coordinate':
      if (m.points.length >= 1) drawCoordinate(m.points[0]!)
      break
    case 'arc-length':
      if (m.points.length >= 3) drawArcLength(m.points[0]!, m.points[1]!, m.points[2]!, m.value, m.unit, m.auxiliary)
      break
    case 'point-to-line':
      if (m.points.length >= 3) drawPointToLine(m.points[0]!, m.points[1]!, m.points[2]!, m.value, m.unit, m.auxiliary)
      break
  }
}

function drawDistance(p1: Point2D, p2: Point2D, value: number, unit: string) {
  if (!ctx) return
  const s1 = toScreen(p1)
  const s2 = toScreen(p2)

  // 측정선
  ctx.strokeStyle = MEASURE_COLOR
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.stroke()

  drawMarker(s1)
  drawMarker(s2)

  // 수치 텍스트 — 선분 중점
  const midX = (s1.x + s2.x) / 2
  const midY = (s1.y + s2.y) / 2
  // 선에 수직 방향으로 오프셋
  const dx = s2.x - s1.x
  const dy = s2.y - s1.y
  const len = Math.hypot(dx, dy)
  const nx = len > 0 ? -dy / len : 0
  const ny = len > 0 ? dx / len : 1
  drawLabel(formatMeasurement(value, unit), midX + nx * 16, midY + ny * 16)
}

function drawArea(points: Point2D[], value: number, unit: string) {
  if (!ctx) return
  const screenPts = points.map(toScreen)

  // 반투명 채우기
  ctx.fillStyle = 'rgba(255, 215, 0, 0.1)'
  ctx.strokeStyle = MEASURE_COLOR
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 3])

  ctx.beginPath()
  ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
  for (let i = 1; i < screenPts.length; i++) {
    ctx.lineTo(screenPts[i]!.x, screenPts[i]!.y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])

  for (const sp of screenPts) drawMarker(sp)

  const cx = screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length
  const cy = screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length
  drawLabel(formatMeasurement(value, unit), cx, cy)
}

function drawAngle(p1: Point2D, vertex: Point2D, p2: Point2D, value: number, unit: string) {
  if (!ctx) return
  const s1 = toScreen(p1)
  const sv = toScreen(vertex)
  const s2 = toScreen(p2)

  ctx.strokeStyle = MEASURE_COLOR
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(sv.x, sv.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.stroke()

  // 호
  const angle1 = Math.atan2(s1.y - sv.y, s1.x - sv.x)
  const angle2 = Math.atan2(s2.y - sv.y, s2.x - sv.x)
  const radius = 30
  ctx.strokeStyle = MEASURE_TEXT_COLOR
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(sv.x, sv.y, radius, angle1, angle2, false)
  ctx.stroke()

  drawMarker(s1)
  drawMarker(sv)
  drawMarker(s2)

  const labelAngle = (angle1 + angle2) / 2
  drawLabel(`${value.toFixed(1)}${unit}`, sv.x + (radius + 18) * Math.cos(labelAngle), sv.y + (radius + 18) * Math.sin(labelAngle))
}

function drawCoordinate(point: Point2D) {
  if (!ctx) return
  const sp = toScreen(point)
  drawMarker(sp)
  drawLabel(`(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`, sp.x + 14, sp.y - 14)
}

function drawArcLength(p1: Point2D, p2: Point2D, p3: Point2D, value: number, unit: string, auxiliary?: MeasurementResult['auxiliary']) {
  if (!ctx) return
  const s1 = toScreen(p1)
  const s2 = toScreen(p2)
  const s3 = toScreen(p3)

  if (auxiliary?.arcCenter && auxiliary.arcRadius) {
    const sCenter = toScreen(auxiliary.arcCenter)
    // 화면 좌표에서 반지름 계산 (월드→스크린 비율 적용)
    const sRadius = Math.hypot(s1.x - sCenter.x, s1.y - sCenter.y)

    const sa = Math.atan2(s1.y - sCenter.y, s1.x - sCenter.x)
    const ma = Math.atan2(s2.y - sCenter.y, s2.x - sCenter.x)
    const ea = Math.atan2(s3.y - sCenter.y, s3.x - sCenter.x)

    // 경유점을 포함하는 방향 결정
    function norm(a: number): number { while (a < 0) a += 2 * Math.PI; while (a >= 2 * Math.PI) a -= 2 * Math.PI; return a }
    const sweep = norm(ea - sa)
    const midInSweep = norm(ma - sa) <= sweep
    const counterclockwise = !midInSweep

    ctx.strokeStyle = MEASURE_COLOR
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.arc(sCenter.x, sCenter.y, sRadius, sa, ea, counterclockwise)
    ctx.stroke()
  } else {
    // 호 정보 없을 때 직선 연결 대체
    ctx.strokeStyle = MEASURE_COLOR
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(s1.x, s1.y)
    ctx.lineTo(s2.x, s2.y)
    ctx.lineTo(s3.x, s3.y)
    ctx.stroke()
  }

  drawMarker(s1)
  drawMarker(s2)
  drawMarker(s3)

  // 호 중점(경유점 근처)에 수치 표시
  drawLabel(formatMeasurement(value, unit), s2.x + 14, s2.y - 14)
}

function drawPointToLine(lineStart: Point2D, lineEnd: Point2D, point: Point2D, value: number, unit: string, auxiliary?: MeasurementResult['auxiliary']) {
  if (!ctx) return
  const sStart = toScreen(lineStart)
  const sEnd = toScreen(lineEnd)
  const sPoint = toScreen(point)
  const projection = auxiliary?.projection ?? point
  const sProj = toScreen(projection)

  // 기준 선분
  ctx.strokeStyle = MEASURE_COLOR
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(sStart.x, sStart.y)
  ctx.lineTo(sEnd.x, sEnd.y)
  ctx.stroke()

  // 수선
  ctx.strokeStyle = MEASURE_COLOR
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sPoint.x, sPoint.y)
  ctx.lineTo(sProj.x, sProj.y)
  ctx.stroke()
  ctx.setLineDash([])

  drawMarker(sStart)
  drawMarker(sEnd)
  drawMarker(sPoint)

  const midX = (sPoint.x + sProj.x) / 2
  const midY = (sPoint.y + sProj.y) / 2
  drawLabel(formatMeasurement(value, unit), midX + 14, midY - 10)
}

// ─── 프리뷰 (진행 중인 측정) ───

function drawPreview(type: string, points: Point2D[]) {
  if (!ctx) return

  ctx.strokeStyle = PREVIEW_COLOR
  ctx.lineWidth = 1
  ctx.setLineDash([5, 4])

  switch (type) {
    case 'distance':
      if (points.length >= 2) {
        const s1 = toScreen(points[0]!)
        const s2 = toScreen(points[points.length - 1]!)
        ctx.beginPath()
        ctx.moveTo(s1.x, s1.y)
        ctx.lineTo(s2.x, s2.y)
        ctx.stroke()
        drawMarker(s1, true)
        drawMarker(s2, true)
        // 실시간 거리
        if (measureStore.liveValue) {
          const mx = (s1.x + s2.x) / 2
          const my = (s1.y + s2.y) / 2
          drawLabel(formatMeasurement(measureStore.liveValue.value, measureStore.liveValue.unit), mx, my - 14, true)
        }
      }
      break

    case 'area': {
      if (points.length < 2) break
      const screenPts = points.map(toScreen)
      ctx.beginPath()
      ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i]!.x, screenPts[i]!.y)
      }
      ctx.closePath()
      ctx.stroke()
      for (const sp of screenPts) drawMarker(sp, true)
      if (measureStore.liveValue && points.length >= 3) {
        const cx = screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length
        const cy = screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length
        drawLabel(formatMeasurement(measureStore.liveValue.value, measureStore.liveValue.unit), cx, cy, true)
      }
      break
    }

    case 'angle': {
      const screenPts = points.map(toScreen)
      if (screenPts.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
        ctx.lineTo(screenPts[1]!.x, screenPts[1]!.y)
        ctx.stroke()
      }
      if (screenPts.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(screenPts[1]!.x, screenPts[1]!.y)
        ctx.lineTo(screenPts[2]!.x, screenPts[2]!.y)
        ctx.stroke()
      }
      for (const sp of screenPts) drawMarker(sp, true)
      if (measureStore.liveValue && points.length >= 3) {
        const sv = screenPts[1]!
        drawLabel(`${measureStore.liveValue.value.toFixed(1)}${measureStore.liveValue.unit}`, sv.x + 40, sv.y - 10, true)
      }
      break
    }

    case 'arc-length': {
      const screenPts = points.map(toScreen)
      // 세 점을 직선으로 연결하여 프리뷰
      if (screenPts.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
        ctx.lineTo(screenPts[1]!.x, screenPts[1]!.y)
        ctx.stroke()
      }
      if (screenPts.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(screenPts[1]!.x, screenPts[1]!.y)
        ctx.lineTo(screenPts[2]!.x, screenPts[2]!.y)
        ctx.stroke()
      }
      for (const sp of screenPts) drawMarker(sp, true)
      if (measureStore.liveValue && screenPts.length >= 3) {
        const sv = screenPts[1]!
        drawLabel(formatMeasurement(measureStore.liveValue.value, measureStore.liveValue.unit), sv.x + 14, sv.y - 14, true)
      }
      break
    }

    case 'point-to-line': {
      const screenPts = points.map(toScreen)
      if (screenPts.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(screenPts[0]!.x, screenPts[0]!.y)
        ctx.lineTo(screenPts[1]!.x, screenPts[1]!.y)
        ctx.stroke()
      }
      if (screenPts.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(screenPts[1]!.x, screenPts[1]!.y)
        ctx.lineTo(screenPts[2]!.x, screenPts[2]!.y)
        ctx.stroke()
      }
      for (const sp of screenPts) drawMarker(sp, true)
      if (measureStore.liveValue && screenPts.length >= 3) {
        const mx = (screenPts[1]!.x + screenPts[2]!.x) / 2
        const my = (screenPts[1]!.y + screenPts[2]!.y) / 2
        drawLabel(formatMeasurement(measureStore.liveValue.value, measureStore.liveValue.unit), mx + 12, my - 10, true)
      }
      break
    }
  }

  ctx.setLineDash([])
}

// ─── 공통 유틸 ───

function drawMarker(p: Point2D, isPreview = false) {
  if (!ctx) return
  const size = 5
  ctx.strokeStyle = isPreview ? PREVIEW_COLOR : MEASURE_COLOR
  ctx.lineWidth = isPreview ? 1 : 1.5
  ctx.setLineDash([])
  // 십자 마커
  ctx.beginPath()
  ctx.moveTo(p.x - size, p.y)
  ctx.lineTo(p.x + size, p.y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(p.x, p.y - size)
  ctx.lineTo(p.x, p.y + size)
  ctx.stroke()
}

function drawLabel(text: string, x: number, y: number, isPreview = false) {
  if (!ctx) return
  ctx.font = `${isPreview ? '500' : '600'} 12px "JetBrains Mono", "Cascadia Code", monospace`
  const metrics = ctx.measureText(text)
  const padding = 4
  const w = metrics.width + padding * 2
  const h = 16 + padding * 2

  // 배경
  ctx.fillStyle = isPreview ? 'rgba(20, 20, 20, 0.75)' : 'rgba(20, 20, 20, 0.9)'
  const rx = 3
  const bx = x - w / 2
  const by = y - h / 2
  ctx.beginPath()
  ctx.roundRect(bx, by, w, h, rx)
  ctx.fill()

  // 텍스트
  ctx.fillStyle = isPreview ? PREVIEW_COLOR : MEASURE_TEXT_COLOR
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
