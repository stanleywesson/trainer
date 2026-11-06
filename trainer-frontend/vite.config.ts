import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  base: '/trainer/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      // 'prompt' so a new version waits until src/pwa.ts says it's safe to reload
      registerType: 'prompt',
      // Registration is done manually in src/pwa.ts so we can force update checks
      injectRegister: false,
      manifest: {
        name: 'Trainer',
        short_name: 'Trainer',
        description: 'Your personal workout tracker',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/trainer/',
        start_url: '/trainer/',
        icons: [
          { src: '/trainer/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/trainer/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/trainer/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,svg,ico}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html'
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
