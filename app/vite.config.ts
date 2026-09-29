import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

// Ogni strumento è una pagina HTML separata: si apre da sola e ha il suo bundle.
export default defineConfig({
  plugins: [
    svelte(),
    // Offline: dopo la prima apertura tutto resta in cache (utile a scuola con il wifi instabile).
    // Su iPad conviene "Aggiungi a Home": Safari non cancella i dati delle app installate.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // la v1 in /legacy/ non passa dal service worker della nuova app
        globIgnores: ['legacy/**'],
        navigateFallback: null,
      },
      manifest: {
        name: 'Quaderno',
        short_name: 'Quaderno',
        description: 'Strumenti per studiare e fare lezione',
        lang: 'it',
        start_url: '/',
        display: 'standalone',
        background_color: '#F5F8FC',
        theme_color: '#1F2A44',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: { $shared: resolve(import.meta.dirname, 'src/shared') },
  },
  build: {
    rollupOptions: {
      input: {
        hub: resolve(import.meta.dirname, 'index.html'),
        stile: resolve(import.meta.dirname, 'stile/index.html'),
        timeline: resolve(import.meta.dirname, 'timeline/index.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
