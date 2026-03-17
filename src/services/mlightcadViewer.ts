/**
 * @mlightcad/cad-simple-viewer 기반 실제 DWG/DXF 뷰어 구현
 *
 * AcApDocManager → AcTrView2d 를 래핑하여
 * ICadViewer 인터페이스를 실제 CAD 엔진에 연결한다.
 */

import { AcApDocManager } from '@mlightcad/cad-simple-viewer'
import type { AcDbLayerTableRecord } from '@mlightcad/data-model'
import type { Point2D, Layer, CadEntity, SnapType, SnapResult, ICadViewer } from '@/types/cad'

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

export class MlightcadViewer implements ICadViewer {
  private _docManager: AcApDocManager | null = null
  private _container: HTMLElement | null = null
  private _fileLoaded = false
  private _lastZoom = 100

  onMouseMove?: (worldPos: Point2D) => void
  onZoomChange?: (level: number) => void

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

    // 기본 폰트 로드 (실패해도 뷰잉 가능)
    try {
      await mgr.loadDefaultFonts()
    } catch (e) {
      console.warn('[MlightcadViewer] 기본 폰트 로드 실패 (무시):', e)
    }

    // mouseMove 이벤트 연결 — 월드 좌표 실시간 전달
    mgr.curView.events.mouseMove.addEventListener((args) => {
      this.onMouseMove?.({ x: args.x, y: args.y })
    })

    // viewChanged 이벤트 — 줌 레벨 변화 감지
    mgr.curView.events.viewChanged.addEventListener(() => {
      this.onZoomChange?.(this.getZoomLevel())
    })

    console.log('[MlightcadViewer] 초기화 완료')
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

  pan(_dx: number, _dy: number): void {
    // @mlightcad가 내부적으로 마우스 드래그 pan을 처리함
    // 외부 호출이 필요한 경우 curView.center 조정으로 구현 가능
  }

  zoom(_factor: number, _centerX?: number, _centerY?: number): void {
    // @mlightcad가 내부적으로 휠 줌을 처리함
    // 프로그래밍 방식 줌은 zoomTo로 구현 가능
  }

  getZoomLevel(): number {
    if (!this._docManager) return 100
    try {
      // bbox 기반 줌 레벨 추정
      const view = this._docManager.curView
      const bbox = view.bbox
      if (bbox) {
        const bboxWidth = bbox.maxPoint.x - bbox.minPoint.x
        const viewWidth = view.width
        if (bboxWidth > 0 && viewWidth > 0) {
          this._lastZoom = Math.round((viewWidth / bboxWidth) * 100)
        }
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

  // ─── 정리 ───

  dispose(): void {
    if (this._docManager) {
      this._docManager.destroy()
      this._docManager = null
    }
    this._container = null
    this._fileLoaded = false
  }

  // ─── private ───

  private _rebindViewEvents(): void {
    if (!this._docManager) return
    const view = this._docManager.curView

    view.events.mouseMove.addEventListener((args) => {
      this.onMouseMove?.({ x: args.x, y: args.y })
    })

    view.events.viewChanged.addEventListener(() => {
      this.onZoomChange?.(this.getZoomLevel())
    })
  }
}
