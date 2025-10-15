/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth' // <-- assicurati di avere lo store JS

// Styles
import 'unfonts.css'
import { useTheme } from 'vuetify' // se non usato, puoi rimuoverlo

const app = createApp(App)

// Pinia prima dei plugin che potrebbero usarla
const pinia = createPinia()
app.use(pinia)

// Vuetify, ecc.
registerPlugins(app)

// Bootstrap con Keycloak prima del mount
;(async () => {
  const auth = useAuthStore()
  try {
    await auth.init() // non forza il login (check-sso)
  } catch (e) {
    // opzionale: log non bloccante
    console.error('[Auth init]', e)
  }
  app.mount('#app')
})()
