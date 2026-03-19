<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useHistoryStore } from '@/stores/history'
import { useMeasurementStore } from '@/stores/measurement'
import { useMarkupStore } from '@/stores/markup'
import {
  Undo2Icon,
  Redo2Icon,
  FolderOpenIcon,
  SaveIcon,
  PrinterIcon,
  Maximize2Icon,
  ShieldCheckIcon,
} from 'lucide-vue-next'

const store = useAppStore()
const historyStore = useHistoryStore()
const measureStore = useMeasurementStore()
const markupStore = useMarkupStore()

function handleOpenFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dwg,.dxf'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) {
      window.dispatchEvent(new CustomEvent('cad:open-file', { detail: file }))
    }
  }
  input.click()
}

function handleFitExtents() {
  window.dispatchEvent(new CustomEvent('cad:fit-extents'))
}

function handlePrint() {
  import('@/utils/exporter').then(({ printDrawing }) => printDrawing())
}

function handleSaveMarkup() {
  if (markupStore.markups.length === 0) return
  const fileName = store.currentFile ?? 'untitled'
  const data = markupStore.exportToJson(fileName)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName.replace(/\.[^.]+$/, '')}_markup.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <header class="titlebar-root">
    <!-- 좌측: 퀵 액세스 + 로고 + 파일명 -->
    <div class="titlebar-left">
      <div class="quick-access">
        <button
          class="qa-btn"
          title="파일 열기 (Ctrl+O)"
          @click="handleOpenFile"
        >
          <FolderOpenIcon :size="13" :stroke-width="1.5" />
        </button>
        <button
          class="qa-btn"
          title="마크업 저장"
          :disabled="markupStore.markups.length === 0"
          @click="handleSaveMarkup"
        >
          <SaveIcon :size="13" :stroke-width="1.5" />
        </button>
        <button
          class="qa-btn"
          title="실행 취소 (Ctrl+Z)"
          :disabled="!historyStore.canUndo"
          @click="historyStore.undo()"
        >
          <Undo2Icon :size="13" :stroke-width="1.5" />
        </button>
        <button
          class="qa-btn"
          title="다시 실행 (Ctrl+Y)"
          :disabled="!historyStore.canRedo"
          @click="historyStore.redo()"
        >
          <Redo2Icon :size="13" :stroke-width="1.5" />
        </button>
        <div class="qa-divider" />
        <button
          class="qa-btn"
          title="전체보기 (Home)"
          :disabled="!store.isFileLoaded"
          @click="handleFitExtents"
        >
          <Maximize2Icon :size="13" :stroke-width="1.5" />
        </button>
        <button
          class="qa-btn"
          title="인쇄"
          :disabled="!store.isFileLoaded"
          @click="handlePrint"
        >
          <PrinterIcon :size="13" :stroke-width="1.5" />
        </button>
      </div>

      <div class="titlebar-divider" />

      <!-- 앱 아이덴티티 -->
      <div class="app-identity">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="app-logo-svg">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="var(--cad-accent-primary)" stroke-width="1.5" />
          <path d="M7 17V7h3l4 8 4-8h3v10" stroke="var(--cad-accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="app-title">Clip-inView</span>
      </div>

      <div class="titlebar-divider" />

      <!-- 파일명 -->
      <span v-if="store.currentFile" class="file-name" :title="store.currentFile">
        {{ store.currentFile }}
      </span>
      <span v-else class="file-name file-name--empty">파일을 열어주세요</span>
    </div>

    <!-- 중앙: 측정 모드 표시 (활성 시) -->
    <div class="titlebar-center">
      <template v-if="measureStore.isActive">
        <span class="active-mode-badge active-mode-badge--measure">
          {{ store.activeToolLabel }}
        </span>
      </template>
      <template v-else-if="markupStore.isActive">
        <span class="active-mode-badge active-mode-badge--markup">
          {{ store.activeToolLabel }}
        </span>
      </template>
    </div>

    <!-- 우측: 보안 뱃지 + 버전 -->
    <div class="titlebar-right">
      <div class="security-badge" title="온프레미스 보안 뷰어 — 도면이 외부로 전송되지 않습니다">
        <ShieldCheckIcon :size="12" :stroke-width="1.5" />
        <span>온프레미스</span>
      </div>
      <span class="titlebar-version">v1.0</span>
    </div>
  </header>
</template>

<style scoped>
.titlebar-root {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 var(--cad-space-2) 0 var(--cad-space-2);
  background: var(--cad-bg-app);
  border-bottom: 1px solid var(--cad-border-default);
  user-select: none;
  gap: var(--cad-space-3);
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  min-width: 0;
  flex: 1;
}

/* ─── 퀵 액세스 툴바 ─── */
.quick-access {
  display: flex;
  align-items: center;
  gap: 1px;
}

.qa-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--cad-radius-sm);
  color: var(--cad-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.qa-btn:hover:not(:disabled) {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.qa-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.qa-divider {
  width: 1px;
  height: 14px;
  background: var(--cad-border-default);
  margin: 0 2px;
}

/* ─── 앱 아이덴티티 ─── */
.app-identity {
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-logo-svg {
  flex-shrink: 0;
}

.app-title {
  font-size: var(--cad-text-sm);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-primary);
  white-space: nowrap;
  letter-spacing: -0.2px;
}

.titlebar-divider {
  width: 1px;
  height: 16px;
  background: var(--cad-border-default);
  flex-shrink: 0;
}

.file-name {
  font-size: var(--cad-text-xs);
  color: var(--cad-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name--empty {
  color: var(--cad-text-muted);
  font-style: italic;
}

/* ─── 중앙: 활성 모드 표시 ─── */
.titlebar-center {
  display: flex;
  align-items: center;
  gap: var(--cad-space-1);
}

.active-mode-badge {
  padding: 2px 10px;
  font-size: 10px;
  font-weight: var(--cad-font-semibold);
  border-radius: var(--cad-radius-full);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.active-mode-badge--measure {
  background: rgba(96, 165, 250, 0.15);
  color: #60A5FA;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.active-mode-badge--markup {
  background: rgba(255, 68, 68, 0.15);
  color: #FF6B6B;
  border: 1px solid rgba(255, 68, 68, 0.3);
}

/* ─── 우측 ─── */
.titlebar-right {
  display: flex;
  align-items: center;
  gap: var(--cad-space-3);
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: var(--cad-font-medium);
  color: var(--cad-status-success);
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: var(--cad-radius-full);
  cursor: default;
}

.titlebar-version {
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  font-family: var(--cad-font-mono);
}
</style>
