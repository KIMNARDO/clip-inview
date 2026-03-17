import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from './app'

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('초기 상태가 올바르다', () => {
    const store = useAppStore()
    expect(store.currentFile).toBeNull()
    expect(store.fileInfo).toBeNull()
    expect(store.isFileLoaded).toBe(false)
    expect(store.zoomLevel).toBe(100)
    expect(store.cursorPosition).toEqual({ x: 0, y: 0 })
    expect(store.activeTool).toBe('select')
    expect(store.isRibbonCollapsed).toBe(false)
    expect(store.isPropertiesPanelOpen).toBe(true)
  })

  it('파일 경로를 설정할 수 있다', () => {
    const store = useAppStore()
    store.setCurrentFile('/path/to/drawing.dwg')
    expect(store.currentFile).toBe('/path/to/drawing.dwg')
  })

  it('파일 정보를 설정하면 isFileLoaded가 true가 된다', () => {
    const store = useAppStore()
    store.setFileInfo({
      name: 'test.dwg',
      size: 1024,
      type: 'application/acad',
      lastModified: Date.now(),
    })
    expect(store.isFileLoaded).toBe(true)
    expect(store.fileInfo?.name).toBe('test.dwg')
  })

  it('파일 정보를 null로 설정하면 isFileLoaded가 false가 된다', () => {
    const store = useAppStore()
    store.setFileInfo({
      name: 'test.dwg',
      size: 1024,
      type: 'application/acad',
      lastModified: Date.now(),
    })
    store.setFileInfo(null)
    expect(store.isFileLoaded).toBe(false)
  })

  it('줌 레벨을 1~6400 범위로 제한한다', () => {
    const store = useAppStore()
    store.setZoomLevel(200)
    expect(store.zoomLevel).toBe(200)

    store.setZoomLevel(0)
    expect(store.zoomLevel).toBe(1)

    store.setZoomLevel(10000)
    expect(store.zoomLevel).toBe(6400)
  })

  it('커서 위치를 업데이트할 수 있다', () => {
    const store = useAppStore()
    store.setCursorPosition(123.45, 678.90)
    expect(store.cursorPosition).toEqual({ x: 123.45, y: 678.90 })
  })

  it('활성 도구를 변경할 수 있다', () => {
    const store = useAppStore()
    store.setActiveTool('pan')
    expect(store.activeTool).toBe('pan')
    expect(store.activeToolLabel).toBe('이동')
  })

  it('리본 접기/펼치기가 동작한다', () => {
    const store = useAppStore()
    expect(store.isRibbonCollapsed).toBe(false)
    store.toggleRibbon()
    expect(store.isRibbonCollapsed).toBe(true)
    store.toggleRibbon()
    expect(store.isRibbonCollapsed).toBe(false)
  })

  it('속성 패널 토글이 동작한다', () => {
    const store = useAppStore()
    expect(store.isPropertiesPanelOpen).toBe(true)
    store.togglePropertiesPanel()
    expect(store.isPropertiesPanelOpen).toBe(false)
  })

  it('상태바 토글들이 동작한다', () => {
    const store = useAppStore()
    expect(store.isGridEnabled).toBe(false)
    store.toggleGrid()
    expect(store.isGridEnabled).toBe(true)

    expect(store.isSnapEnabled).toBe(false)
    store.toggleSnap()
    expect(store.isSnapEnabled).toBe(true)

    expect(store.isOrthoEnabled).toBe(false)
    store.toggleOrtho()
    expect(store.isOrthoEnabled).toBe(true)

    expect(store.isOsnapEnabled).toBe(false)
    store.toggleOsnap()
    expect(store.isOsnapEnabled).toBe(true)
  })

  it('formattedZoom이 올바른 문자열을 반환한다', () => {
    const store = useAppStore()
    expect(store.formattedZoom).toBe('100%')
    store.setZoomLevel(150.5)
    expect(store.formattedZoom).toBe('151%')
  })

  it('formattedCoords가 소수점 2자리 문자열을 반환한다', () => {
    const store = useAppStore()
    store.setCursorPosition(12.345, -67.89)
    expect(store.formattedCoords).toEqual({ x: '12.35', y: '-67.89' })
  })
})
