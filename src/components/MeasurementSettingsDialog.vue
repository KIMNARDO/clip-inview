<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useMeasurementSettingsStore } from '@/stores/measurementSettings'
import { XIcon } from 'lucide-vue-next'

const emit = defineEmits<{ close: [] }>()
const settingsStore = useMeasurementSettingsStore()
const s = settingsStore.settings

const activeTab = ref<'scale' | 'style' | 'length' | 'angle'>('scale')
const showCustomInput = ref(false)
const customScaleValue = ref('')
const customInputRef = ref<HTMLInputElement | null>(null)

const scalePresets = [
  { label: '1:1', ratio: 1 },
  { label: '1:2', ratio: 2 },
  { label: '1:5', ratio: 5 },
  { label: '1:10', ratio: 10 },
  { label: '1:20', ratio: 20 },
  { label: '1:50', ratio: 50 },
  { label: '1:100', ratio: 100 },
  { label: '1:200', ratio: 200 },
  { label: '1:500', ratio: 500 },
  { label: '1:1000', ratio: 1000 },
]

function selectScale(preset: { label: string; ratio: number }) {
  settingsStore.setScale(preset.ratio, preset.label)
  showCustomInput.value = false
}

function openCustomInput() {
  customScaleValue.value = String(s.scale.ratio)
  showCustomInput.value = true
  nextTick(() => {
    customInputRef.value?.focus()
    customInputRef.value?.select()
  })
}

function applyCustomScale() {
  const ratio = parseFloat(customScaleValue.value)
  if (ratio > 0 && isFinite(ratio)) {
    settingsStore.setScale(ratio, `1:${ratio}`)
    showCustomInput.value = false
  }
}

function handleCustomKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') applyCustomScale()
  else if (e.key === 'Escape') showCustomInput.value = false
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <span class="dialog-title">측정 설정</span>
        <button class="dialog-close" @click="emit('close')">
          <XIcon :size="16" :stroke-width="2" />
        </button>
      </div>

      <!-- 탭 -->
      <div class="dialog-tabs">
        <button
          v-for="tab in [
            { id: 'scale' as const, label: '축척 설정' },
            { id: 'style' as const, label: '스타일 설정' },
            { id: 'length' as const, label: '길이 설정' },
            { id: 'angle' as const, label: '각도 설정' },
          ]"
          :key="tab.id"
          class="dialog-tab"
          :class="{ 'dialog-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="dialog-body">
        <!-- 축척 설정 -->
        <div v-if="activeTab === 'scale'" class="settings-section">
          <div class="setting-row">
            <label class="setting-label">측정 축척</label>
            <span class="setting-value-display">{{ s.scale.label }}</span>
          </div>
          <div class="scale-grid">
            <button
              v-for="preset in scalePresets"
              :key="preset.label"
              class="scale-button"
              :class="{ 'scale-button--active': s.scale.ratio === preset.ratio }"
              @click="selectScale(preset)"
            >
              {{ preset.label }}
            </button>
            <button v-if="!showCustomInput" class="scale-button" @click="openCustomInput">
              사용자 정의
            </button>
          </div>
          <!-- 사용자 정의 축척 입력 (인라인) -->
          <div v-if="showCustomInput" class="custom-scale-row">
            <label class="setting-label">비율 입력</label>
            <div class="custom-scale-input-group">
              <span class="custom-scale-prefix">1 :</span>
              <input
                ref="customInputRef"
                v-model="customScaleValue"
                type="number"
                min="0.01"
                step="1"
                class="setting-input custom-scale-input"
                placeholder="100"
                @keydown="handleCustomKeydown"
              />
              <button class="custom-scale-apply" @click="applyCustomScale">적용</button>
              <button class="custom-scale-cancel" @click="showCustomInput = false">취소</button>
            </div>
          </div>
          <div class="setting-row">
            <label class="setting-label">좌표계</label>
            <select
              class="setting-select"
              :value="s.coordinate.system"
              @change="s.coordinate.system = ($event.target as HTMLSelectElement).value as 'world' | 'user'"
            >
              <option value="world">세계 좌표계</option>
              <option value="user">사용자 좌표계</option>
            </select>
          </div>
        </div>

        <!-- 스타일 설정 -->
        <div v-if="activeTab === 'style'" class="settings-section">
          <div class="setting-row">
            <label class="setting-label">치수 문자 색상</label>
            <input
              type="color"
              class="setting-color"
              :value="s.style.textColor"
              @input="s.style.textColor = ($event.target as HTMLInputElement).value"
            >
          </div>
          <div class="setting-row">
            <label class="setting-label">치수 선 색상</label>
            <input
              type="color"
              class="setting-color"
              :value="s.style.lineColor"
              @input="s.style.lineColor = ($event.target as HTMLInputElement).value"
            >
          </div>
          <div class="setting-row">
            <label class="setting-label">치수 높이</label>
            <input
              type="number"
              class="setting-input"
              :value="s.style.textHeight"
              min="8"
              max="32"
              @input="s.style.textHeight = Number(($event.target as HTMLInputElement).value)"
            >
          </div>
          <div class="setting-row">
            <label class="setting-label">화살표 크기</label>
            <input
              type="number"
              class="setting-input"
              :value="s.style.arrowSize"
              min="4"
              max="20"
              @input="s.style.arrowSize = Number(($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>

        <!-- 길이 설정 -->
        <div v-if="activeTab === 'length'" class="settings-section">
          <table class="settings-table">
            <thead>
              <tr>
                <th>측정 유형</th>
                <th>단위</th>
                <th>정밀도</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>거리/정렬/선형</td>
                <td>
                  <select
                    class="setting-select-sm"
                    :value="s.length.unit"
                    @change="settingsStore.setLengthUnit(($event.target as HTMLSelectElement).value as any)"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </select>
                </td>
                <td>
                  <select
                    class="setting-select-sm"
                    :value="s.length.precision"
                    @change="settingsStore.setLengthPrecision(Number(($event.target as HTMLSelectElement).value))"
                  >
                    <option value="0">0</option>
                    <option value="1">0.0</option>
                    <option value="2">0.00</option>
                    <option value="3">0.000</option>
                    <option value="4">0.0000</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>면적</td>
                <td>
                  <select
                    class="setting-select-sm"
                    :value="s.area.unit"
                    @change="settingsStore.setAreaUnit(($event.target as HTMLSelectElement).value as any)"
                  >
                    <option value="mm²">mm²</option>
                    <option value="cm²">cm²</option>
                    <option value="m²">m²</option>
                  </select>
                </td>
                <td>
                  <select
                    class="setting-select-sm"
                    :value="s.area.precision"
                    @change="s.area.precision = Number(($event.target as HTMLSelectElement).value)"
                  >
                    <option value="0">0</option>
                    <option value="1">0.0</option>
                    <option value="2">0.00</option>
                    <option value="3">0.000</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>좌표</td>
                <td>-</td>
                <td>
                  <select
                    class="setting-select-sm"
                    :value="s.coordinate.precision"
                    @change="s.coordinate.precision = Number(($event.target as HTMLSelectElement).value)"
                  >
                    <option value="0">0</option>
                    <option value="1">0.0</option>
                    <option value="2">0.00</option>
                    <option value="3">0.000</option>
                    <option value="4">0.0000</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 각도 설정 -->
        <div v-if="activeTab === 'angle'" class="settings-section">
          <div class="setting-row">
            <label class="setting-label">단위 형식</label>
            <select
              class="setting-select"
              :value="s.angle.unit"
              @change="s.angle.unit = ($event.target as HTMLSelectElement).value as 'decimal' | 'dms'"
            >
              <option value="decimal">십진수</option>
              <option value="dms">도/분/초</option>
            </select>
          </div>
          <div class="setting-row">
            <label class="setting-label">단위 정밀도</label>
            <select
              class="setting-select"
              :value="s.angle.precision"
              @change="settingsStore.setAnglePrecision(Number(($event.target as HTMLSelectElement).value))"
            >
              <option value="0">0</option>
              <option value="1">0.0</option>
              <option value="2">0.00</option>
            </select>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="dialog-btn dialog-btn--default" @click="settingsStore.resetToDefaults()">
          기본값 복원
        </button>
        <button class="dialog-btn dialog-btn--primary" @click="emit('close')">
          확인
        </button>
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
  background: rgba(0, 0, 0, 0.6);
  z-index: var(--cad-z-modal, 200);
}

.dialog {
  width: 480px;
  max-height: 80vh;
  background: var(--cad-bg-panel);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-lg, 8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cad-space-3) var(--cad-space-4, 16px);
  border-bottom: 1px solid var(--cad-border-default);
}

.dialog-title {
  font-size: var(--cad-text-md);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-primary);
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--cad-text-muted);
  cursor: pointer;
  border-radius: var(--cad-radius-sm);
}

.dialog-close:hover {
  background: rgba(255, 68, 68, 0.2);
  color: #FF4444;
}

.dialog-tabs {
  display: flex;
  gap: 1px;
  padding: 0 var(--cad-space-3);
  border-bottom: 1px solid var(--cad-border-default);
  background: var(--cad-bg-tab, var(--cad-bg-panel));
}

.dialog-tab {
  padding: var(--cad-space-2) var(--cad-space-3);
  font-size: var(--cad-text-sm);
  color: var(--cad-text-secondary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.dialog-tab:hover {
  color: var(--cad-text-primary);
}

.dialog-tab--active {
  color: var(--cad-text-primary);
  border-bottom-color: var(--cad-accent-primary);
}

.dialog-body {
  flex: 1;
  padding: var(--cad-space-4, 16px);
  overflow-y: auto;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--cad-space-3);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cad-space-3);
}

.setting-label {
  font-size: var(--cad-text-sm);
  color: var(--cad-text-secondary);
  min-width: 100px;
}

.setting-value-display {
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-md);
  font-weight: var(--cad-font-semibold);
  color: #60A5FA;
}

.setting-select,
.setting-input {
  flex: 1;
  max-width: 200px;
  padding: 4px 8px;
  font-size: var(--cad-text-sm);
  color: var(--cad-text-primary);
  background: var(--cad-bg-app);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-sm);
}

.setting-select:focus,
.setting-input:focus {
  outline: none;
  border-color: var(--cad-accent-primary);
}

.setting-color {
  width: 40px;
  height: 28px;
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  background: transparent;
  padding: 2px;
}

.scale-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.scale-button {
  padding: 6px 4px;
  font-size: var(--cad-text-xs);
  font-family: var(--cad-font-mono);
  color: var(--cad-text-secondary);
  background: var(--cad-bg-app);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.scale-button:hover {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.scale-button--active {
  background: var(--cad-accent-active-bg);
  color: var(--cad-accent-active-text);
  border-color: var(--cad-accent-primary);
}

.settings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--cad-text-sm);
}

.settings-table th {
  text-align: left;
  padding: 6px 8px;
  color: var(--cad-text-muted);
  font-weight: var(--cad-font-medium);
  border-bottom: 1px solid var(--cad-border-default);
  font-size: var(--cad-text-xs);
}

.settings-table td {
  padding: 6px 8px;
  color: var(--cad-text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-select-sm {
  width: 100%;
  padding: 3px 6px;
  font-size: var(--cad-text-xs);
  color: var(--cad-text-primary);
  background: var(--cad-bg-app);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-sm);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--cad-space-2);
  padding: var(--cad-space-3) var(--cad-space-4, 16px);
  border-top: 1px solid var(--cad-border-default);
}

.dialog-btn {
  padding: 6px 16px;
  font-size: var(--cad-text-sm);
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  border: 1px solid var(--cad-border-default);
  transition: all var(--cad-transition-fast);
}

.dialog-btn--default {
  background: transparent;
  color: var(--cad-text-secondary);
}

.dialog-btn--default:hover {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.dialog-btn--primary {
  background: var(--cad-accent-primary);
  color: var(--cad-text-primary);
  border-color: var(--cad-accent-primary);
}

.dialog-btn--primary:hover {
  background: var(--cad-accent-hover);
}

/* ─── 사용자 정의 축척 입력 ─── */
.custom-scale-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cad-space-3);
  padding: var(--cad-space-2) 0;
  border-top: 1px solid var(--cad-border-default);
  margin-top: var(--cad-space-1);
}

.custom-scale-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.custom-scale-prefix {
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-sm);
  color: var(--cad-text-secondary);
  font-weight: var(--cad-font-semibold);
}

.custom-scale-input {
  width: 80px !important;
  flex: none !important;
  text-align: right;
}

.custom-scale-apply,
.custom-scale-cancel {
  padding: 4px 10px;
  font-size: var(--cad-text-xs);
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  border: 1px solid var(--cad-border-default);
  transition: all var(--cad-transition-fast);
}

.custom-scale-apply {
  background: var(--cad-accent-primary);
  color: #fff;
  border-color: var(--cad-accent-primary);
}

.custom-scale-apply:hover {
  background: var(--cad-accent-hover);
}

.custom-scale-cancel {
  background: transparent;
  color: var(--cad-text-secondary);
}

.custom-scale-cancel:hover {
  background: var(--cad-hover-bg);
}
</style>
