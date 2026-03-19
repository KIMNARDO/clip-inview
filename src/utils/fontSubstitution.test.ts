import { describe, it, expect } from 'vitest'
import { resolveFont, resolveFonts, getSubstitutionWarnings } from './fontSubstitution'

describe('fontSubstitution', () => {
  describe('resolveFont', () => {
    it('maps SHX text fonts to Courier New', () => {
      const result = resolveFont('txt.shx')
      expect(result.substitute).toContain('Courier New')
      expect(result.reason).toBe('shx')
    })

    it('maps SHX simplex to Arial', () => {
      const result = resolveFont('simplex.shx')
      expect(result.substitute).toContain('Arial')
      expect(result.reason).toBe('shx')
    })

    it('maps SHX romans to Times New Roman', () => {
      const result = resolveFont('romans')
      expect(result.substitute).toContain('Times New Roman')
      expect(result.reason).toBe('shx')
    })

    it('maps Korean SHX fonts to Malgun Gothic', () => {
      const result = resolveFont('whgdtxt.shx')
      expect(result.substitute).toContain('Malgun Gothic')
      expect(result.reason).toBe('shx')
    })

    it('handles case-insensitive matching', () => {
      const result = resolveFont('TXT.SHX')
      expect(result.substitute).toContain('Courier New')
    })

    it('handles font names with extra spaces', () => {
      const result = resolveFont('  simplex  ')
      expect(result.substitute).toContain('Arial')
    })

    it('resolves CJK fonts with Malgun Gothic fallback', () => {
      const result = resolveFont('굴림')
      expect(result.substitute).toContain('Malgun Gothic')
      expect(result.reason).toBe('cjk')
    })

    it('falls back for unknown fonts with original name included', () => {
      const result = resolveFont('CustomSpecialFont')
      expect(result.substitute).toContain('CustomSpecialFont')
      expect(result.substitute).toContain('Arial')
      expect(result.reason).toBe('missing')
    })

    it('detects symbol fonts', () => {
      const result = resolveFont('Wingdings')
      expect(result.substitute).toContain('Symbol')
      expect(result.reason).toBe('symbol')
    })

    it('maps gothic SHX fonts to Arial Black', () => {
      const result = resolveFont('gothic.shx')
      expect(result.substitute).toContain('Arial Black')
    })

    it('maps script SHX fonts', () => {
      const result = resolveFont('scripts.shx')
      expect(result.reason).toBe('shx')
    })
  })

  describe('resolveFonts', () => {
    it('resolves multiple fonts at once', () => {
      const results = resolveFonts(['txt.shx', 'simplex', 'Arial'])
      expect(results).toHaveLength(3)
      expect(results[0]!.reason).toBe('shx')
      expect(results[1]!.reason).toBe('shx')
    })
  })

  describe('getSubstitutionWarnings', () => {
    it('returns substituted fonts that need warnings', () => {
      const mappings = resolveFonts(['txt.shx', 'simplex.shx', 'whgdtxt.shx'])
      const warnings = getSubstitutionWarnings(mappings)
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings.every((w) => w.reason === 'shx')).toBe(true)
    })
  })
})
