/**
 * CAD 폰트 대체 유틸리티
 *
 * DWG/DXF 파일에서 사용된 CAD 전용 폰트(SHX 등)를
 * 브라우저에서 렌더링 가능한 시스템 폰트로 매핑한다.
 */

export interface FontMapping {
  /** CAD 원본 폰트 이름 */
  original: string
  /** 브라우저 대체 폰트 (CSS font-family) */
  substitute: string
  /** 대체 사유 */
  reason: 'shx' | 'missing' | 'cjk' | 'symbol'
}

/**
 * CAD SHX 폰트 → 시스템 폰트 매핑 테이블
 *
 * AutoCAD의 대표적인 SHX 폰트를 브라우저에서 사용 가능한
 * 유사한 모양의 TrueType/시스템 폰트로 매핑한다.
 */
const SHX_FONT_MAP: Record<string, string> = {
  // 영문 SHX 폰트
  'txt': '"Courier New", monospace',
  'txt.shx': '"Courier New", monospace',
  'simplex': '"Arial", sans-serif',
  'simplex.shx': '"Arial", sans-serif',
  'romans': '"Times New Roman", serif',
  'romans.shx': '"Times New Roman", serif',
  'romand': '"Times New Roman", serif',
  'romand.shx': '"Times New Roman", serif',
  'romanc': '"Times New Roman", serif',
  'romanc.shx': '"Times New Roman", serif',
  'romant': '"Times New Roman", serif',
  'romant.shx': '"Times New Roman", serif',
  'italic': '"Times New Roman", serif',
  'italic.shx': '"Times New Roman", serif',
  'isocp': '"Arial", sans-serif',
  'isocp.shx': '"Arial", sans-serif',
  'isocpeur': '"Arial", sans-serif',
  'isocpeur.shx': '"Arial", sans-serif',
  'isoct': '"Arial", sans-serif',
  'isoct.shx': '"Arial", sans-serif',
  'isoct2': '"Arial", sans-serif',
  'isoct2.shx': '"Arial", sans-serif',
  'monotxt': '"Courier New", monospace',
  'monotxt.shx': '"Courier New", monospace',
  'complex': '"Arial", sans-serif',
  'complex.shx': '"Arial", sans-serif',
  'gothic': '"Arial Black", sans-serif',
  'gothic.shx': '"Arial Black", sans-serif',
  'gothice': '"Arial Black", sans-serif',
  'gothice.shx': '"Arial Black", sans-serif',
  'gothicg': '"Arial Black", sans-serif',
  'gothicg.shx': '"Arial Black", sans-serif',
  'gothici': '"Arial Black", sans-serif',
  'gothici.shx': '"Arial Black", sans-serif',
  'scripts': '"Segoe Script", cursive',
  'scripts.shx': '"Segoe Script", cursive',
  'scriptc': '"Segoe Script", cursive',
  'scriptc.shx': '"Segoe Script", cursive',
  'syastro': '"Symbol", sans-serif',
  'syastro.shx': '"Symbol", sans-serif',
  'symath': '"Symbol", sans-serif',
  'symath.shx': '"Symbol", sans-serif',
  'symap': '"Symbol", sans-serif',
  'symap.shx': '"Symbol", sans-serif',
  'symeteo': '"Symbol", sans-serif',
  'symeteo.shx': '"Symbol", sans-serif',
  'symusic': '"Symbol", sans-serif',
  'symusic.shx': '"Symbol", sans-serif',

  // 한국어/CJK SHX 폰트
  'whgdtxt': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'whgdtxt.shx': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'whgtxt': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'whgtxt.shx': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'whtgtxt': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'whtgtxt.shx': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'whtmtxt': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'whtmtxt.shx': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'bigfont': '"Malgun Gothic", "맑은 고딕", sans-serif',
  'bigfont.shx': '"Malgun Gothic", "맑은 고딕", sans-serif',

  // 일본어 SHX
  'extfont': '"MS Gothic", "Yu Gothic", sans-serif',
  'extfont.shx': '"MS Gothic", "Yu Gothic", sans-serif',
  'extfont2': '"MS Gothic", "Yu Gothic", sans-serif',
  'extfont2.shx': '"MS Gothic", "Yu Gothic", sans-serif',

  // 중국어 SHX
  'chineset': '"SimSun", "Microsoft YaHei", sans-serif',
  'chineset.shx': '"SimSun", "Microsoft YaHei", sans-serif',
  'gbcbig': '"SimSun", "Microsoft YaHei", sans-serif',
  'gbcbig.shx': '"SimSun", "Microsoft YaHei", sans-serif',
}

/**
 * 일반 TrueType 폰트 대체 매핑
 * (시스템에 설치되지 않았을 경우 폴백)
 */
const TTF_FALLBACK_MAP: Record<string, string> = {
  'arial': '"Arial", "Helvetica", sans-serif',
  'times new roman': '"Times New Roman", "Georgia", serif',
  'courier new': '"Courier New", "Courier", monospace',
  'verdana': '"Verdana", "Geneva", sans-serif',
  'tahoma': '"Tahoma", "Geneva", sans-serif',
  'calibri': '"Calibri", "Segoe UI", sans-serif',
  'cambria': '"Cambria", "Georgia", serif',
  '굴림': '"Gulim", "Malgun Gothic", sans-serif',
  '돋움': '"Dotum", "Malgun Gothic", sans-serif',
  '바탕': '"Batang", "Malgun Gothic", serif',
  '궁서': '"Gungsuh", "Malgun Gothic", serif',
  '맑은 고딕': '"Malgun Gothic", "맑은 고딕", sans-serif',
}

/** 기본 폴백 폰트 (모든 대체가 실패할 경우) */
const DEFAULT_FALLBACK = '"Arial", "Malgun Gothic", sans-serif'

/**
 * CAD 폰트 이름을 브라우저에서 렌더링 가능한 CSS font-family로 변환
 */
export function resolveFont(cadFontName: string): FontMapping {
  const normalized = cadFontName.trim().toLowerCase()

  // 1. SHX 폰트 매핑
  if (SHX_FONT_MAP[normalized]) {
    return {
      original: cadFontName,
      substitute: SHX_FONT_MAP[normalized]!,
      reason: normalized.endsWith('.shx') || SHX_FONT_MAP[normalized + '.shx'] ? 'shx' : 'shx',
    }
  }

  // 2. .shx 확장자 제거 후 재시도
  if (normalized.endsWith('.shx')) {
    const withoutExt = normalized.slice(0, -4)
    if (SHX_FONT_MAP[withoutExt]) {
      return {
        original: cadFontName,
        substitute: SHX_FONT_MAP[withoutExt]!,
        reason: 'shx',
      }
    }
  }

  // 3. CJK 폰트 감지
  if (isCjkFont(normalized)) {
    return {
      original: cadFontName,
      substitute: '"Malgun Gothic", "맑은 고딕", "Noto Sans KR", sans-serif',
      reason: 'cjk',
    }
  }

  // 4. 심볼/특수 폰트
  if (isSymbolFont(normalized)) {
    return {
      original: cadFontName,
      substitute: '"Symbol", sans-serif',
      reason: 'symbol',
    }
  }

  // 5. 일반 TTF 폰트 매핑
  if (TTF_FALLBACK_MAP[normalized]) {
    return {
      original: cadFontName,
      substitute: TTF_FALLBACK_MAP[normalized]!,
      reason: 'missing',
    }
  }

  // 6. 기본 폴백 — 원본 폰트를 1순위로 시도하되 폴백 추가
  return {
    original: cadFontName,
    substitute: `"${cadFontName}", ${DEFAULT_FALLBACK}`,
    reason: 'missing',
  }
}

/**
 * 여러 CAD 폰트를 한 번에 변환
 */
export function resolveFonts(fontNames: string[]): FontMapping[] {
  return fontNames.map(resolveFont)
}

/**
 * 대체된 폰트 목록에서 경고가 필요한 항목 추출
 */
export function getSubstitutionWarnings(mappings: FontMapping[]): FontMapping[] {
  return mappings.filter((m) => m.reason !== 'missing' || m.original !== m.substitute)
}

function isCjkFont(name: string): boolean {
  const cjkPatterns = [
    /[\u3000-\u9fff]/, // CJK 유니코드
    /[\uac00-\ud7af]/, // 한글
    /[\u3040-\u309f]/, // 히라가나
    /[\u30a0-\u30ff]/, // 카타카나
  ]
  return cjkPatterns.some((p) => p.test(name)) ||
    ['gulim', 'dotum', 'batang', 'gungsuh', 'malgun', 'nanum'].some((k) => name.includes(k))
}

function isSymbolFont(name: string): boolean {
  return ['symbol', 'wingding', 'webding', 'dingbat'].some((k) => name.includes(k))
}
