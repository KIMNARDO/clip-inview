<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useMeasurementStore } from '@/stores/measurement'
import { Maximize2Icon } from 'lucide-vue-next'
import { formatMeasurement } from '@/utils/measurement'

const store = useAppStore()
const measureStore = useMeasurementStore()

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}
</script>

<template>
  <footer class="statusbar-root">
    <!-- 왼쪽: 좌표, 활성 도구 -->
    <div class="statusbar-left">
      <span class="statusbar-tool">{{ store.activeToolLabel }}</span>
      <span class="statusbar-divider" />
      <span class="statusbar-coords" title="월드 좌표">
        X: {{ store.formattedCoords.x }}
        Y: {{ store.formattedCoords.y }}
      </span>
      <template v-if="measureStore.lastMeasurement">
        <span class="statusbar-divider" />
        <span class="statusbar-measure" title="마지막 측정 결과">
          {{ formatMeasurement(measureStore.lastMeasurement.value, measureStore.lastMeasurement.unit) }}
        </span>
      </template>
    </div>

    <!-- 중앙: 토글 버튼 -->
    <div class="statusbar-center">
      <button
        class="toggle-button"
        :class="{ 'toggle-button--active': store.isGridEnabled }"
        title="그리드 표시"
        @click="store.toggleGrid()"
      >
        GRID
      </button>
      <button
        class="toggle-button"
        :class="{ 'toggle-button--active': store.isSnapEnabled }"
        title="스냅"
        @click="store.toggleSnap()"
      >
        SNAP
      </button>
      <button
        class="toggle-button"
        :class="{ 'toggle-button--active': store.isOrthoEnabled }"
        title="직교 모드"
        @click="store.toggleOrtho()"
      >
        ORTHO
      </button>
      <button
        class="toggle-button"
        :class="{ 'toggle-button--active': store.isOsnapEnabled }"
        title="객체 스냅"
        @click="store.toggleOsnap()"
      >
        OSNAP
      </button>
    </div>

    <!-- 오른쪽: 줌, 풀스크린 -->
    <div class="statusbar-right">
      <span class="statusbar-zoom" title="줌 레벨">{{ store.formattedZoom }}</span>
      <span class="statusbar-divider" />
      <button
        class="fullscreen-button"
        title="전체 화면 (F11)"
        @click="toggleFullscreen"
      >
        <Maximize2Icon :size="12" :stroke-width="1.5" />
      </button>
    </div>
  </footer>
</template>

<style scoped>
.statusbar-root {
  height: var(--cad-statusbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--cad-space-2);
  background: var(--cad-bg-panel);
  border-top: 1px solid var(--cad-border-default);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-secondary);
  user-select: none;
}

.statusbar-left,
.statusbar-center,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
}

.statusbar-tool {
  color: var(--cad-accent-active-text);
  font-weight: var(--cad-font-medium);
}

.statusbar-coords {
  font-family: var(--cad-font-mono);
  letter-spacing: 0.5px;
}

.statusbar-measure {
  font-family: var(--cad-font-mono);
  color: var(--cad-accent-active-text);
  letter-spacing: 0.5px;
}

.statusbar-zoom {
  font-family: var(--cad-font-mono);
}

.statusbar-divider {
  width: 1px;
  height: 14px;
  background: var(--cad-border-default);
}

.toggle-button {
  padding: 1px var(--cad-space-1);
  font-size: var(--cad-text-2xs);
  font-weight: var(--cad-font-medium);
  color: var(--cad-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
  letter-spacing: 0.5px;
}

.toggle-button:hover {
  color: var(--cad-text-secondary);
  background: var(--cad-hover-bg);
}

.toggle-button--active {
  color: var(--cad-accent-active-text);
  background: var(--cad-accent-active-bg);
  border-color: var(--cad-accent-active-border);
}

.fullscreen-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--cad-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.fullscreen-button:hover {
  color: var(--cad-text-primary);
  background: var(--cad-hover-bg);
}
</style>
