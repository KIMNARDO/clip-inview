import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'clip-inview-settings'

export interface ConverterSettings {
  /** ODA File Converter 실행 파일 경로 (예: C:\ODAFileConverter\ODAFileConverter.exe) */
  odaPath: string
  /** DWG 로드 시 exploded text 감지되면 자동으로 DXF 변환 시도 */
  autoConvert: boolean
  /** 변환 출력 DXF 버전 */
  outputVersion: 'ACAD2018' | 'ACAD2013' | 'ACAD2010' | 'ACAD2007' | 'ACAD2004'
}

interface PersistedSettings {
  converter: ConverterSettings
}

function loadFromStorage(): PersistedSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedSettings
  } catch { /* ignore corrupt data */ }
  return null
}

function saveToStorage(settings: PersistedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* storage full — ignore */ }
}

export const useSettingsStore = defineStore('settings', () => {
  const saved = loadFromStorage()

  // ─── ODA 변환기 설정 ───
  const odaPath = ref(saved?.converter?.odaPath ?? '')
  const autoConvert = ref(saved?.converter?.autoConvert ?? false)
  const outputVersion = ref<ConverterSettings['outputVersion']>(
    saved?.converter?.outputVersion ?? 'ACAD2018',
  )

  /** ODA 경로가 설정되어 있는지 */
  const isOdaConfigured = () => odaPath.value.trim().length > 0

  // 설정 변경 시 자동 저장
  watch([odaPath, autoConvert, outputVersion], () => {
    saveToStorage({
      converter: {
        odaPath: odaPath.value,
        autoConvert: autoConvert.value,
        outputVersion: outputVersion.value,
      },
    })
  }, { deep: true })

  function updateConverterSettings(settings: Partial<ConverterSettings>) {
    if (settings.odaPath !== undefined) odaPath.value = settings.odaPath
    if (settings.autoConvert !== undefined) autoConvert.value = settings.autoConvert
    if (settings.outputVersion !== undefined) outputVersion.value = settings.outputVersion
  }

  return {
    odaPath,
    autoConvert,
    outputVersion,
    isOdaConfigured,
    updateConverterSettings,
  }
})
