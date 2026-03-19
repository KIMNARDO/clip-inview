/**
 * @mlightcad/cad-simple-viewer 기반 실제 DWG/DXF 뷰어 구현
 *
 * AcApDocManager → AcTrView2d 를 래핑하여
 * ICadViewer 인터페이스를 실제 CAD 엔진에 연결한다.
 */

import { AcApDocManager } from '@mlightcad/cad-simple-viewer'
import type { AcDbLayerTableRecord } from '@mlightcad/data-model'
import { AcDbLine, AcDbArc, AcDbPolyline, AcCmColor } from '@mlightcad/data-model'
import type { Point2D, Layer, CadEntity, SnapType, SnapResult, ICadViewer, LayoutInfo, DocumentWarning } from '@/types/cad'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPoint = any

/** Point2D → {x, y, z} for AcGePoint3dLike (런타임에 plain object로 전달 가능) */
function pt3(p: Point2D): AnyPoint { return { x: p.x, y: p.y, z: 0 } }
/** Point2D → {x, y} for AcGePoint2d */
function pt2(p: Point2D): AnyPoint { return { x: p.x, y: p.y } }

/** AcCmColor → CSS hex 변환 (fallback: white) */
function colorToHex(color: unknown): string {
  try {
    const c = color as { red?: number; green?: number; blue?: number; colorIndex?: number }
    if (typeof c.red === 'number' && typeof c.green === 'number' && typeof c.blue === 'number') {
      const r = c.red.toString(16).padStart(2, '0')
      const g = c.green.toString(16).padStart(2, '0')
      const b = c.blue.toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }
    // AutoCAD color index fallback
    if (typeof c.colorIndex === 'number') {
      return ACI_COLORS[c.colorIndex] ?? '#FFFFFF'
    }
  } catch { /* ignore */ }
  return '#FFFFFF'
}

/** AutoCAD Color Index (ACI) 주요 색상 매핑 */
const ACI_COLORS: Record<number, string> = {
  0: '#000000', 1: '#FF0000', 2: '#FFFF00', 3: '#00FF00',
  4: '#00FFFF', 5: '#0000FF', 6: '#FF00FF', 7: '#FFFFFF',
  8: '#808080', 9: '#C0C0C0',
}

/** CSS hex → AcCmColor 변환 */
function hexToAcCmColor(hex: string): AcCmColor {
  const color = new AcCmColor()
  color.setRGBFromCss(hex)
  return color
}

export class MlightcadViewer implements ICadViewer {
  private _docManager: AcApDocManager | null = null
  private _container: HTMLElement | null = null
  private _fileLoaded = false
  private _lastZoom = 100
  /** transient entity ID → objectId 매핑 (측정 엔티티 관리) */
  private _measureEntities = new Map<string, string[]>()

  onMouseMove?: (worldPos: Point2D) => void
  onZoomChange?: (level: number) => void
  onSelectionChanged?: (entityIds: string[]) => void
  onLayoutChanged?: (name: string) => void
  onDocumentWarning?: (warning: DocumentWarning) => void

  // ─── 초기화 ───

  async initialize(container: HTMLElement): Promise<void> {
    this._container = container
    const mgr = AcApDocManager.createInstance({
      container,
      autoResize: true,
      baseUrl: 'https://mlightcad.gitlab.io/cad-data/',
      webworkerFileUrls: {
        dwgParser: '/workers/libredwg-parser-worker.js',
        mtextRender: '/workers/mtext-renderer-worker.js',
      },
    })

    if (!mgr) {
      throw new Error('AcApDocManager 인스턴스 생성 실패')
    }

    this._docManager = mgr

    // 유니코드 지원 TTF 폰트만 프리로드 — SHX는 로드하지 않아서
    // DWG의 txt.shx 요청 시 자동으로 defaultFont(simkai)로 폴백되게 함
    // simkai는 CJK + 라틴 + 특수문자 모두 지원
    try {
      await mgr.loadDefaultFonts(['simkai'])
      console.log('[MlightcadViewer] 기본 폰트(simkai) 로드 완료')
    } catch (e) {
      console.warn('[MlightcadViewer] 폰트 로드 실패:', e)
    }

    // mouseMove 이벤트 연결 — 월드 좌표 실시간 전달
    mgr.curView.events.mouseMove.addEventListener((args) => {
      this.onMouseMove?.({ x: args.x, y: args.y })
    })

    // viewChanged 이벤트 — 줌 레벨 변화 감지
    mgr.curView.events.viewChanged.addEventListener(() => {
      this.onZoomChange?.(this.getZoomLevel())
    })

    // WebGL context lost 감지 — 대용량 도면에서 GPU 메모리 부족 시 사용자 알림
    this._setupWebGLMonitoring()

    if (import.meta.env.DEV) console.debug('[MlightcadViewer] 초기화 완료')
  }

  // ─── 파일 로드 ───

  async loadFile(file: File): Promise<boolean> {
    if (!this._docManager) return false

    try {
      console.log(`[MlightcadViewer] 파일 로드 시작: ${file.name} (${file.size} bytes)`)

      const buffer = await file.arrayBuffer()
      const success = await this._docManager.openDocument(file.name, buffer, {})
      console.log(`[MlightcadViewer] openDocument 결과: ${success}`)

      if (success) {
        this._fileLoaded = true

        // 문서에서 필요한데 로드되지 않은 폰트 감지 후 동적 로드 + regen
        await this._loadMissedFonts()

        // 문서 품질 분석 — DWG 텍스트 깨짐 등 사용자에게 경고
        this._analyzeDocument(file.name)

        // mouseMove/viewChanged 이벤트 재등록 (openDocument로 뷰가 재생성될 수 있음)
        this._rebindViewEvents()

        // Fit to extents
        this._docManager.curView.zoomToFitDrawing(3000)
      }

      return success
    } catch (err) {
      console.error('[MlightcadViewer] 파일 로드 실패:', err)
      return false
    }
  }

  // ─── 네비게이션 ───

  fitToExtents(): void {
    if (!this._docManager) return
    this._docManager.curView.zoomToFitDrawing()
  }

  pan(dx: number, dy: number): void {
    if (!this._docManager) return
    try {
      const view = this._docManager.curView
      // 현재 뷰 중심을 화면 좌표 기준으로 이동
      const center = view.worldToScreen(view.center)
      const newCenter = view.screenToWorld({ x: center.x - dx, y: center.y - dy })
      // NaN/Infinity 보호 — 캔버스 크기 0 등으로 좌표 변환 실패 시 뷰 상태 보존
      if (!isFinite(newCenter.x) || !isFinite(newCenter.y)) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(view as any).center = { x: newCenter.x, y: newCenter.y }
      view.isDirty = true
    } catch (err) {
      console.warn('[MlightcadViewer] pan 실패:', err)
    }
  }

  zoom(_factor: number, _centerX?: number, _centerY?: number): void {
    // @mlightcad가 내부적으로 휠 줌을 처리함
    // 프로그래밍 방식 줌은 zoomTo로 구현 가능
  }

  resize(): void {
    // mlightcad의 autoResize는 window resize 이벤트만 감지하므로
    // CSS Grid 레이아웃 변경 시 수동으로 이벤트를 디스패치하여 캔버스 리사이즈를 트리거한다
    window.dispatchEvent(new Event('resize'))
  }

  setViewMode(_mode: 'select' | 'pan'): void {
    // mlightcad는 항상 PAN 모드 유지 — SELECTION 모드는 내부적으로 캔버스를 DOM에서 분리하여
    // 도면이 사라지는 버그를 유발함. 선택/클릭은 ViewerCanvas에서 자체 처리.
  }

  getZoomLevel(): number {
    if (!this._docManager) return 100
    try {
      const view = this._docManager.curView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = view as any
      // 다양한 방법으로 뷰 영역 크기 추정
      const viewWidth = view.width
      let worldWidth = 0

      // 방법 1: bbox 속성
      if (v.bbox) {
        worldWidth = v.bbox.maxPoint.x - v.bbox.minPoint.x
      }
      // 방법 2: screenToWorld 좌표 변환으로 추정
      if (worldWidth <= 0 && viewWidth > 0) {
        try {
          const left = view.screenToWorld({ x: 0, y: 0 })
          const right = view.screenToWorld({ x: viewWidth, y: 0 })
          worldWidth = Math.abs(right.x - left.x)
        } catch { /* ignore */ }
      }

      if (worldWidth > 0 && viewWidth > 0) {
        this._lastZoom = Math.round((viewWidth / worldWidth) * 100)
      }
    } catch { /* ignore */ }
    return this._lastZoom
  }

  // ─── 좌표 변환 ───

  getWorldCoords(screenX: number, screenY: number): Point2D {
    if (!this._docManager) return { x: 0, y: 0 }
    try {
      const view = this._docManager.curView
      // viewport 좌표 → canvas 로컬 좌표 → world 좌표
      const canvasPoint = view.viewportToCanvas({ x: screenX, y: screenY })
      const worldPoint = view.screenToWorld(canvasPoint)
      return { x: worldPoint.x, y: worldPoint.y }
    } catch {
      return { x: 0, y: 0 }
    }
  }

  getScreenCoords(worldX: number, worldY: number): Point2D {
    if (!this._docManager) return { x: 0, y: 0 }
    try {
      const view = this._docManager.curView
      const screenPoint = view.worldToScreen({ x: worldX, y: worldY })
      // canvas 로컬 → viewport 좌표
      const viewportPoint = view.canvasToViewport(screenPoint)
      // viewport 좌표 → 컨테이너 상대 좌표 (오버레이 캔버스 기준)
      if (this._container) {
        const rect = this._container.getBoundingClientRect()
        return { x: viewportPoint.x - rect.left, y: viewportPoint.y - rect.top }
      }
      return { x: viewportPoint.x, y: viewportPoint.y }
    } catch {
      return { x: 0, y: 0 }
    }
  }

  // ─── 레이어 관리 ───

  getLayers(): Layer[] {
    if (!this._docManager || !this._fileLoaded) return []
    try {
      const db = this._docManager.curDocument.database
      const layerTable = db.tables.layerTable
      const iter = layerTable.newIterator()
      const layers: Layer[] = []

      for (const record of iter) {
        layers.push({
          name: record.name,
          visible: !record.isOff && !record.isFrozen,
          locked: record.isLocked,
          color: colorToHex(record.color),
        })
      }
      return layers
    } catch (err) {
      console.warn('[MlightcadViewer] 레이어 조회 실패:', err)
      return []
    }
  }

  setLayerVisibility(layerName: string, visible: boolean): void {
    if (!this._docManager || !this._fileLoaded) return
    try {
      const db = this._docManager.curDocument.database
      const layerTable = db.tables.layerTable
      const layer = layerTable.getAt(layerName) as AcDbLayerTableRecord | undefined
      if (layer) {
        // isOff = true → 보이지 않음, isOff = false → 보임
        const view = this._docManager.curView
        view.updateLayer(layer, { isOff: !visible })
      }
    } catch (err) {
      console.warn('[MlightcadViewer] 레이어 가시성 변경 실패:', err)
    }
  }

  // ─── Layout 전환 ───

  getLayouts(): LayoutInfo[] {
    if (!this._docManager || !this._fileLoaded) return []
    try {
      const db = this._docManager.curDocument.database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layoutMgr = (db as any).layoutManager
      if (!layoutMgr) return [{ name: 'Model', type: 'Model', tabOrder: 0 }]

      const layouts: LayoutInfo[] = []
      const count = layoutMgr.countLayouts()

      for (let i = 0; i < count; i++) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layout = (layoutMgr as any).getLayoutAt?.(i)
          if (layout) {
            const name = layout.layoutName ?? `Layout${i}`
            layouts.push({
              name,
              type: name === 'Model' ? 'Model' : 'Paper',
              tabOrder: layout.tabOrder ?? i,
              blockId: layout.blockTableRecordId,
            })
          }
        } catch { /* skip invalid layout */ }
      }

      // 정렬: Model 먼저, 나머지는 tabOrder 순
      layouts.sort((a, b) => {
        if (a.type === 'Model') return -1
        if (b.type === 'Model') return 1
        return a.tabOrder - b.tabOrder
      })

      return layouts.length > 0 ? layouts : [{ name: 'Model', type: 'Model', tabOrder: 0 }]
    } catch (err) {
      console.warn('[MlightcadViewer] 레이아웃 조회 실패:', err)
      return [{ name: 'Model', type: 'Model', tabOrder: 0 }]
    }
  }

  switchLayout(name: string): boolean {
    if (!this._docManager || !this._fileLoaded) return false
    try {
      const db = this._docManager.curDocument.database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layoutMgr = (db as any).layoutManager
      if (!layoutMgr) return false

      layoutMgr.setCurrentLayout(name)
      this._docManager.curView.zoomToFitDrawing()
      this._rebindViewEvents()
      this.onLayoutChanged?.(name)
      return true
    } catch (err) {
      console.warn('[MlightcadViewer] 레이아웃 전환 실패:', err)
      return false
    }
  }

  getCurrentLayoutName(): string {
    if (!this._docManager || !this._fileLoaded) return 'Model'
    try {
      const db = this._docManager.curDocument.database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layoutMgr = (db as any).layoutManager
      if (!layoutMgr) return 'Model'
      const active = layoutMgr.findActiveLayout?.()
      return active?.layoutName ?? 'Model'
    } catch {
      return 'Model'
    }
  }

  // ─── 엔티티 & 스냅 ───

  getEntities(): CadEntity[] {
    // @mlightcad가 Three.js로 직접 렌더링하므로
    // CadEntity 목록은 pick/search API로 필요 시 추출
    return []
  }

  getSnapPoint(worldX: number, worldY: number, _snapTypes: SnapType[]): SnapResult | null {
    if (!this._docManager || !this._fileLoaded) return null
    try {
      const view = this._docManager.curView
      const results = view.pick({ x: worldX, y: worldY }, 10, true)
      if (results.length > 0) {
        const hit = results[0]!
        return {
          point: { x: worldX, y: worldY },
          type: 'endpoint',
          entityId: String(hit.id),
        }
      }
    } catch { /* ignore */ }
    return null
  }

  // ─── 엔진 내장 측정 렌더링 (transient entity) ───

  addMeasurementLine(id: string, p1: Point2D, p2: Point2D, color = '#3B82F6'): void {
    if (!this._docManager || !this._fileLoaded) return
    try {
      const line = new AcDbLine(pt3(p1), pt3(p2))
      line.color = hexToAcCmColor(color)
      const view = this._docManager.curView
      view.addTransientEntity(line)
      view.isDirty = true
      this._trackEntity(id, line.objectId)
    } catch (err) {
      console.error('[MlightcadViewer] addMeasurementLine 오류:', err)
    }
  }

  addMeasurementArc(id: string, center: Point2D, radius: number, startAngle: number, endAngle: number, color = '#60A5FA'): void {
    if (!this._docManager || !this._fileLoaded) return
    try {
      const arc = new AcDbArc(pt3(center), radius, startAngle, endAngle)
      arc.color = hexToAcCmColor(color)
      const view = this._docManager.curView
      view.addTransientEntity(arc)
      view.isDirty = true
      this._trackEntity(id, arc.objectId)
    } catch (err) {
      console.error('[MlightcadViewer] addMeasurementArc 오류:', err)
    }
  }

  addMeasurementText(_id: string, _position: Point2D, _text: string, _height = 3, _color = '#60A5FA'): void {
    // AcDbText transient entity는 textStyle 미설정으로 항상 실패
    // → 텍스트는 Canvas2D MeasurementOverlay에서 렌더링
  }

  addMeasurementPolygon(id: string, points: Point2D[], color = '#3B82F6'): void {
    if (!this._docManager || !this._fileLoaded || points.length < 2) return
    try {
      const polyline = new AcDbPolyline()
      for (let i = 0; i < points.length; i++) {
        polyline.addVertexAt(i, pt2(points[i]!))
      }
      polyline.closed = true
      polyline.color = hexToAcCmColor(color)
      const view = this._docManager.curView
      view.addTransientEntity(polyline)
      view.isDirty = true
      this._trackEntity(id, polyline.objectId)
    } catch (err) {
      console.error('[MlightcadViewer] addMeasurementPolygon 오류:', err)
    }
  }

  removeMeasurementEntity(id: string): void {
    if (!this._docManager) return
    const objectIds = this._measureEntities.get(id)
    if (objectIds) {
      for (const oid of objectIds) {
        try {
          this._docManager.curView.removeTransientEntity(oid)
        } catch { /* entity may already be removed */ }
      }
      this._measureEntities.delete(id)
    }
  }

  clearMeasurementEntities(): void {
    if (!this._docManager) return
    for (const [id] of this._measureEntities) {
      this.removeMeasurementEntity(id)
    }
    this._measureEntities.clear()
  }

  private _trackEntity(groupId: string, objectId: string): void {
    const ids = this._measureEntities.get(groupId) ?? []
    ids.push(objectId)
    this._measureEntities.set(groupId, ids)
  }

  // ─── 정리 ───

  dispose(): void {
    this.clearMeasurementEntities()
    if (this._docManager) {
      this._docManager.destroy()
      this._docManager = null
    }
    this._fileLoaded = false
  }

  // ─── private ───

  /** 문서 로드 후 누락된 폰트를 감지하여 CDN에서 추가 로드 → regen으로 재렌더링 */
  private async _loadMissedFonts(): Promise<void> {
    if (!this._docManager) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const missed = (this._docManager as any).missedFonts as Record<string, number> | undefined
      if (!missed) return
      const fontNames = Object.keys(missed).filter(f => f && missed[f]! > 0)
      if (fontNames.length === 0) {
        if (import.meta.env.DEV) console.debug('[MlightcadViewer] 누락 폰트 없음')
        return
      }

      if (import.meta.env.DEV) console.debug(`[MlightcadViewer] 누락 폰트 감지: ${fontNames.join(', ')}`)

      try {
        await this._docManager.loadDefaultFonts(fontNames)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(this._docManager as any).regen?.()

        // 폰트 로드 성공했지만 사용자에게 fallback 폰트 사용 중임을 알림
        this.onDocumentWarning?.({
          type: 'missing-fonts',
          message: `도면에서 사용하는 폰트(${fontNames.join(', ')})가 시스템에 없어 대체 폰트로 표시됩니다.`,
          suggestion: '글꼴 모양이 원본과 다를 수 있습니다.',
        })
      } catch (fontErr) {
        if (import.meta.env.DEV) console.warn('[MlightcadViewer] 폰트 로드 실패:', fontErr)
        this.onDocumentWarning?.({
          type: 'font-load-failed',
          message: `폰트(${fontNames.join(', ')}) 로드에 실패했습니다.`,
          suggestion: '텍스트가 기본 폰트로 표시되며, 일부 글자가 깨질 수 있습니다.',
        })
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[MlightcadViewer] 폰트 분석 실패:', e)
    }
  }

  /**
   * 문서 품질 종합 분석 — 잠재적 문제를 감지하여 사용자에게 사전 경고.
   *
   * 감지 항목:
   * 1. Exploded text: DWG에서 TEXT/MTEXT 없이 LINE만 있으면 텍스트 깨짐 가능
   * 2. Empty document: 엔티티가 하나도 없는 빈 도면
   * 3. Large file: 엔티티 수가 매우 많으면 성능 저하 가능
   */
  private _analyzeDocument(fileName: string): void {
    if (!this._docManager) return
    try {
      const db = this._docManager.curDocument.database
      const isDwg = fileName.toLowerCase().endsWith('.dwg')

      const modelSpace = db.tables.blockTable.modelSpace
      if (!modelSpace) return

      let hasTextEntities = false
      let totalEntities = 0
      for (const entity of modelSpace.newIterator()) {
        totalEntities++
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = entity as any
        if (!hasTextEntities && (e.textString || e.contents || e.text)) {
          hasTextEntities = true
        }
        // 대용량 판별을 위해 계속 카운트 (break하지 않음)
      }

      if (import.meta.env.DEV) {
        console.debug(`[MlightcadViewer] 문서 분석: ${totalEntities}개 엔티티, TEXT=${hasTextEntities}, format=${isDwg ? 'DWG' : 'DXF'}`)
      }

      // ① 빈 도면 감지
      if (totalEntities === 0) {
        this.onDocumentWarning?.({
          type: 'empty-document',
          message: '이 파일에 표시할 도면 데이터가 없습니다.',
          suggestion: '파일이 손상되었거나 빈 템플릿일 수 있습니다. 다른 파일을 열어보세요.',
        })
        return // 빈 도면이면 추가 분석 불필요
      }

      // ② DWG exploded text 감지
      if (isDwg && !hasTextEntities && totalEntities > 100) {
        this.onDocumentWarning?.({
          type: 'exploded-text',
          message: '이 DWG 파일의 텍스트가 깨져 보일 수 있습니다.',
          suggestion: 'ODA File Converter로 DXF 형식으로 변환하면 텍스트가 정상적으로 표시됩니다.',
        })
      }

      // ③ 대용량 파일 성능 경고
      const LARGE_ENTITY_THRESHOLD = 100_000
      if (totalEntities > LARGE_ENTITY_THRESHOLD) {
        this.onDocumentWarning?.({
          type: 'large-file',
          message: `대용량 도면입니다 (엔티티 ${totalEntities.toLocaleString()}개). 조작이 느릴 수 있습니다.`,
          suggestion: '확대하여 부분적으로 작업하면 성능이 개선됩니다.',
        })
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[MlightcadViewer] 문서 분석 실패:', e)
    }
  }

  /** WebGL context lost 이벤트 감지 — GPU 메모리 부족 시 사용자에게 경고 */
  private _setupWebGLMonitoring(): void {
    if (!this._container) return
    const canvas = this._container.querySelector('canvas')
    if (!canvas) return

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      this.onDocumentWarning?.({
        type: 'webgl-context-lost',
        message: '그래픽 렌더링이 중단되었습니다 (GPU 메모리 부족).',
        suggestion: '다른 탭을 닫거나 페이지를 새로고침해 주세요.',
      })
    })
  }

  private _rebindViewEvents(): void {
    if (!this._docManager) return
    const view = this._docManager.curView

    view.events.mouseMove.addEventListener((args) => {
      this.onMouseMove?.({ x: args.x, y: args.y })
    })

    view.events.viewChanged.addEventListener(() => {
      this.onZoomChange?.(this.getZoomLevel())
    })

    // 선택 이벤트 연결
    view.selectionSet.events.selectionAdded.addEventListener(() => {
      this.onSelectionChanged?.(view.selectionSet.ids)
    })
    view.selectionSet.events.selectionRemoved.addEventListener(() => {
      this.onSelectionChanged?.(view.selectionSet.ids)
    })
  }
}
