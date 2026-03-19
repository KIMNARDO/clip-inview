/**
 * CAD 엔진 서비스 래퍼
 *
 * @mlightcad/cad-simple-viewer의 AcApDocManager를 래핑하여
 * 앱 전체에서 일관된 인터페이스로 CAD 기능을 제공한다.
 */

import type { Point2D, FileInfo, ICadViewer, Layer, CadEntity, SnapType, SnapResult, BomData, LayoutInfo } from '@/types/cad'
import { MlightcadViewer } from './mlightcadViewer'

/** 스텁용 모의 레이어 데이터 */
const MOCK_LAYERS: Layer[] = [
  { name: '0', visible: true, locked: false, color: '#FFFFFF' },
  { name: 'Dimensions', visible: true, locked: false, color: '#FF0000' },
  { name: 'Center Lines', visible: true, locked: false, color: '#00FF00' },
  { name: 'Hidden Lines', visible: true, locked: false, color: '#FFFF00' },
  { name: 'Section', visible: true, locked: false, color: '#00FFFF' },
  { name: 'Text', visible: true, locked: false, color: '#FF00FF' },
  { name: 'Hatch', visible: true, locked: false, color: '#808080' },
]

/** 스텁용 모의 엔티티 데이터 */
function createMockEntities(): CadEntity[] {
  return [
    // 사각형 (Layer 0)
    { id: 'e1', type: 'line', layer: '0', color: '#FFFFFF', boundingBox: { min: { x: 0, y: 0 }, max: { x: 200, y: 0 } }, points: [{ x: 0, y: 0 }, { x: 200, y: 0 }] },
    { id: 'e2', type: 'line', layer: '0', color: '#FFFFFF', boundingBox: { min: { x: 200, y: 0 }, max: { x: 200, y: 150 } }, points: [{ x: 200, y: 0 }, { x: 200, y: 150 }] },
    { id: 'e3', type: 'line', layer: '0', color: '#FFFFFF', boundingBox: { min: { x: 0, y: 150 }, max: { x: 200, y: 150 } }, points: [{ x: 200, y: 150 }, { x: 0, y: 150 }] },
    { id: 'e4', type: 'line', layer: '0', color: '#FFFFFF', boundingBox: { min: { x: 0, y: 0 }, max: { x: 0, y: 150 } }, points: [{ x: 0, y: 150 }, { x: 0, y: 0 }] },
    // 치수선 (Dimensions)
    { id: 'e5', type: 'line', layer: 'Dimensions', color: '#FF0000', boundingBox: { min: { x: 0, y: -20 }, max: { x: 200, y: -20 } }, points: [{ x: 0, y: -20 }, { x: 200, y: -20 }] },
    // 중심선 (Center Lines)
    { id: 'e6', type: 'line', layer: 'Center Lines', color: '#00FF00', boundingBox: { min: { x: 100, y: -10 }, max: { x: 100, y: 160 } }, points: [{ x: 100, y: -10 }, { x: 100, y: 160 }] },
    // 원 (Center Lines)
    { id: 'e7', type: 'circle', layer: 'Center Lines', color: '#00FF00', boundingBox: { min: { x: 70, y: 45 }, max: { x: 130, y: 105 } }, points: [{ x: 100, y: 75 }] },
    // 히든 라인 (Hidden Lines)
    { id: 'e8', type: 'line', layer: 'Hidden Lines', color: '#FFFF00', boundingBox: { min: { x: 50, y: 50 }, max: { x: 150, y: 100 } }, points: [{ x: 50, y: 50 }, { x: 150, y: 100 }] },
    // 텍스트 (Text)
    { id: 'e9', type: 'text', layer: 'Text', color: '#FF00FF', boundingBox: { min: { x: 60, y: 160 }, max: { x: 140, y: 175 } }, points: [{ x: 60, y: 160 }] },
    // Section
    { id: 'e10', type: 'line', layer: 'Section', color: '#00FFFF', boundingBox: { min: { x: -20, y: 75 }, max: { x: 220, y: 75 } }, points: [{ x: -20, y: 75 }, { x: 220, y: 75 }] },
  ]
}

/** 스텁용 모의 BOM 데이터 */
function createMockBomData(): BomData {
  return {
    nodes: [
      {
        id: 'bom-1',
        partNumber: 'ASM-001',
        name: 'Main Assembly',
        quantity: 1,
        entityIds: ['e1', 'e2', 'e3', 'e4'],
        children: [
          {
            id: 'bom-1-1',
            partNumber: 'PRT-010',
            name: 'Base Plate',
            quantity: 1,
            entityIds: ['e1', 'e2', 'e3', 'e4'],
            children: [],
          },
          {
            id: 'bom-1-2',
            partNumber: 'PRT-020',
            name: 'Center Shaft',
            quantity: 2,
            entityIds: ['e6', 'e7'],
            children: [],
          },
          {
            id: 'bom-1-3',
            partNumber: 'PRT-030',
            name: 'Cross Brace',
            quantity: 1,
            entityIds: ['e8'],
            children: [],
          },
        ],
      },
    ],
    totalParts: 5,
  }
}

/**
 * Canvas2D 기반 스텁 뷰어
 *
 * 실제 @mlightcad 뷰어 컴포넌트를 사용할 수 없거나
 * 단위 테스트 시 대체로 사용하는 경량 구현.
 */
export class StubCadViewer implements ICadViewer {
  private _container: HTMLElement | null = null
  private _canvas: HTMLCanvasElement | null = null
  private _ctx: CanvasRenderingContext2D | null = null
  private _zoomLevel = 100
  private _panX = 0
  private _panY = 0
  private _isDragging = false
  private _lastMouseX = 0
  private _lastMouseY = 0
  private _resizeObserver: ResizeObserver | null = null
  private _animationFrameId: number | null = null
  private _layers: Layer[] = []
  private _entities: CadEntity[] = []
  private _fileLoaded = false
  private _currentLayout = 'Model'
  private _layouts: LayoutInfo[] = []

  onMouseMove?: (worldPos: Point2D) => void
  onZoomChange?: (level: number) => void
  onLayoutChanged?: (name: string) => void

  async initialize(container: HTMLElement): Promise<void> {
    this._container = container

    this._canvas = document.createElement('canvas')
    this._canvas.style.width = '100%'
    this._canvas.style.height = '100%'
    this._canvas.style.display = 'block'
    container.appendChild(this._canvas)

    this._ctx = this._canvas.getContext('2d')

    this._resizeCanvas()

    this._resizeObserver = new ResizeObserver(() => {
      this._resizeCanvas()
      this._render()
    })
    this._resizeObserver.observe(container)

    this._canvas.addEventListener('mousemove', this._onMouseMove)
    this._canvas.addEventListener('mousedown', this._onMouseDown)
    this._canvas.addEventListener('mouseup', this._onMouseUp)
    this._canvas.addEventListener('mouseleave', this._onMouseUp)
    this._canvas.addEventListener('wheel', this._onWheel, { passive: false })

    this._render()
  }

  async loadFile(_file: File): Promise<boolean> {
    this._panX = 0
    this._panY = 0
    this._zoomLevel = 100
    this._layers = MOCK_LAYERS.map((l) => ({ ...l }))
    this._entities = createMockEntities()
    this._layouts = [
      { name: 'Model', type: 'Model', tabOrder: 0 },
      { name: 'Layout1', type: 'Paper', tabOrder: 1 },
      { name: 'Layout2', type: 'Paper', tabOrder: 2 },
    ]
    this._currentLayout = 'Model'
    this._fileLoaded = true
    this._render()
    return true
  }

  fitToExtents(): void {
    this._panX = 0
    this._panY = 0
    this._zoomLevel = 100
    this.onZoomChange?.(this._zoomLevel)
    this._render()
  }

  pan(dx: number, dy: number): void {
    this._panX += dx
    this._panY += dy
    this._render()
  }

  zoom(factor: number, _centerX?: number, _centerY?: number): void {
    this._zoomLevel = Math.max(1, Math.min(6400, this._zoomLevel * factor))
    this.onZoomChange?.(this._zoomLevel)
    this._render()
  }

  getZoomLevel(): number {
    return this._zoomLevel
  }

  getWorldCoords(screenX: number, screenY: number): Point2D {
    if (!this._canvas) return { x: 0, y: 0 }
    const rect = this._canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const cx = this._canvas.width / (2 * dpr)
    const cy = this._canvas.height / (2 * dpr)
    const scale = this._zoomLevel / 100

    const sx = (screenX - rect.left) * (this._canvas.width / rect.width) / dpr
    const sy = (screenY - rect.top) * (this._canvas.height / rect.height) / dpr

    const x = (sx - cx - this._panX) / scale
    const y = -((sy - cy - this._panY) / scale)

    return { x, y }
  }

  getScreenCoords(worldX: number, worldY: number): Point2D {
    if (!this._canvas) return { x: 0, y: 0 }
    const dpr = window.devicePixelRatio || 1
    const cx = this._canvas.width / (2 * dpr)
    const cy = this._canvas.height / (2 * dpr)
    const scale = this._zoomLevel / 100

    const sx = worldX * scale + cx + this._panX
    const sy = -worldY * scale + cy + this._panY

    return { x: sx, y: sy }
  }

  // --- M2: 레이어 관리 ---

  getLayers(): Layer[] {
    return this._layers.map((l) => ({ ...l }))
  }

  setLayerVisibility(layerName: string, visible: boolean): void {
    const layer = this._layers.find((l) => l.name === layerName)
    if (layer) {
      layer.visible = visible
      this._render()
    }
  }

  getEntities(): CadEntity[] {
    return this._entities.filter((e) => {
      const layer = this._layers.find((l) => l.name === e.layer)
      return layer ? layer.visible : true
    })
  }

  getSnapPoint(worldX: number, worldY: number, snapTypes: SnapType[]): SnapResult | null {
    if (!this._fileLoaded) return null
    const threshold = 15 / (this._zoomLevel / 100)
    let closest: SnapResult | null = null
    let closestDist = threshold

    const visibleEntities = this.getEntities()

    for (const entity of visibleEntities) {
      if (snapTypes.includes('endpoint')) {
        for (const pt of entity.points) {
          const dist = Math.hypot(pt.x - worldX, pt.y - worldY)
          if (dist < closestDist) {
            closestDist = dist
            closest = { point: { ...pt }, type: 'endpoint', entityId: entity.id }
          }
        }
      }

      if (snapTypes.includes('midpoint') && entity.points.length >= 2) {
        const mx = (entity.points[0]!.x + entity.points[1]!.x) / 2
        const my = (entity.points[0]!.y + entity.points[1]!.y) / 2
        const dist = Math.hypot(mx - worldX, my - worldY)
        if (dist < closestDist) {
          closestDist = dist
          closest = { point: { x: mx, y: my }, type: 'midpoint', entityId: entity.id }
        }
      }

      if (snapTypes.includes('center') && entity.type === 'circle' && entity.points.length >= 1) {
        const center = entity.points[0]!
        const dist = Math.hypot(center.x - worldX, center.y - worldY)
        if (dist < closestDist) {
          closestDist = dist
          closest = { point: { ...center }, type: 'center', entityId: entity.id }
        }
      }
    }

    return closest
  }

  setViewMode(_mode: 'select' | 'pan'): void { /* stub */ }

  // --- Layout ---
  getLayouts(): LayoutInfo[] {
    return this._layouts.map((l) => ({ ...l }))
  }

  switchLayout(name: string): boolean {
    const layout = this._layouts.find((l) => l.name === name)
    if (!layout) return false
    this._currentLayout = name
    this.onLayoutChanged?.(name)
    this._render()
    return true
  }

  getCurrentLayoutName(): string {
    return this._currentLayout
  }

  // --- 엔진 내장 측정 (스텁: no-op) ---
  addMeasurementLine(_id: string, _p1: Point2D, _p2: Point2D, _color?: string): void { /* stub */ }
  addMeasurementArc(_id: string, _center: Point2D, _radius: number, _startAngle: number, _endAngle: number, _color?: string): void { /* stub */ }
  addMeasurementText(_id: string, _position: Point2D, _text: string, _height?: number, _color?: string): void { /* stub */ }
  addMeasurementPolygon(_id: string, _points: Point2D[], _color?: string): void { /* stub */ }
  removeMeasurementEntity(_id: string): void { /* stub */ }
  clearMeasurementEntities(): void { /* stub */ }

  dispose(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId)
    }
    if (this._canvas) {
      this._canvas.removeEventListener('mousemove', this._onMouseMove)
      this._canvas.removeEventListener('mousedown', this._onMouseDown)
      this._canvas.removeEventListener('mouseup', this._onMouseUp)
      this._canvas.removeEventListener('mouseleave', this._onMouseUp)
      this._canvas.removeEventListener('wheel', this._onWheel)
    }
    this._resizeObserver?.disconnect()
    if (this._canvas && this._container) {
      this._container.removeChild(this._canvas)
    }
    this._canvas = null
    this._ctx = null
    this._container = null
    this._layers = []
    this._entities = []
    this._fileLoaded = false
  }

  // --- Private methods ---

  private _resizeCanvas(): void {
    if (!this._canvas || !this._container) return
    const dpr = window.devicePixelRatio || 1
    const w = this._container.clientWidth
    const h = this._container.clientHeight
    this._canvas.width = w * dpr
    this._canvas.height = h * dpr
    this._ctx?.scale(dpr, dpr)
  }

  private _render(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId)
    }
    this._animationFrameId = requestAnimationFrame(() => {
      this._drawFrame()
    })
  }

  private _drawFrame(): void {
    const ctx = this._ctx
    const canvas = this._canvas
    if (!ctx || !canvas) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    const cx = w / 2 + this._panX
    const cy = h / 2 + this._panY
    const scale = this._zoomLevel / 100

    ctx.translate(cx, cy)
    ctx.scale(scale, scale)

    this._drawGrid(ctx, w, h, scale)
    this._drawAxes(ctx, w, h, scale)

    if (this._fileLoaded) {
      this._drawEntities(ctx, scale)
    }

    ctx.restore()
  }

  private _drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number): void {
    const gridSize = 50
    const halfW = w / 2 / scale
    const halfH = h / 2 / scale

    const startX = Math.floor(-halfW / gridSize) * gridSize
    const endX = Math.ceil(halfW / gridSize) * gridSize
    const startY = Math.floor(-halfH / gridSize) * gridSize
    const endY = Math.ceil(halfH / gridSize) * gridSize

    ctx.strokeStyle = '#2A2A2A'
    ctx.lineWidth = 0.5 / scale
    ctx.beginPath()

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, -halfH)
      ctx.lineTo(x, halfH)
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(-halfW, y)
      ctx.lineTo(halfW, y)
    }

    ctx.stroke()
  }

  private _drawAxes(ctx: CanvasRenderingContext2D, _w: number, _h: number, scale: number): void {
    const axisLen = 1000000

    ctx.strokeStyle = '#E94560'
    ctx.lineWidth = 1 / scale
    ctx.beginPath()
    ctx.moveTo(-axisLen, 0)
    ctx.lineTo(axisLen, 0)
    ctx.stroke()

    ctx.strokeStyle = '#4CAF50'
    ctx.beginPath()
    ctx.moveTo(0, -axisLen)
    ctx.lineTo(0, axisLen)
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, 0, 3 / scale, 0, Math.PI * 2)
    ctx.fill()
  }

  private _drawEntities(ctx: CanvasRenderingContext2D, scale: number): void {
    for (const entity of this._entities) {
      const layer = this._layers.find((l) => l.name === entity.layer)
      if (layer && !layer.visible) continue

      ctx.strokeStyle = entity.color
      ctx.lineWidth = 1 / scale

      if (entity.type === 'line' && entity.points.length >= 2) {
        ctx.beginPath()
        // Y 반전: CAD 좌표계 (Y up) → 캔버스 (Y down)
        ctx.moveTo(entity.points[0]!.x, -entity.points[0]!.y)
        ctx.lineTo(entity.points[1]!.x, -entity.points[1]!.y)
        ctx.stroke()
      } else if (entity.type === 'circle' && entity.points.length >= 1) {
        const center = entity.points[0]!
        const radius = (entity.boundingBox.max.x - entity.boundingBox.min.x) / 2
        ctx.beginPath()
        ctx.arc(center.x, -center.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  private _onMouseMove = (e: MouseEvent): void => {
    if (this._isDragging && this._canvas) {
      const dx = e.clientX - this._lastMouseX
      const dy = e.clientY - this._lastMouseY
      this._lastMouseX = e.clientX
      this._lastMouseY = e.clientY
      this.pan(dx, dy)
    }

    const worldPos = this.getWorldCoords(e.clientX, e.clientY)
    this.onMouseMove?.(worldPos)
  }

  private _onMouseDown = (e: MouseEvent): void => {
    if (e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey))) {
      this._isDragging = true
      this._lastMouseX = e.clientX
      this._lastMouseY = e.clientY
      e.preventDefault()
    }
  }

  private _onMouseUp = (): void => {
    this._isDragging = false
  }

  private _onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    this.zoom(factor, e.clientX, e.clientY)
  }
}

/**
 * CadEngine — 앱 전체에서 사용하는 CAD 엔진 서비스
 */
export class CadEngine {
  private _viewer: ICadViewer | null = null
  private _container: HTMLElement | null = null
  private _fileInfo: FileInfo | null = null
  private _isFileLoaded = false

  get container(): HTMLElement | null {
    return this._container
  }

  get viewer(): ICadViewer | null {
    return this._viewer
  }

  get fileInfo(): FileInfo | null {
    return this._fileInfo
  }

  get isFileLoaded(): boolean {
    return this._isFileLoaded
  }

  async initialize(container: HTMLElement, viewer?: ICadViewer): Promise<void> {
    this._container = container
    this._viewer = viewer ?? new MlightcadViewer()
    await this._viewer.initialize(container)
  }

  async loadFile(file: File): Promise<boolean> {
    if (!this._viewer) {
      throw new Error('CadEngine이 초기화되지 않았습니다')
    }

    this._fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type || this._detectFileType(file.name),
      lastModified: file.lastModified,
    }

    const success = await this._viewer.loadFile(file)
    this._isFileLoaded = success
    return success
  }

  fitToExtents(): void {
    this._viewer?.fitToExtents()
  }

  getZoomLevel(): number {
    return this._viewer?.getZoomLevel() ?? 100
  }

  getWorldCoords(screenX: number, screenY: number): Point2D {
    return this._viewer?.getWorldCoords(screenX, screenY) ?? { x: 0, y: 0 }
  }

  getScreenCoords(worldX: number, worldY: number): Point2D {
    return this._viewer?.getScreenCoords(worldX, worldY) ?? { x: 0, y: 0 }
  }

  getLayers(): Layer[] {
    return this._viewer?.getLayers() ?? []
  }

  setLayerVisibility(layerName: string, visible: boolean): void {
    this._viewer?.setLayerVisibility(layerName, visible)
  }

  getEntities(): CadEntity[] {
    return this._viewer?.getEntities() ?? []
  }

  getSnapPoint(worldX: number, worldY: number, snapTypes: SnapType[]): SnapResult | null {
    return this._viewer?.getSnapPoint(worldX, worldY, snapTypes) ?? null
  }

  setViewMode(mode: 'select' | 'pan'): void {
    this._viewer?.setViewMode(mode)
  }

  // --- Layout 프록시 ---
  getLayouts(): LayoutInfo[] {
    return this._viewer?.getLayouts() ?? []
  }

  switchLayout(name: string): boolean {
    return this._viewer?.switchLayout(name) ?? false
  }

  getCurrentLayoutName(): string {
    return this._viewer?.getCurrentLayoutName() ?? 'Model'
  }

  // --- 엔진 내장 측정 렌더링 프록시 ---
  addMeasurementLine(id: string, p1: Point2D, p2: Point2D, color?: string): void {
    this._viewer?.addMeasurementLine(id, p1, p2, color)
  }
  addMeasurementArc(id: string, center: Point2D, radius: number, startAngle: number, endAngle: number, color?: string): void {
    this._viewer?.addMeasurementArc(id, center, radius, startAngle, endAngle, color)
  }
  addMeasurementText(id: string, position: Point2D, text: string, height?: number, color?: string): void {
    this._viewer?.addMeasurementText(id, position, text, height, color)
  }
  addMeasurementPolygon(id: string, points: Point2D[], color?: string): void {
    this._viewer?.addMeasurementPolygon(id, points, color)
  }
  removeMeasurementEntity(id: string): void {
    this._viewer?.removeMeasurementEntity(id)
  }
  clearMeasurementEntities(): void {
    this._viewer?.clearMeasurementEntities()
  }

  getBomData(): BomData {
    if (!this._isFileLoaded) return { nodes: [], totalParts: 0 }
    return createMockBomData()
  }

  dispose(): void {
    this._viewer?.dispose()
    this._viewer = null
    this._container = null
    this._fileInfo = null
    this._isFileLoaded = false
  }

  private _detectFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'dwg') return 'application/acad'
    if (ext === 'dxf') return 'application/dxf'
    return 'application/octet-stream'
  }
}
