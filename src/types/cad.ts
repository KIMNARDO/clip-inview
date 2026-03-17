/**
 * CAD 관련 타입 정의
 */

export interface Point2D {
  x: number
  y: number
}

export interface Point3D extends Point2D {
  z: number
}

export interface BoundingBox {
  min: Point2D
  max: Point2D
}

export interface Layer {
  name: string
  visible: boolean
  locked: boolean
  color: string
}

export interface CadEntity {
  id: string
  type: string
  layer: string
  color: string
  boundingBox: BoundingBox
  /** 엔티티의 핵심 포인트 (선분 끝점, 원 중심 등) */
  points: Point2D[]
}

export type ViewerTool =
  | 'select'
  | 'pan'
  | 'zoom-window'
  | 'zoom-extents'
  | 'fit'
  | 'measure-distance'
  | 'measure-area'
  | 'measure-angle'
  | 'markup-text'
  | 'markup-rect'
  | 'markup-circle'
  | 'markup-arrow'

export type MeasureMode = 'distance' | 'area' | 'angle'

export type SnapType = 'endpoint' | 'midpoint' | 'center' | 'intersection'

export interface SnapResult {
  point: Point2D
  type: SnapType
  entityId?: string
}

export interface MeasurementResult {
  id: string
  type: MeasureMode
  points: Point2D[]
  value: number
  unit: string
}

/** 로드된 파일 정보 */
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

/** CAD 뷰어 인터페이스 — 실제 엔진이나 스텁이 이 인터페이스를 구현 */
export interface ICadViewer {
  initialize(container: HTMLElement): Promise<void>
  loadFile(file: File): Promise<boolean>
  fitToExtents(): void
  pan(dx: number, dy: number): void
  zoom(factor: number, centerX?: number, centerY?: number): void
  getZoomLevel(): number
  getWorldCoords(screenX: number, screenY: number): Point2D
  getScreenCoords(worldX: number, worldY: number): Point2D
  dispose(): void
  onMouseMove?: (worldPos: Point2D) => void
  onZoomChange?: (level: number) => void

  // M2: 레이어 관리
  getLayers(): Layer[]
  setLayerVisibility(layerName: string, visible: boolean): void

  // M2: 엔티티 쿼리
  getEntities(): CadEntity[]

  // M2: 스냅
  getSnapPoint(worldX: number, worldY: number, snapTypes: SnapType[]): SnapResult | null
}

// ─── M3: 마크업 타입 ───

export type MarkupType = 'text' | 'rect' | 'circle' | 'arrow'

export interface MarkupStyle {
  color: string
  lineWidth: number
  fontSize?: number
  fillColor?: string
  opacity?: number
}

export interface MarkupEntity {
  id: string
  type: MarkupType
  /** 월드 좌표 기준 포인트 */
  points: Point2D[]
  /** 텍스트 마크업의 내용 */
  text?: string
  style: MarkupStyle
  createdAt: number
}

/** 마크업 데이터 JSON 직렬화 형식 */
export interface MarkupData {
  version: string
  fileName: string
  markups: MarkupEntity[]
  createdAt: number
  updatedAt: number
}

// ─── M3: BOM 타입 ───

export interface BomNode {
  id: string
  partNumber: string
  name: string
  quantity: number
  /** 해당 부품의 CAD 엔티티 ID 목록 */
  entityIds: string[]
  children: BomNode[]
}

export interface BomData {
  nodes: BomNode[]
  totalParts: number
}
