<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRightIcon } from 'lucide-vue-next'

const commandInput = ref('')
const history = ref<string[]>([
  '준비됨. DWG/DXF 파일을 열어 시작하세요.',
])

function handleSubmit() {
  if (!commandInput.value.trim()) return

  // M1에서는 명령 히스토리에 추가만 (실행은 M2+)
  history.value.push(`> ${commandInput.value}`)
  history.value.push(`알 수 없는 명령: ${commandInput.value}`)
  commandInput.value = ''
}
</script>

<template>
  <div class="command-root">
    <!-- 히스토리 영역 -->
    <div class="command-history">
      <div
        v-for="(line, idx) in history"
        :key="idx"
        class="command-history-line"
        :class="{ 'command-history-line--input': line.startsWith('>') }"
      >
        {{ line }}
      </div>
    </div>

    <!-- 입력줄 -->
    <form class="command-input-row" @submit.prevent="handleSubmit">
      <ChevronRightIcon :size="14" :stroke-width="2" class="command-prompt" />
      <input
        v-model="commandInput"
        type="text"
        placeholder="명령 입력..."
        class="command-input"
        spellcheck="false"
        autocomplete="off"
      />
    </form>
  </div>
</template>

<style scoped>
.command-root {
  display: flex;
  flex-direction: column;
  background: var(--cad-bg-app);
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-lg);
  box-shadow: var(--cad-shadow-xl);
  overflow: hidden;
  max-height: 160px;
}

.command-history {
  flex: 1;
  overflow-y: auto;
  padding: var(--cad-space-2) var(--cad-space-3);
  max-height: 100px;
}

.command-history-line {
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  line-height: 1.6;
}

.command-history-line--input {
  color: var(--cad-text-primary);
}

.command-input-row {
  display: flex;
  align-items: center;
  padding: var(--cad-space-1) var(--cad-space-2);
  border-top: 1px solid var(--cad-border-default);
  background: var(--cad-bg-panel);
}

.command-prompt {
  color: var(--cad-accent-active-text);
  flex-shrink: 0;
}

.command-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--cad-text-primary);
  font-family: var(--cad-font-mono);
  font-size: var(--cad-text-xs);
  padding: var(--cad-space-1);
}

.command-input::placeholder {
  color: var(--cad-text-muted);
}
</style>
