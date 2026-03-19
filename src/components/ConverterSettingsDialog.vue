<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { validateOdaPath, checkConverterService } from '@/services/converterClient'
import { XIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-vue-next'

const emit = defineEmits<{ close: [] }>()
const settings = useSettingsStore()
const toast = useToastStore()

const localOdaPath = ref(settings.odaPath)
const localAutoConvert = ref(settings.autoConvert)
const localOutputVersion = ref(settings.outputVersion)

const isValidating = ref(false)
const validationResult = ref<{ valid: boolean; error?: string } | null>(null)
const serviceAvailable = ref<boolean | null>(null)

const outputVersionOptions = [
  { value: 'ACAD2018', label: 'AutoCAD 2018 (R2018)' },
  { value: 'ACAD2013', label: 'AutoCAD 2013 (R2013)' },
  { value: 'ACAD2010', label: 'AutoCAD 2010 (R2010)' },
  { value: 'ACAD2007', label: 'AutoCAD 2007 (R2007)' },
  { value: 'ACAD2004', label: 'AutoCAD 2004 (R2004)' },
] as const

onMounted(async () => {
  serviceAvailable.value = await checkConverterService()
})

async function handleValidate() {
  if (!localOdaPath.value.trim()) {
    validationResult.value = { valid: false, error: '경로를 입력하세요.' }
    return
  }

  isValidating.value = true
  validationResult.value = null

  try {
    validationResult.value = await validateOdaPath(localOdaPath.value.trim())
  } finally {
    isValidating.value = false
  }
}

function handleSave() {
  settings.updateConverterSettings({
    odaPath: localOdaPath.value.trim(),
    autoConvert: localAutoConvert.value,
    outputVersion: localOutputVersion.value,
  })
  toast.show('변환기 설정이 저장되었습니다.', 'success', 2000)
  emit('close')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')" @keydown="handleKeydown">
    <div class="dialog">
      <div class="dialog-header">
        <span class="dialog-title">DWG 변환 설정</span>
        <button class="dialog-close" @click="emit('close')">
          <XIcon :size="16" :stroke-width="2" />
        </button>
      </div>

      <div class="dialog-body">
        <!-- 서비스 상태 -->
        <div class="service-status" :class="serviceAvailable === false ? 'service-status--offline' : ''">
          <template v-if="serviceAvailable === null">
            <LoaderIcon :size="14" :stroke-width="2" class="spin" />
            <span>변환 서비스 연결 확인 중...</span>
          </template>
          <template v-else-if="serviceAvailable">
            <CheckCircleIcon :size="14" :stroke-width="2" />
            <span>변환 서비스 연결됨</span>
          </template>
          <template v-else>
            <AlertCircleIcon :size="14" :stroke-width="2" />
            <span>변환 서비스에 연결할 수 없습니다. <code>npm run server</code>로 서버를 시작하세요.</span>
          </template>
        </div>

        <!-- ODA 경로 -->
        <div class="settings-section">
          <label class="setting-label">ODA File Converter 경로</label>
          <p class="setting-hint">
            ODA File Converter 실행 파일의 전체 경로를 입력하세요.
            <a href="https://www.opendesign.com/guestfiles/oda_file_converter" target="_blank" rel="noopener" class="setting-link">무료 다운로드</a>
          </p>
          <div class="path-input-row">
            <input
              v-model="localOdaPath"
              type="text"
              class="setting-input path-input"
              placeholder="C:\Program Files\ODA\ODAFileConverter\ODAFileConverter.exe"
              spellcheck="false"
              @input="validationResult = null"
            />
            <button
              class="validate-btn"
              :disabled="isValidating || !localOdaPath.trim()"
              @click="handleValidate"
            >
              <LoaderIcon v-if="isValidating" :size="14" :stroke-width="2" class="spin" />
              <template v-else>검증</template>
            </button>
          </div>
          <!-- 검증 결과 -->
          <div v-if="validationResult" class="validation-result" :class="validationResult.valid ? 'validation-result--ok' : 'validation-result--error'">
            <CheckCircleIcon v-if="validationResult.valid" :size="14" :stroke-width="2" />
            <AlertCircleIcon v-else :size="14" :stroke-width="2" />
            <span>{{ validationResult.valid ? 'ODA File Converter가 확인되었습니다.' : validationResult.error }}</span>
          </div>
        </div>

        <!-- 자동 변환 -->
        <div class="settings-section">
          <div class="toggle-row">
            <label class="setting-label">DWG 자동 변환</label>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--on': localAutoConvert }"
              role="switch"
              :aria-checked="localAutoConvert"
              @click="localAutoConvert = !localAutoConvert"
            >
              <span class="toggle-knob" />
            </button>
          </div>
          <p class="setting-hint">
            활성화하면 DWG 파일에서 텍스트 깨짐이 감지될 때 자동으로 DXF 변환을 시도합니다.
            비활성화하면 변환 여부를 묻는 알림만 표시합니다.
          </p>
        </div>

        <!-- 출력 버전 -->
        <div class="settings-section">
          <label class="setting-label">출력 DXF 버전</label>
          <select v-model="localOutputVersion" class="setting-select">
            <option v-for="opt in outputVersionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="dialog-footer">
        <button class="btn btn--secondary" @click="emit('close')">취소</button>
        <button class="btn btn--primary" @click="handleSave">저장</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.dialog {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  background: var(--cad-bg-panel, #252525);
  border: 1px solid var(--cad-border-default, #3a3a3a);
  border-radius: var(--cad-radius-lg, 8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--cad-border-default, #3a3a3a);
}

.dialog-title {
  font-size: var(--cad-text-sm, 13px);
  font-weight: var(--cad-font-semibold, 600);
  color: var(--cad-text-primary, #e0e0e0);
}

.dialog-close {
  display: flex;
  padding: 4px;
  color: var(--cad-text-muted, #808080);
  background: none;
  border: none;
  border-radius: var(--cad-radius-sm, 4px);
  cursor: pointer;
}
.dialog-close:hover {
  color: var(--cad-text-primary, #e0e0e0);
  background: rgba(255, 255, 255, 0.06);
}

.dialog-body {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--cad-border-default, #3a3a3a);
}

/* 서비스 상태 */
.service-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  border-radius: var(--cad-radius-sm, 4px);
  background: rgba(74, 222, 128, 0.08);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.2);
}
.service-status--offline {
  background: rgba(251, 146, 60, 0.08);
  color: #fb923c;
  border-color: rgba(251, 146, 60, 0.2);
}
.service-status code {
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  font-family: var(--cad-font-mono, monospace);
  font-size: 10px;
}

/* 설정 섹션 */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-label {
  font-size: var(--cad-text-xs, 11px);
  font-weight: var(--cad-font-semibold, 600);
  color: var(--cad-text-secondary, #b0b0b0);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-hint {
  font-size: 11px;
  color: var(--cad-text-muted, #808080);
  line-height: 1.4;
}

.setting-link {
  color: var(--cad-accent-primary, #3b82f6);
  text-decoration: none;
}
.setting-link:hover {
  text-decoration: underline;
}

/* 경로 입력 */
.path-input-row {
  display: flex;
  gap: 6px;
}

.setting-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 12px;
  font-family: var(--cad-font-mono, monospace);
  background: var(--cad-bg-input, #1e1e1e);
  border: 1px solid var(--cad-border-default, #3a3a3a);
  border-radius: var(--cad-radius-sm, 4px);
  color: var(--cad-text-primary, #e0e0e0);
  outline: none;
}
.setting-input:focus {
  border-color: var(--cad-accent-primary, #3b82f6);
}

.path-input {
  font-size: 11px;
}

.validate-btn {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--cad-border-default, #3a3a3a);
  border-radius: var(--cad-radius-sm, 4px);
  color: var(--cad-text-secondary, #b0b0b0);
  cursor: pointer;
  white-space: nowrap;
}
.validate-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--cad-text-primary, #e0e0e0);
}
.validate-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 검증 결과 */
.validation-result {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: var(--cad-radius-sm, 4px);
}
.validation-result--ok {
  background: rgba(74, 222, 128, 0.08);
  color: #4ade80;
}
.validation-result--error {
  background: rgba(248, 113, 113, 0.08);
  color: #f87171;
}

/* 토글 스위치 */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-switch {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--cad-border-default, #3a3a3a);
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}
.toggle-switch--on {
  background: var(--cad-accent-primary, #3b82f6);
  border-color: var(--cad-accent-primary, #3b82f6);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}
.toggle-switch--on .toggle-knob {
  transform: translateX(16px);
}

/* 셀렉트 */
.setting-select {
  padding: 6px 10px;
  font-size: 12px;
  background: var(--cad-bg-input, #1e1e1e);
  border: 1px solid var(--cad-border-default, #3a3a3a);
  border-radius: var(--cad-radius-sm, 4px);
  color: var(--cad-text-primary, #e0e0e0);
  outline: none;
}
.setting-select:focus {
  border-color: var(--cad-accent-primary, #3b82f6);
}

/* 버튼 */
.btn {
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--cad-radius-sm, 4px);
  cursor: pointer;
  border: 1px solid transparent;
}

.btn--primary {
  background: var(--cad-accent-primary, #3b82f6);
  color: #fff;
}
.btn--primary:hover {
  background: var(--cad-accent-hover, #2563eb);
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--cad-border-default, #3a3a3a);
  color: var(--cad-text-secondary, #b0b0b0);
}
.btn--secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--cad-text-primary, #e0e0e0);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
