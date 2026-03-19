/**
 * 도면 내보내기 유틸리티
 * 캔버스를 PNG/JPEG/PDF 이미지로 캡처하거나 인쇄합니다.
 */

import { jsPDF } from 'jspdf'

// ─── 내보내기 옵션 타입 ───

export interface PdfExportOptions {
  paperSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'Letter'
  orientation: 'portrait' | 'landscape'
  quality: number       // 0.1 ~ 1.0
  includeBackground: boolean
  margins: number       // mm 단위
}

export interface JpegExportOptions {
  quality: number       // 0.1 ~ 1.0
  includeBackground: boolean
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  paperSize: 'A3',
  orientation: 'landscape',
  quality: 0.92,
  includeBackground: false,
  margins: 10,
}

export const DEFAULT_JPEG_OPTIONS: JpegExportOptions = {
  quality: 0.92,
  includeBackground: true,
}

// ─── 캔버스 캡처 ───

/** 뷰어 영역의 모든 캔버스를 합성하여 하나의 이미지로 만든다 */
function captureViewerCanvas(includeBackground = true): HTMLCanvasElement | null {
  const viewerRoot = document.querySelector('.viewer-root')
  if (!viewerRoot) return null

  const canvases = viewerRoot.querySelectorAll('canvas')
  if (canvases.length === 0) return null

  const mainCanvas = canvases[0]!
  const w = mainCanvas.width || mainCanvas.clientWidth
  const h = mainCanvas.height || mainCanvas.clientHeight

  const merged = document.createElement('canvas')
  merged.width = w
  merged.height = h
  const ctx = merged.getContext('2d')
  if (!ctx) return null

  if (includeBackground) {
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--cad-bg-canvas')
      .trim() || '#1A1A1A'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)
  } else {
    // 흰색 배경 (PDF/인쇄용)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, w, h)
  }

  for (const canvas of canvases) {
    try {
      ctx.drawImage(canvas, 0, 0, w, h)
    } catch {
      // CORS나 tainted canvas 에러 무시
    }
  }

  return merged
}

// ─── PNG 내보내기 ───

/** PNG 파일로 내보내기 */
export function exportToPng(fileName?: string): boolean {
  const canvas = captureViewerCanvas()
  if (!canvas) return false

  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = fileName
    ? `${fileName.replace(/\.[^.]+$/, '')}.png`
    : 'drawing.png'
  link.href = dataUrl
  link.click()
  return true
}

// ─── JPEG 내보내기 ───

/** JPEG 파일로 내보내기 */
export function exportToJpeg(fileName?: string, options?: Partial<JpegExportOptions>): boolean {
  const opts = { ...DEFAULT_JPEG_OPTIONS, ...options }
  const canvas = captureViewerCanvas(opts.includeBackground)
  if (!canvas) return false

  const dataUrl = canvas.toDataURL('image/jpeg', opts.quality)
  const link = document.createElement('a')
  link.download = fileName
    ? `${fileName.replace(/\.[^.]+$/, '')}.jpg`
    : 'drawing.jpg'
  link.href = dataUrl
  link.click()
  return true
}

// ─── PDF 내보내기 ───

/** PDF 파일로 내보내기 */
export function exportToPdf(fileName?: string, options?: Partial<PdfExportOptions>): boolean {
  const opts = { ...DEFAULT_PDF_OPTIONS, ...options }
  const canvas = captureViewerCanvas(opts.includeBackground)
  if (!canvas) return false

  const format = opts.paperSize === 'Letter' ? 'letter' : opts.paperSize.toLowerCase()
  const pdf = new jsPDF({
    orientation: opts.orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = opts.margins

  const availW = pageWidth - margin * 2
  const availH = pageHeight - margin * 2

  // 캔버스 비율 유지하면서 페이지에 맞춤
  const canvasRatio = canvas.width / canvas.height
  const pageRatio = availW / availH

  let imgW: number
  let imgH: number

  if (canvasRatio > pageRatio) {
    imgW = availW
    imgH = availW / canvasRatio
  } else {
    imgH = availH
    imgW = availH * canvasRatio
  }

  // 중앙 정렬
  const x = margin + (availW - imgW) / 2
  const y = margin + (availH - imgH) / 2

  const imgData = canvas.toDataURL('image/jpeg', opts.quality)
  pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH)

  const outputName = fileName
    ? `${fileName.replace(/\.[^.]+$/, '')}.pdf`
    : 'drawing.pdf'
  pdf.save(outputName)
  return true
}

// ─── 인쇄 ───

/** 인쇄 (브라우저 프린트 다이얼로그) */
export function printDrawing(): boolean {
  const canvas = captureViewerCanvas(false)
  if (!canvas) return false

  const dataUrl = canvas.toDataURL('image/png')

  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Clip-inView 인쇄</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          img { max-width: 100%; height: auto; }
        }
        body {
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #fff;
        }
        img { max-width: 100%; height: auto; }
      </style>
    </head>
    <body>
      <img src="${dataUrl}" onload="window.print(); window.close();" />
    </body>
    </html>
  `)
  printWindow.document.close()
  return true
}
