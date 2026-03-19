<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMarkupStore } from '@/stores/markup'
import type { Point2D, MarkupEntity } from '@/types/cad'

const props = defineProps<{
  getScreenCoords: (worldX: number, worldY: number) => Point2D
  freehandPoints?: Point2D[]
}>()

const markupStore = useMarkupStore()
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
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
  render()
}

function toScreen(world: Point2D): Point2D {
  return props.getScreenCoords(world.x, world.y)
}

/** RAF 스로틀 렌더 — 프레임당 최대 1회 */
function render() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    renderImmediate()
  })
}

function renderImmediate() {
  if (!ctx || !canvas.value) return
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.value.width / dpr, canvas.value.height / dpr)

  // 완료된 마크업 렌더링 (isVisible 체크)
  if (markupStore.isVisible) {
    for (const markup of markupStore.markups) {
      drawMarkup(markup, markup.id === markupStore.selectedMarkupId)
    }
  }

  // 진행 중인 마크업 프리뷰
  if (markupStore.isActive && markupStore.currentPoints.length > 0) {
    drawPreview()
  }

  // 자유곡선 실시간 프리뷰
  if (props.freehandPoints && props.freehandPoints.length >= 2) {
    ctx.globalAlpha = 0.7
    drawFreehand(props.freehandPoints, markupStore.currentStyle.color, markupStore.currentStyle.lineWidth, false)
    ctx.globalAlpha = 1
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
    case 'line':
      drawLine(markup.points, markup.style.color, markup.style.lineWidth, isSelected)
      break
    case 'ellipse':
      drawEllipse(markup.points, markup.style.color, markup.style.lineWidth, isSelected)
      break
    case 'revcloud':
      drawRevcloud(markup.points, markup.style.color, markup.style.lineWidth, isSelected)
      break
    case 'leader':
      drawLeader(markup, isSelected)
      break
    case 'freehand':
      drawFreehand(markup.points, markup.style.color, markup.style.lineWidth, isSelected)
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

function drawLine(points: Point2D[], color: string, lineWidth: number, isSelected: boolean) {
  if (!ctx || points.length < 2) return
  const s1 = toScreen(points[0]!)
  const s2 = toScreen(points[1]!)

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.stroke()

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    const dx = s2.x - s1.x
    const dy = s2.y - s1.y
    const len = Math.hypot(dx, dy)
    if (len > 0) {
      const nx = (-dy / len) * 4
      const ny = (dx / len) * 4
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

function drawEllipse(points: Point2D[], color: string, lineWidth: number, isSelected: boolean) {
  if (!ctx || points.length < 2) return
  const s1 = toScreen(points[0]!)
  const s2 = toScreen(points[1]!)
  const cx = (s1.x + s2.x) / 2
  const cy = (s1.y + s2.y) / 2
  const rx = Math.abs(s2.x - s1.x) / 2
  const ry = Math.abs(s2.y - s1.y) / 2

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawRevcloud(points: Point2D[], color: string, lineWidth: number, isSelected: boolean) {
  if (!ctx || points.length < 2) return
  const s1 = toScreen(points[0]!)
  const s2 = toScreen(points[1]!)
  const x = Math.min(s1.x, s2.x)
  const y = Math.min(s1.y, s2.y)
  const w = Math.abs(s2.x - s1.x)
  const h = Math.abs(s2.y - s1.y)

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()

  // 구름형 — 사각형 경계를 따라 반원 아크로 구성
  const arcSize = 12
  // 상단 (좌→우)
  for (let px = x; px < x + w; px += arcSize) {
    const endX = Math.min(px + arcSize, x + w)
    ctx.arc((px + endX) / 2, y, (endX - px) / 2, Math.PI, 0)
  }
  // 우측 (상→하)
  for (let py = y; py < y + h; py += arcSize) {
    const endY = Math.min(py + arcSize, y + h)
    ctx.arc(x + w, (py + endY) / 2, (endY - py) / 2, -Math.PI / 2, Math.PI / 2)
  }
  // 하단 (우→좌)
  for (let px = x + w; px > x; px -= arcSize) {
    const endX = Math.max(px - arcSize, x)
    ctx.arc((px + endX) / 2, y + h, (px - endX) / 2, 0, Math.PI)
  }
  // 좌측 (하→상)
  for (let py = y + h; py > y; py -= arcSize) {
    const endY = Math.max(py - arcSize, y)
    ctx.arc(x, (py + endY) / 2, (py - endY) / 2, Math.PI / 2, -Math.PI / 2)
  }

  ctx.stroke()

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6)
    ctx.setLineDash([])
  }
}

function drawLeader(markup: MarkupEntity, isSelected: boolean) {
  if (!ctx || markup.points.length < 2) return
  const s1 = toScreen(markup.points[0]!)
  const s2 = toScreen(markup.points[1]!)

  // 지시선 (화살표 + 꺾임선 + 텍스트)
  ctx.strokeStyle = markup.style.color
  ctx.lineWidth = markup.style.lineWidth
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(s2.x, s2.y)
  // 수평 연장선
  const extendDir = s2.x >= s1.x ? 1 : -1
  const extendLen = 30
  ctx.lineTo(s2.x + extendDir * extendLen, s2.y)
  ctx.stroke()

  // 화살표 머리 (시작점 방향)
  const angle = Math.atan2(s1.y - s2.y, s1.x - s2.x)
  const headLen = 10
  ctx.fillStyle = markup.style.color
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(
    s1.x - headLen * Math.cos(angle - Math.PI / 6),
    s1.y - headLen * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    s1.x - headLen * Math.cos(angle + Math.PI / 6),
    s1.y - headLen * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fill()

  // 텍스트
  if (markup.text) {
    const fontSize = markup.style.fontSize ?? 14
    ctx.font = `${fontSize}px "Inter", "Noto Sans KR", sans-serif`
    ctx.fillStyle = markup.style.color
    ctx.textAlign = extendDir > 0 ? 'left' : 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(markup.text, s2.x + extendDir * (extendLen + 4), s2.y - 4)
  }

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    const minX = Math.min(s1.x, s2.x + extendDir * extendLen) - 4
    const minY = Math.min(s1.y, s2.y) - 20
    const maxX = Math.max(s1.x, s2.x + extendDir * extendLen) + 4
    const maxY = Math.max(s1.y, s2.y) + 4
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
    ctx.setLineDash([])
  }
}

function drawFreehand(points: Point2D[], color: string, lineWidth: number, isSelected: boolean) {
  if (!ctx || points.length < 2) return

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  const s0 = toScreen(points[0]!)
  ctx.moveTo(s0.x, s0.y)
  for (let i = 1; i < points.length; i++) {
    const s = toScreen(points[i]!)
    ctx.lineTo(s.x, s.y)
  }
  ctx.stroke()

  if (isSelected) {
    ctx.strokeStyle = '#60A5FA'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    // 바운딩 박스
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of points) {
      const s = toScreen(p)
      minX = Math.min(minX, s.x)
      minY = Math.min(minY, s.y)
      maxX = Math.max(maxX, s.x)
      maxY = Math.max(maxY, s.y)
    }
    ctx.strokeRect(minX - 3, minY - 3, maxX - minX + 6, maxY - minY + 6)
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
    case 'line':
    case 'ellipse':
    case 'revcloud':
      if (pts.length === 1) {
        const s = toScreen(pts[0]!)
        drawEndpoint(s)
      }
      break
    case 'leader':
      if (pts.length >= 1) {
        const s = toScreen(pts[0]!)
        drawEndpoint(s)
        if (pts.length === 2) {
          const s2 = toScreen(pts[1]!)
          drawEndpoint(s2)
        }
      }
      break
    case 'freehand':
      // freehand preview is handled in ViewerCanvas directly
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
    markupStore.isVisible,
    props.freehandPoints?.length,
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
