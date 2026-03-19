import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { MeasurementSettings } from '@/types/cad'

const STORAGE_KEY = 'clip-inview-measurement-settings'

const DEFAULT_SETTINGS: MeasurementSettings = {
  scale: { ratio: 1, label: '1:1' },
  style: {
    textHeight: 14,
    arrowSize: 8,
    textColor: '#e3f1f1',
    lineColor: '#e3f1f1',
    lineWidth: 1,
  },
  length: { unit: 'mm', precision: 4 },
  area: { unit: 'mm²', precision: 4 },
  angle: { unit: 'decimal', precision: 2 },
  coordinate: { system: 'world', precision: 4 },
}

function loadFromStorage(): MeasurementSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export const useMeasurementSettingsStore = defineStore('measurementSettings', () => {
  const settings = ref<MeasurementSettings>(loadFromStorage())

  // localStorage 자동 동기화
  watch(settings, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch { /* ignore */ }
  }, { deep: true })

  function setScale(ratio: number, label: string) {
    settings.value.scale = { ratio, label }
  }

  function setLengthUnit(unit: 'mm' | 'cm' | 'm') {
    settings.value.length.unit = unit
  }

  function setLengthPrecision(precision: number) {
    settings.value.length.precision = Math.max(0, Math.min(6, precision))
  }

  function setAreaUnit(unit: 'mm²' | 'cm²' | 'm²') {
    settings.value.area.unit = unit
  }

  function setAnglePrecision(precision: number) {
    settings.value.angle.precision = Math.max(0, Math.min(4, precision))
  }

  function setStyleColor(lineColor: string, textColor: string) {
    settings.value.style.lineColor = lineColor
    settings.value.style.textColor = textColor
  }

  function resetToDefaults() {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  /** 측정 원시값을 설정 단위로 변환 */
  function convertLength(valueMm: number): number {
    const scale = settings.value.scale.ratio
    const scaled = valueMm / scale
    switch (settings.value.length.unit) {
      case 'cm': return scaled / 10
      case 'm': return scaled / 1000
      default: return scaled
    }
  }

  /** 면적 원시값을 설정 단위로 변환 */
  function convertArea(valueMm2: number): number {
    const scale = settings.value.scale.ratio
    const scaled = valueMm2 / (scale * scale)
    switch (settings.value.area.unit) {
      case 'cm²': return scaled / 100
      case 'm²': return scaled / 1_000_000
      default: return scaled
    }
  }

  /** 길이 포맷팅 */
  function formatLength(valueMm: number): string {
    const converted = convertLength(valueMm)
    return `${converted.toFixed(settings.value.length.precision)} ${settings.value.length.unit}`
  }

  /** 면적 포맷팅 */
  function formatArea(valueMm2: number): string {
    const converted = convertArea(valueMm2)
    return `${converted.toFixed(settings.value.area.precision)} ${settings.value.area.unit}`
  }

  /** 각도 포맷팅 */
  function formatAngle(degrees: number): string {
    if (settings.value.angle.unit === 'dms') {
      const d = Math.floor(degrees)
      const mFloat = (degrees - d) * 60
      const m = Math.floor(mFloat)
      const s = (mFloat - m) * 60
      return `${d}° ${m}' ${s.toFixed(0)}"`
    }
    return `${degrees.toFixed(settings.value.angle.precision)}°`
  }

  /** 좌표 포맷팅 */
  function formatCoordinate(x: number, y: number): string {
    const p = settings.value.coordinate.precision
    return `X: ${x.toFixed(p)}  Y: ${y.toFixed(p)}`
  }

  return {
    settings,
    setScale,
    setLengthUnit,
    setLengthPrecision,
    setAreaUnit,
    setAnglePrecision,
    setStyleColor,
    resetToDefaults,
    convertLength,
    convertArea,
    formatLength,
    formatArea,
    formatAngle,
    formatCoordinate,
  }
})
