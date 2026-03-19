import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/variables.css'
import './styles/tailwind.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')

// 개발 모드에서 보안 모니터링 활성화
if (import.meta.env.DEV) {
  import('./utils/securityAudit').then(({ startSecurityMonitor }) => {
    startSecurityMonitor()
  })
}
