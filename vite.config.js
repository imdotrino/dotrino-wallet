import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

// <meta name="commit"> con el hash del commit del build: permite ver a simple
// vista (Ver código fuente / document.querySelector) qué versión sirve el
// dominio — clave para diagnosticar cachés viejas. Normado en CONVENCIONES-APPS.
function commitMeta () {
  let hash = 'dev'
  try { hash = execSync('git rev-parse --short HEAD').toString().trim() } catch { /* sin git */ }
  return {
    name: 'commit-meta',
    transformIndexHtml: (html) =>
      html.replace('</head>', `  <meta name="commit" content="${hash}" />\n  </head>`),
  }
}

export default defineConfig(({ command }) => ({
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    // Los `dotrino-*` son Web Components (custom elements), no componentes Vue.
    vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('dotrino-') } } }),
    // HTTPS autofirmado en desarrollo (contexto seguro para el vault del store,
    // portapapeles y Web Share). El navegador avisará del cert no confiable: aceptar.
    basicSsl(),
    commitMeta(),
    VitePWA({
      // DESARROLLO (serve): SW autodestructivo → sirve siempre contenido fresco.
      // PRODUCCIÓN (build): SW real y persistente, instalable y offline.
      selfDestroying: command === 'serve',
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'og.jpg', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'Wallet',
        short_name: 'Wallet',
        description: 'Tu billetera digital: eventos (.ics), contactos (.vcf) y pases (.pkpass) como tarjetas, en tu servidor. Sin anuncios ni rastreo.',
        lang: 'es',
        theme_color: '#0e1116',
        background_color: '#0e1116',
        display: 'standalone',
        start_url: './',
        scope: './',
        launch_handler: { client_mode: 'focus-existing' },
        // En Android, getInstalledRelatedApps() puede detectar la TWA instalada
        // (com.dotrino.wallet) → el <dotrino-install> se oculta. Sin
        // prefer_related_applications para no suprimir el prompt PWA en desktop.
        related_applications: [{ platform: 'play', id: 'com.dotrino.wallet' }],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // File Handling API: "Abrir con Wallet". OJO: solo Chrome/Edge de
        // ESCRITORIO; en Android (WebAPK) NO está soportada — ahí se usa
        // share_target (abajo). El launchQueue (App.vue) recibe los archivos.
        file_handlers: [
          {
            action: './',
            accept: {
              'text/calendar': ['.ics', '.ifb', '.ical'],
              'text/vcard': ['.vcf', '.vcard'],
              'text/x-vcard': ['.vcf'],
              'application/vnd.apple.pkpass': ['.pkpass'],
            },
          },
        ],
        // Web Share Target: en Android hace que Wallet aparezca en el menú
        // COMPARTIR al enviar un .ics/.vcf/.pkpass desde otra app. El POST lo
        // intercepta el service worker (public/share-target-sw.js).
        share_target: {
          action: './share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              { name: 'file', accept: ['text/calendar', 'text/vcard', 'text/x-vcard', 'application/vnd.apple.pkpass', '.ics', '.vcf', '.pkpass'] },
            ],
          },
        },
      },
      workbox: {
        // Navegación network-first (los deploys se ven de inmediato); el resto
        // de assets con caché y refresco en segundo plano.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: null,
        // Handler del Web Share Target (POST con archivos) inyectado en el SW.
        importScripts: ['share-target-sw.js'],
      },
    }),
  ],
  server: {
    host: true,
    port: 3120,
    allowedHosts: ['.ts.net', '.local', 'localhost'],
  },
}))
