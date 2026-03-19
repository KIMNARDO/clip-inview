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
  | 'measure-coordinate'
  | 'measure-point-to-line'
  | 'measure-arc-length'
  | 'measure-object'
  | 'markup-text'
  | 'markup-rect'
  | 'markup-circle'
  | 'markup-arrow'
  | 'markup-line'
  | 'markup-ellipse'
  | 'markup-revcloud'
  | 'markup-leader'
  | 'markup-freehand'

export type MeasureMode = 'distance' | 'area' | 'angle' | 'coordinate' | 'point-to-line' | 'arc-length' | 'object'

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
  /** 보조 값 (예: 점-선 거리에서 수선의 발 좌표, 호 길이에서 원 정보) */
  auxiliary?: {
    projection?: Point2D
    segments?: { value: number; unit: string }[]
    arcCenter?: Point2D
    arcRadius?: number
    arcStartAngle?: number
    arcEndAngle?: number
  }
}

// ─── 측정 설정 ───

export interface MeasurementSettings {
  scale: {
    ratio: number       // 예: 1, 100, 50
    label: string       // 예: "1:1", "1:100"
  }
  style: {
    textHeight: number
    arrowSize: number
    textColor: string
    lineColor: string
    lineWidth: number
  }
  length: {
    unit: 'mm' | 'cm' | 'm'
    precision: number   // 소수점 자릿수
  }
  area: {
    unit: 'mm²' | 'cm²' | 'm²'
    precision: number
  }
  angle: {
    unit: 'decimal' | 'dms'
    precision: number
  }
  coordinate: {
    system: 'world' | 'user'
    precision: number
  }
}

// ─── Layout 타입 ───

export interface LayoutInfo {
  name: string
  /** 'Model' = 모델 공간, 'Paper' = 배치(페이퍼) 공간 */
  type: 'Model' | 'Paper'
  /** 정렬 순서 (탭 표시용) */
  tabOrder: number
  /** 엔진 내부 block table record ID */
  blockId?: string
}

/** 로드된 파일 정보 */
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

/** 문서 로드 후 감지된 경고 — 사용자에게 알림 표시용 */
export interface DocumentWarning {
  type:
    | 'exploded-text'       // DWG 텍스트가 LINE으로 explode됨
    | 'missing-fonts'       // 도면에 필요한 폰트 누락 (fallback 사용 중)
    | 'empty-document'      // 엔티티가 없는 빈 도면
    | 'large-file'          // 대용량 파일 성능 경고
    | 'webgl-context-lost'  // GPU 메모리 부족으로 WebGL 컨텍스트 소실
    | 'font-load-failed'    // 폰트 로드 실패
    | 'unsupported-entities' // 지원하지 않는 엔티티 타입
  message: string
  suggestion?: string
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
  /** 컨테이너 크기 변경 시 캔버스 리사이즈 트리거 */
  resize(): void
  dispose(): void
  onMouseMove?: (worldPos: Point2D) => void
  onZoomChange?: (level: number) => void

  // 뷰 모드: 'select' = 엔티티 선택, 'pan' = 드래그로 이동
  setViewMode(mode: 'select' | 'pan'): void
  // 선택 이벤트
  onSelectionChanged?: (entityIds: string[]) => void

  // M2: 레이어 관리
  getLayers(): Layer[]
  setLayerVisibility(layerName: string, visible: boolean): void

  // M2: 엔티티 쿼리
  getEntities(): CadEntity[]

  // M2: 스냅
  getSnapPoint(worldX: number, worldY: number, snapTypes: SnapType[]): SnapResult | null

  // Layout 전환
  getLayouts(): LayoutInfo[]
  switchLayout(name: string): boolean
  getCurrentLayoutName(): string
  onLayoutChanged?: (name: string) => void

  // 문서 품질 경고 콜백
  onDocumentWarning?: (warning: DocumentWarning) => void

  // M2: 엔진 내장 측정 렌더링 (transient entity 기반)
  addMeasurementLine(id: string, p1: Point2D, p2: Point2D, color?: string): void
  addMeasurementArc(id: string, center: Point2D, radius: number, startAngle: number, endAngle: number, color?: string): void
  addMeasurementText(id: string, position: Point2D, text: string, height?: number, color?: string): void
  addMeasurementPolygon(id: string, points: Point2D[], color?: string): void
  removeMeasurementEntity(id: string): void
  clearMeasurementEntities(): void
}

// ─── M3: 마크업 타입 ───

export type MarkupType = 'text' | 'rect' | 'circle' | 'arrow' | 'line' | 'ellipse' | 'revcloud' | 'leader' | 'freehand'

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
