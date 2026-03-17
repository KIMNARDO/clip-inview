import { onMounted, onUnmounted } from 'vue'

type KeyHandler = (event: KeyboardEvent) => void

/**
 * 키보드 단축키 composable
 * Phase 1에서 확장 예정
 */
export function useKeyboard(handlers: Record<string, KeyHandler>) {
  function onKeyDown(event: KeyboardEvent) {
    const key = buildKeyString(event)
    const handler = handlers[key]
    if (handler) {
      handler(event)
    }
  }

  function buildKeyString(event: KeyboardEvent): string {
    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')
    parts.push(event.key.toUpperCase())
    return parts.join('+')
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
}
