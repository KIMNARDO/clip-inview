<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import {
  XIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
} from 'lucide-vue-next'

const toast = useToastStore()

const typeIcons = {
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
  info: InfoIcon,
} as const
</script>

<template>
  <Teleport to="body">
    <div v-if="toast.toasts.length" class="toast-container">
      <div
        v-for="item in toast.toasts"
        :key="item.id"
        class="toast-item"
        :class="`toast-item--${item.type}`"
      >
        <component :is="typeIcons[item.type]" :size="16" :stroke-width="1.5" class="toast-icon" />
        <span class="toast-message">{{ item.message }}</span>
        <button class="toast-close" @click="toast.dismiss(item.id)">
          <XIcon :size="14" :stroke-width="1.5" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--cad-space-4);
  right: var(--cad-space-4);
  z-index: var(--cad-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--cad-space-2);
  max-width: 400px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: var(--cad-space-2);
  padding: var(--cad-space-2) var(--cad-space-3);
  border-radius: var(--cad-radius-md);
  font-size: var(--cad-text-sm);
  color: var(--cad-text-primary);
  background: var(--cad-bg-panel);
  border: 1px solid var(--cad-border-default);
  box-shadow: var(--cad-shadow-lg);
  animation: toast-in 200ms ease-out;
}

.toast-item--error {
  border-color: var(--cad-status-error);
  background: rgba(244, 67, 54, 0.15);
}

.toast-item--warning {
  border-color: var(--cad-status-warning);
  background: rgba(255, 152, 0, 0.15);
}

.toast-item--success {
  border-color: var(--cad-status-success);
  background: rgba(76, 175, 80, 0.15);
}

.toast-item--info {
  border-color: var(--cad-status-info);
  background: rgba(83, 193, 222, 0.15);
}

.toast-icon {
  flex-shrink: 0;
}

.toast-item--success .toast-icon { color: var(--cad-status-success); }
.toast-item--warning .toast-icon { color: var(--cad-status-warning); }
.toast-item--error .toast-icon { color: var(--cad-status-error); }
.toast-item--info .toast-icon { color: var(--cad-status-info); }

.toast-message {
  flex: 1;
}

.toast-close {
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
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--cad-text-primary);
  background: var(--cad-hover-bg);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
