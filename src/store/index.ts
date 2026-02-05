import type { App } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { preferencePlugin } from './plugins/preference-plugin'

export function setupPinia(app: App) {
  const pinia = createPinia()
  pinia.use(preferencePlugin)
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
}
