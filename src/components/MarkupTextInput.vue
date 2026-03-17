<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const emit = defineEmits<{
  submit: [text: string]
  cancel: []
}>()

const props = defineProps<{
  x: number
  y: number
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const text = ref('')

onMounted(async () => {
  await nextTick()
  inputRef.value?.focus()
})

function handleSubmit() {
  if (text.value.trim()) {
    emit('submit', text.value.trim())
  } else {
    emit('cancel')
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleSubmit()
  } else if (e.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <div
    class="markup-text-input"
    :style="{ left: `${props.x}px`, top: `${props.y}px` }"
  >
    <input
      ref="inputRef"
      v-model="text"
      class="markup-text-field"
      placeholder="텍스트 입력..."
      @keydown="handleKeyDown"
      @blur="handleSubmit"
    />
  </div>
</template>

<style scoped>
.markup-text-input {
  position: absolute;
  z-index: 20;
  pointer-events: auto;
}

.markup-text-field {
  min-width: 120px;
  padding: 2px 6px;
  font-size: 14px;
  font-family: 'Inter', 'Noto Sans KR', sans-serif;
  color: var(--cad-text-primary);
  background: var(--cad-bg-panel);
  border: 1px solid var(--cad-accent-primary);
  border-radius: var(--cad-radius-sm);
  outline: none;
}

.markup-text-field:focus {
  border-color: var(--cad-accent-active-text);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
</style>
