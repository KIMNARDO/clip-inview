/**
 * Clip-inView 백엔드 서비스
 *
 * 경량 Express 서버 — DWG→DXF 변환 API만 제공.
 * 프로덕션에서는 Nginx 뒤에서 리버스 프록시로 동작한다.
 *
 * 사용법:
 *   npx tsx server/index.ts
 *   또는 npm run server
 */

import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { convertDwgToDxf, validateOdaPath } from './converter.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

// 500MB 제한 (DWG 파일 크기)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
})

app.use(cors({ origin: true }))
app.use(express.json())

// ─── 헬스체크 ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'clip-inview-converter' })
})

// ─── ODA 경로 유효성 검증 ───
app.post('/api/converter/validate', async (req, res) => {
  const { odaPath } = req.body as { odaPath?: string }
  if (!odaPath) {
    res.status(400).json({ valid: false, error: 'odaPath가 필요합니다.' })
    return
  }

  const result = await validateOdaPath(odaPath)
  res.json(result)
})

// ─── DWG → DXF 변환 ───
app.post('/api/converter/convert', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      res.status(400).json({ success: false, error: '파일이 필요합니다.' })
      return
    }

    const odaPath = req.body.odaPath as string | undefined
    if (!odaPath) {
      res.status(400).json({ success: false, error: 'ODA 경로가 필요합니다. 설정에서 ODA File Converter 경로를 지정하세요.' })
      return
    }

    const outputVersion = (req.body.outputVersion as string) || 'ACAD2018'

    console.log(`[Converter] 변환 시작: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)

    const result = await convertDwgToDxf(file.buffer, file.originalname, {
      odaPath,
      outputVersion,
      timeout: 120_000,
    })

    if (result.success && result.dxfBuffer) {
      console.log(`[Converter] 변환 성공: ${result.dxfFileName}`)
      res.setHeader('Content-Type', 'application/dxf')
      res.setHeader('Content-Disposition', `attachment; filename="${result.dxfFileName}"`)
      res.send(result.dxfBuffer)
    } else {
      console.warn(`[Converter] 변환 실패: ${result.error}`)
      res.status(500).json({ success: false, error: result.error })
    }
  } catch (err) {
    console.error('[Converter] 서버 오류:', err)
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : '서버 내부 오류',
    })
  }
})

app.listen(PORT, () => {
  console.log(`[Converter] 변환 서비스 시작 — http://localhost:${PORT}`)
  console.log(`[Converter] API: POST /api/converter/convert (DWG→DXF)`)
  console.log(`[Converter] API: POST /api/converter/validate (ODA 경로 검증)`)
})
