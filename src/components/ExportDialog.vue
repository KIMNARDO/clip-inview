<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import { exportToPdf, DEFAULT_PDF_OPTIONS } from '@/utils/exporter'
import type { PdfExportOptions } from '@/utils/exporter'
import { XIcon, FileTextIcon } from 'lucide-vue-next'

const store = useAppStore()
const toast = useToastStore()
const emit = defineEmits<{ close: [] }>()

const options = ref<PdfExportOptions>({ ...DEFAULT_PDF_OPTIONS })

const PAPER_SIZES = [
  { value: 'A0', label: 'A0 (841 × 1189 mm)' },
  { value: 'A1', label: 'A1 (594 × 841 mm)' },
  { value: 'A2', label: 'A2 (420 × 594 mm)' },
  { value: 'A3', label: 'A3 (297 × 420 mm)' },
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'Letter', label: 'Letter (216 × 279 mm)' },
] as const

function handleExport() {
  const success = exportToPdf(store.currentFile ?? undefined, options.value)
  if (success) {
    toast.show('PDF로 내보냈습니다', 'success', 2000)
  } else {
    toast.show('PDF 내보내기 실패: 캔버스를 캡처할 수 없습니다', 'error')
  }
  emit('close')
}

function handleOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('export-dialog-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="export-dialog-overlay" @click="handleOverlayClick">
      <div class="export-dialog">
        <!-- 헤더 -->
        <div class="export-dialog-header">
          <div class="export-dialog-header-left">
            <FileTextIcon :size="16" :stroke-width="1.5" />
            <span>PDF 내보내기</span>
          </div>
          <button class="export-dialog-close" @click="emit('close')">
            <XIcon :size="16" :stroke-width="1.5" />
          </button>
        </div>

        <!-- 본문 -->
        <div class="export-dialog-body">
          <!-- 용지 크기 -->
          <div class="export-field">
            <label class="export-label">용지 크기</label>
            <select v-model="options.paperSize" class="export-select">
              <option
                v-for="size in PAPER_SIZES"
                :key="size.value"
                :value="size.value"
              >
                {{ size.label }}
              </option>
            </select>
          </div>

          <!-- 방향 -->
          <div class="export-field">
            <label class="export-label">방향</label>
            <div class="export-radio-group">
              <label class="export-radio">
                <input
                  type="radio"
                  v-model="options.orientation"
                  value="landscape"
                />
                <span>가로</span>
              </label>
              <label class="export-radio">
                <input
                  type="radio"
                  v-model="options.orientation"
                  value="portrait"
                />
                <span>세로</span>
              </label>
            </div>
          </div>

          <!-- 품질 -->
          <div class="export-field">
            <label class="export-label">
              품질 <span class="export-label-value">{{ Math.round(options.quality * 100) }}%</span>
            </label>
            <input
              type="range"
              v-model.number="options.quality"
              min="0.1"
              max="1"
              step="0.05"
              class="export-range"
            />
          </div>

          <!-- 여백 -->
          <div class="export-field">
            <label class="export-label">
              여백 <span class="export-label-value">{{ options.margins }}mm</span>
            </label>
            <input
              type="range"
              v-model.number="options.margins"
              min="0"
              max="30"
              step="1"
              class="export-range"
            />
          </div>

          <!-- 배경 포함 -->
          <div class="export-field export-field--row">
            <label class="export-label">배경색 포함</label>
            <label class="export-toggle">
              <input type="checkbox" v-model="options.includeBackground" />
              <span class="export-toggle-track">
                <span class="export-toggle-thumb" />
              </span>
            </label>
          </div>
        </div>

        <!-- 푸터 -->
        <div class="export-dialog-footer">
          <button class="export-btn export-btn--cancel" @click="emit('close')">
            취소
          </button>
          <button class="export-btn export-btn--primary" @click="handleExport">
            내보내기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.export-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--cad-z-modal, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.export-dialog {
  width: 380px;
  background: var(--cad-bg-panel);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-lg, 10px);
  box-shadow: var(--cad-shadow-lg, 0 16px 48px rgba(0,0,0,0.4));
  overflow: hidden;
}

.export-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cad-space-3) var(--cad-space-4);
  border-bottom: 1px solid var(--cad-border-default);
}

.export-dialog-header-left {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  font-size: var(--cad-text-sm);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-primary);
}

.export-dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--cad-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
}

.export-dialog-close:hover {
  background: rgba(255, 68, 68, 0.2);
  color: #FF4444;
}

.export-dialog-body {
  padding: var(--cad-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--cad-space-3);
}

.export-field {
  display: flex;
  flex-direction: column;
  gap: var(--cad-space-1);
}

.export-field--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.export-label {
  font-size: var(--cad-text-xs);
  font-weight: var(--cad-font-medium);
  color: var(--cad-text-secondary);
}

.export-label-value {
  color: var(--cad-accent-active-text, #60A5FA);
  font-family: var(--cad-font-mono);
}

.export-select {
  padding: 6px 10px;
  font-size: var(--cad-text-xs);
  color: var(--cad-text-primary);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-sm);
  outline: none;
  cursor: pointer;
}

.export-select:focus {
  border-color: var(--cad-accent-primary);
}

.export-radio-group {
  display: flex;
  gap: var(--cad-space-3);
}

.export-radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--cad-text-xs);
  color: var(--cad-text-primary);
  cursor: pointer;
}

.export-radio input[type="radio"] {
  accent-color: var(--cad-accent-primary, #3B82F6);
}

.export-range {
  width: 100%;
  height: 4px;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.export-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--cad-accent-primary, #3B82F6);
  border-radius: 50%;
  cursor: pointer;
}

/* ─── 토글 스위치 ─── */
.export-toggle {
  cursor: pointer;
}

.export-toggle input {
  display: none;
}

.export-toggle-track {
  display: inline-flex;
  align-items: center;
  width: 34px;
  height: 18px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9px;
  padding: 2px;
  transition: background 150ms ease;
}

.export-toggle input:checked + .export-toggle-track {
  background: var(--cad-accent-primary, #3B82F6);
}

.export-toggle-thumb {
  display: block;
  width: 14px;
  height: 14px;
  background: #FFFFFF;
  border-radius: 50%;
  transition: transform 150ms ease;
}

.export-toggle input:checked + .export-toggle-track .export-toggle-thumb {
  transform: translateX(16px);
}

/* ─── 푸터 ─── */
.export-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--cad-space-2);
  padding: var(--cad-space-3) var(--cad-space-4);
  border-top: 1px solid var(--cad-border-default);
}

.export-btn {
  padding: 6px 16px;
  font-size: var(--cad-text-xs);
  font-weight: var(--cad-font-semibold);
  border-radius: var(--cad-radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.export-btn--cancel {
  color: var(--cad-text-secondary);
  background: transparent;
  border-color: var(--cad-border-default);
}

.export-btn--cancel:hover {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.export-btn--primary {
  color: #FFFFFF;
  background: var(--cad-accent-primary, #3B82F6);
  border-color: var(--cad-accent-primary, #3B82F6);
}

.export-btn--primary:hover {
  filter: brightness(1.1);
}
</style>
