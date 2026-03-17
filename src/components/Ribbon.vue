<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { useMarkupStore } from '@/stores/markup'
import { useToastStore } from '@/stores/toast'
import {
  FolderOpenIcon,
  Undo2Icon,
  Redo2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  FileIcon,
  SaveIcon,
  DownloadIcon,
  RulerIcon,
  SquareIcon,
  TriangleRightIcon,
  LayersIcon,
  TypeIcon,
  CircleIcon,
  ArrowRightIcon,
  ListTreeIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-vue-next'

const measureStore = useMeasurementStore()
const markupStore = useMarkupStore()
const toastStore = useToastStore()

const emit = defineEmits<{
  openFile: []
}>()

const store = useAppStore()

// 파일 메뉴 토글
const isFileMenuOpen = ref(false)

// 리본 탭
const ribbonTabs = [
  { id: 'home', label: 'Home' },
  { id: 'annotate', label: 'Annotate' },
  { id: 'insert', label: 'Insert' },
  { id: 'parametric', label: 'Parametric' },
  { id: 'views', label: 'Views' },
  { id: 'manage', label: 'Manage' },
  { id: 'export', label: 'Export' },
] as const

const activeRibbonTab = ref<string>('home')

function handleFileMenuClick() {
  isFileMenuOpen.value = !isFileMenuOpen.value
}

function handleOpenFile() {
  isFileMenuOpen.value = false
  emit('openFile')
}

function closeFileMenu() {
  isFileMenuOpen.value = false
}

function handleMarkupSave() {
  const fileName = store.currentFile ?? 'untitled'
  const data = markupStore.exportToJson(fileName)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName.replace(/\.[^.]+$/, '')}_markup.json`
  a.click()
  URL.revokeObjectURL(url)
  toastStore.show('마크업을 저장했습니다', 'success', 2000)
}

function handleMarkupLoad() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      markupStore.importFromJson(data)
      toastStore.show('마크업을 불러왔습니다', 'success', 2000)
    } catch {
      toastStore.show('마크업 파일을 읽을 수 없습니다', 'error')
    }
  }
  input.click()
}
</script>

<template>
  <header class="ribbon-root">
    <!-- Quick Access Toolbar (8px height row) -->
    <div class="quick-access-toolbar">
      <div class="flex items-center gap-1">
        <span class="app-title">Clip-inView</span>
        <div class="qat-divider" />
        <button
          class="qat-button"
          title="열기 (Ctrl+O)"
          @click="emit('openFile')"
        >
          <FolderOpenIcon :size="14" :stroke-width="1.5" />
        </button>
        <button class="qat-button" title="실행 취소 (Ctrl+Z)" disabled>
          <Undo2Icon :size="14" :stroke-width="1.5" />
        </button>
        <button class="qat-button" title="다시 실행 (Ctrl+Y)" disabled>
          <Redo2Icon :size="14" :stroke-width="1.5" />
        </button>
      </div>

      <!-- 접기/펼치기 버튼 -->
      <button
        class="qat-button"
        :title="store.isRibbonCollapsed ? '리본 펼치기' : '리본 접기'"
        @click="store.toggleRibbon()"
      >
        <ChevronUpIcon v-if="!store.isRibbonCollapsed" :size="14" :stroke-width="1.5" />
        <ChevronDownIcon v-else :size="14" :stroke-width="1.5" />
      </button>
    </div>

    <!-- Ribbon Tabs Row -->
    <div class="ribbon-tabs-row">
      <!-- File 메뉴 버튼 -->
      <div class="relative">
        <button
          class="file-menu-button"
          :class="{ 'file-menu-button--active': isFileMenuOpen }"
          @click="handleFileMenuClick"
        >
          File
        </button>

        <!-- File 드롭다운 메뉴 -->
        <div
          v-if="isFileMenuOpen"
          class="file-dropdown"
          @mouseleave="closeFileMenu"
        >
          <button class="file-dropdown-item" @click="handleOpenFile">
            <FolderOpenIcon :size="16" :stroke-width="1.5" />
            <span>Open</span>
            <span class="file-dropdown-shortcut">Ctrl+O</span>
          </button>
          <button class="file-dropdown-item" disabled>
            <FileIcon :size="16" :stroke-width="1.5" />
            <span>New</span>
          </button>
          <button class="file-dropdown-item" disabled>
            <SaveIcon :size="16" :stroke-width="1.5" />
            <span>Save</span>
          </button>
          <div class="file-dropdown-separator" />
          <button class="file-dropdown-item" disabled>
            <DownloadIcon :size="16" :stroke-width="1.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <!-- 리본 탭 목록 -->
      <button
        v-for="tab in ribbonTabs"
        :key="tab.id"
        class="ribbon-tab"
        :class="{ 'ribbon-tab--active': activeRibbonTab === tab.id }"
        @click="activeRibbonTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Ribbon Panels (접힘 시 숨김) -->
    <div v-if="!store.isRibbonCollapsed" class="ribbon-panels">
      <div v-if="activeRibbonTab === 'home'" class="ribbon-panel-content">
        <div class="ribbon-panel">
          <div class="ribbon-panel-title">Measure</div>
          <div class="ribbon-panel-body">
            <button class="ribbon-tool-button" title="거리 측정 (D)" @click="measureStore.setMeasureMode('distance'); store.setActiveTool('measure-distance')">
              <RulerIcon :size="20" :stroke-width="1.5" />
              <span>거리</span>
            </button>
            <button class="ribbon-tool-button" title="면적 측정" @click="measureStore.setMeasureMode('area'); store.setActiveTool('measure-area')">
              <SquareIcon :size="20" :stroke-width="1.5" />
              <span>면적</span>
            </button>
            <button class="ribbon-tool-button" title="각도 측정" @click="measureStore.setMeasureMode('angle'); store.setActiveTool('measure-angle')">
              <TriangleRightIcon :size="20" :stroke-width="1.5" />
              <span>각도</span>
            </button>
          </div>
        </div>
        <div class="ribbon-panel-divider" />
        <div class="ribbon-panel">
          <div class="ribbon-panel-title">Markup</div>
          <div class="ribbon-panel-body">
            <button class="ribbon-tool-button" title="텍스트 마크업 (T)" @click="markupStore.setMarkupType('text'); store.setActiveTool('markup-text')">
              <TypeIcon :size="20" :stroke-width="1.5" />
              <span>텍스트</span>
            </button>
            <button class="ribbon-tool-button" title="사각형 마크업" @click="markupStore.setMarkupType('rect'); store.setActiveTool('markup-rect')">
              <SquareIcon :size="20" :stroke-width="1.5" />
              <span>사각형</span>
            </button>
            <button class="ribbon-tool-button" title="원 마크업" @click="markupStore.setMarkupType('circle'); store.setActiveTool('markup-circle')">
              <CircleIcon :size="20" :stroke-width="1.5" />
              <span>원</span>
            </button>
            <button class="ribbon-tool-button" title="화살표 마크업" @click="markupStore.setMarkupType('arrow'); store.setActiveTool('markup-arrow')">
              <ArrowRightIcon :size="20" :stroke-width="1.5" />
              <span>화살표</span>
            </button>
          </div>
        </div>
        <div class="ribbon-panel-divider" />
        <div class="ribbon-panel">
          <div class="ribbon-panel-title">Markup I/O</div>
          <div class="ribbon-panel-body">
            <button class="ribbon-tool-button" title="마크업 저장 (JSON)" @click="handleMarkupSave">
              <SaveIcon :size="20" :stroke-width="1.5" />
              <span>저장</span>
            </button>
            <button class="ribbon-tool-button" title="마크업 불러오기" @click="handleMarkupLoad">
              <UploadIcon :size="20" :stroke-width="1.5" />
              <span>불러오기</span>
            </button>
            <button class="ribbon-tool-button" title="마크업 전체 삭제" @click="markupStore.clearMarkups()">
              <Trash2Icon :size="20" :stroke-width="1.5" />
              <span>지우기</span>
            </button>
          </div>
        </div>
        <div class="ribbon-panel-divider" />
        <div class="ribbon-panel">
          <div class="ribbon-panel-title">Panels</div>
          <div class="ribbon-panel-body">
            <button class="ribbon-tool-button" title="레이어 패널" @click="store.toggleLayerPanel()">
              <LayersIcon :size="20" :stroke-width="1.5" />
              <span>레이어</span>
            </button>
            <button class="ribbon-tool-button" title="BOM 트리 패널" @click="store.toggleBomPanel()">
              <ListTreeIcon :size="20" :stroke-width="1.5" />
              <span>BOM</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 다른 탭의 패널 (M1에서는 placeholder) -->
      <div v-else class="ribbon-panel-content">
        <div class="ribbon-panel">
          <div class="ribbon-panel-body">
            <span class="ribbon-panel-placeholder">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.ribbon-root {
  background: var(--cad-bg-panel);
  border-bottom: 1px solid var(--cad-border-default);
  user-select: none;
}

/* Quick Access Toolbar */
.quick-access-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--cad-quick-access-height);
  padding: 0 var(--cad-space-2);
  background: var(--cad-bg-app);
  border-bottom: 1px solid var(--cad-border-default);
}

.app-title {
  font-size: var(--cad-text-sm);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-accent-active-text);
  padding: 0 var(--cad-space-2);
}

.qat-divider {
  width: 1px;
  height: 16px;
  background: var(--cad-border-default);
  margin: 0 var(--cad-space-1);
}

.qat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--cad-radius-sm);
  color: var(--cad-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.qat-button:hover:not(:disabled) {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.qat-button:disabled {
  opacity: 0.4;
  cursor: default;
}

/* Ribbon Tabs Row */
.ribbon-tabs-row {
  display: flex;
  align-items: center;
  height: var(--cad-ribbon-tab-height);
  padding: 0 var(--cad-space-1);
  background: var(--cad-bg-tab);
  gap: 1px;
}

.file-menu-button {
  padding: var(--cad-space-1) var(--cad-space-3);
  font-size: var(--cad-text-base);
  font-weight: var(--cad-font-medium);
  color: var(--cad-text-primary);
  background: var(--cad-accent-primary);
  border: none;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: background var(--cad-transition-fast);
}

.file-menu-button:hover,
.file-menu-button--active {
  background: var(--cad-accent-hover);
}

.ribbon-tab {
  padding: var(--cad-space-1) var(--cad-space-3);
  font-size: var(--cad-text-sm);
  color: var(--cad-text-secondary);
  background: transparent;
  border: none;
  border-top: 2px solid transparent;
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.ribbon-tab:hover {
  color: var(--cad-text-primary);
  background: var(--cad-hover-bg);
}

.ribbon-tab--active {
  color: var(--cad-text-primary);
  border-top-color: var(--cad-accent-primary);
  background: var(--cad-bg-panel);
}

/* Ribbon Panels */
.ribbon-panels {
  height: var(--cad-ribbon-panel-height);
  border-top: 1px solid var(--cad-border-default);
  overflow: hidden;
}

.ribbon-panel-content {
  display: flex;
  align-items: stretch;
  height: 100%;
  padding: var(--cad-space-1) var(--cad-space-2);
  gap: var(--cad-space-1);
}

.ribbon-panel {
  display: flex;
  flex-direction: column;
  min-width: 80px;
}

.ribbon-panel-title {
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  text-align: center;
  padding-top: var(--cad-space-1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ribbon-panel-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--cad-space-1);
}

.ribbon-panel-placeholder {
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
  font-style: italic;
}

.ribbon-tool-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--cad-space-1);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
  min-width: 48px;
}

.ribbon-tool-button:hover {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.ribbon-tool-button:active {
  background: var(--cad-accent-active-bg);
  color: var(--cad-accent-active-text);
}

.ribbon-panel-divider {
  width: 1px;
  background: var(--cad-border-default);
  margin: var(--cad-space-2) 0;
}

/* File Dropdown */
.file-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 220px;
  background: var(--cad-bg-panel);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-md);
  box-shadow: var(--cad-shadow-md);
  z-index: var(--cad-z-dropdown);
  padding: var(--cad-space-1) 0;
}

.file-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  width: 100%;
  padding: var(--cad-space-2) var(--cad-space-3);
  font-size: var(--cad-text-sm);
  color: var(--cad-text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--cad-transition-fast);
}

.file-dropdown-item:hover:not(:disabled) {
  background: var(--cad-hover-bg);
}

.file-dropdown-item:disabled {
  color: var(--cad-text-muted);
  cursor: default;
}

.file-dropdown-shortcut {
  margin-left: auto;
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
}

.file-dropdown-separator {
  height: 1px;
  background: var(--cad-border-default);
  margin: var(--cad-space-1) 0;
}
</style>
