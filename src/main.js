import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// Web Components compartidos del ecosistema (custom elements, no Vue):
// compartir (QR + redes) e instalar PWA. La barra superior (<dotrino-topbar>,
// que ya trae la moneda de support) se importa desde App.vue.
import '@dotrino/share'
import '@dotrino/install'
import { createBackNav } from '@dotrino/nav'
import { registerSW } from 'virtual:pwa-register'

// SW con auto-actualización REAL: recarga al tomar control el SW nuevo y
// re-chequea cada 30 min (si no, la PWA instalada en móvil se queda vieja).
registerSW({
  immediate: true,
  onRegisteredSW (_url, reg) {
    if (!reg) return
    setInterval(() => { reg.update().catch(() => {}) }, 30 * 60_000)
  },
})

// Navegación "volver" unificada (botón físico Android / gesto iOS / atrás del
// navegador → cierra hoja/modal; si no hay nada → dotrino.com).
createBackNav()

createApp(App).use(createPinia()).mount('#app')
