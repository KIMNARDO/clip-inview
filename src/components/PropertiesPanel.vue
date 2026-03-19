<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { useMeasurementSettingsStore } from '@/stores/measurementSettings'
import { useMarkupStore } from '@/stores/markup'
import { formatFileSize } from '@/utils/format'
import { formatMeasurement } from '@/utils/measurement'
import {
  Settings2Icon,
  XIcon,
  FileIcon,
  RulerIcon,
  StickyNoteIcon,
  InfoIcon,
} from 'lucide-vue-next'

const store = useAppStore()
const measureStore = useMeasurementStore()
const settingsStore = useMeasurementSettingsStore()
const markupStore = useMarkupStore()

const measurementCount = computed(() => measureStore.measurements.length)
const markupCount = computed(() => markupStore.markups.length)
</script>

<template>
  <aside class="properties-root">
    <!-- 헤더 -->
    <div class="properties-header">
      <div class="properties-header-left">
        <Settings2Icon :size="14" :stroke-width="1.5" />
        <span>속성</span>
      </div>
      <button
        class="close-button"
        title="패널 닫기"
        @click="store.togglePropertiesPanel()"
      >
        <XIcon :size="14" :stroke-width="1.5" />
      </button>
    </div>

    <div v-if="store.fileInfo" class="properties-content">
      <!-- 파일 정보 -->
      <div class="property-section">
        <div class="section-header">
          <FileIcon :size="13" :stroke-width="1.5" />
          <span>파일 정보</span>
        </div>
        <div class="property-grid">
          <div class="prop-row">
            <span class="prop-key">파일명</span>
            <span class="prop-val prop-val--mono" :title="store.fileInfo.name">
              {{ store.fileInfo.name }}
            </span>
          </div>
          <div class="prop-row">
            <span class="prop-key">크기</span>
            <span class="prop-val">{{ formatFileSize(store.fileInfo.size) }}</span>
          </div>
          <div class="prop-row">
            <span class="prop-key">형식</span>
            <span class="prop-val prop-val--badge">{{ store.fileInfo.type.toUpperCase() }}</span>
          </div>
        </div>
      </div>

      <!-- 뷰 정보 -->
      <div class="property-section">
        <div class="section-header">
          <InfoIcon :size="13" :stroke-width="1.5" />
          <span>뷰 정보</span>
        </div>
        <div class="property-grid">
          <div class="prop-row">
            <span class="prop-key">줌</span>
            <span class="prop-val prop-val--mono">{{ store.formattedZoom }}</span>
          </div>
          <div class="prop-row">
            <span class="prop-key">축척</span>
            <span class="prop-val prop-val--accent">{{ settingsStore.settings.scale.label }}</span>
          </div>
          <div class="prop-row">
            <span class="prop-key">단위</span>
            <span class="prop-val">{{ settingsStore.settings.length.unit }}</span>
          </div>
        </div>
      </div>

      <!-- 측정 요약 -->
      <div class="property-section">
        <div class="section-header">
          <RulerIcon :size="13" :stroke-width="1.5" />
          <span>측정 ({{ measurementCount }})</span>
        </div>
        <div v-if="measurementCount === 0" class="section-empty">
          측정 결과 없음
        </div>
        <div v-else class="measurement-list">
          <div
            v-for="m in measureStore.measurements"
            :key="m.id"
            class="measurement-item"
          >
            <span class="measurement-type">
              {{ { distance: '거리', area: '면적', angle: '각도', coordinate: '좌표', 'arc-length': '호', 'point-to-line': '점-선', object: '객체' }[m.type] ?? m.type }}
            </span>
            <span class="measurement-val">
              {{ m.type === 'coordinate' && m.points.length > 0
                ? `(${m.points[0]!.x.toFixed(2)}, ${m.points[0]!.y.toFixed(2)})`
                : formatMeasurement(m.value, m.unit) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 마크업 요약 -->
      <div class="property-section">
        <div class="section-header">
          <StickyNoteIcon :size="13" :stroke-width="1.5" />
          <span>주석 ({{ markupCount }})</span>
        </div>
        <div v-if="markupCount === 0" class="section-empty">
          주석 없음
        </div>
        <div v-else class="markup-summary">
          <div
            v-for="m in markupStore.markups.slice(0, 10)"
            :key="m.id"
            class="markup-item"
          >
            <span class="markup-type-badge" :style="{ borderColor: m.style.color }">
              {{ { text: 'T', rect: '□', circle: '○', arrow: '→', line: '─', ellipse: '⬭', revcloud: '☁', leader: '↗', freehand: '✎' }[m.type] }}
            </span>
            <span class="markup-desc">
              {{ m.text ? m.text.substring(0, 20) : m.type }}
            </span>
          </div>
          <div v-if="markupCount > 10" class="section-more">
            +{{ markupCount - 10 }}개 더
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="properties-empty">
      <div class="empty-icon-wrap">
        <RulerIcon :size="28" :stroke-width="1" class="empty-ruler-icon" />
      </div>
      <p>DWG/DXF 파일을 열면<br />도면 정보가 표시됩니다</p>
      <p class="empty-hint">Ctrl+O 또는 좌측 '열기' 버튼</p>
    </div>
  </aside>
</template>

<style scoped>
.properties-root {
  width: var(--cad-properties-width);
  display: flex;
  flex-direction: column;
  background: var(--cad-bg-panel);
  border-left: 1px solid var(--cad-border-default);
  overflow-y: auto;
}

.properties-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cad-space-2) var(--cad-space-3);
  border-bottom: 1px solid var(--cad-border-default);
  flex-shrink: 0;
}

.properties-header-left {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  font-size: var(--cad-text-sm);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-primary);
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--cad-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.close-button:hover {
  background: rgba(255, 68, 68, 0.2);
  color: #FF4444;
}

.properties-content {
  flex: 1;
  overflow-y: auto;
}

/* ─── 섹션 ─── */
.property-section {
  border-bottom: 1px solid var(--cad-border-default);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  padding: var(--cad-space-2) var(--cad-space-3);
  font-size: var(--cad-text-xs);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-secondary);
  background: rgba(0, 0, 0, 0.15);
}

.property-grid {
  padding: var(--cad-space-1) var(--cad-space-3) var(--cad-space-2);
}

.prop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  font-size: var(--cad-text-xs);
}

.prop-key {
  color: var(--cad-text-muted);
  min-width: 48px;
}

.prop-val {
  color: var(--cad-text-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.prop-val--mono {
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-2xs);
}

.prop-val--badge {
  background: rgba(59, 130, 246, 0.15);
  color: var(--cad-accent-active-text);
  padding: 1px 8px;
  border-radius: var(--cad-radius-full);
  font-size: var(--cad-text-2xs);
  font-weight: var(--cad-font-semibold);
}

.prop-val--accent {
  color: var(--cad-accent-active-text);
  font-weight: var(--cad-font-semibold);
}

/* ─── 측정 목록 ─── */
.measurement-list {
  padding: 0 var(--cad-space-2) var(--cad-space-2);
}

.measurement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px var(--cad-space-1);
  border-radius: var(--cad-radius-sm);
  font-size: var(--cad-text-xs);
}

.measurement-item:hover {
  background: var(--cad-hover-bg);
}

.measurement-type {
  color: var(--cad-text-muted);
  font-size: var(--cad-text-2xs);
}

.measurement-val {
  color: #60A5FA;
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-xs);
  font-weight: var(--cad-font-medium);
}

/* ─── 마크업 요약 ─── */
.markup-summary {
  padding: 0 var(--cad-space-2) var(--cad-space-2);
}

.markup-item {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  padding: 3px var(--cad-space-1);
  font-size: var(--cad-text-xs);
  border-radius: var(--cad-radius-sm);
}

.markup-item:hover {
  background: var(--cad-hover-bg);
}

.markup-type-badge {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border: 1px solid;
  border-radius: var(--cad-radius-sm);
  color: var(--cad-text-secondary);
  flex-shrink: 0;
}

.markup-desc {
  color: var(--cad-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-empty {
  padding: var(--cad-space-2) var(--cad-space-3);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  font-style: italic;
}

.section-more {
  padding: 2px var(--cad-space-1);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  text-align: center;
}

/* ─── 빈 상태 ─── */
.properties-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--cad-space-6);
  gap: var(--cad-space-2);
}

.empty-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.empty-ruler-icon {
  color: var(--cad-accent-primary);
  opacity: 0.5;
}

.properties-empty p {
  text-align: center;
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
  line-height: var(--cad-leading-relaxed);
}

.empty-hint {
  font-size: var(--cad-text-2xs) !important;
  color: var(--cad-text-muted) !important;
  opacity: 0.6;
}
</style>
