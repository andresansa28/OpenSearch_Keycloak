// // Plugins
// import AutoImport from 'unplugin-auto-import/vite'
// import Components from 'unplugin-vue-components/vite'
// import Fonts from 'unplugin-fonts/vite'
// import Layouts from 'vite-plugin-vue-layouts-next'
// import Vue from '@vitejs/plugin-vue'
// import VueRouter from 'unplugin-vue-router/vite'
// import { VueRouterAutoImports } from 'unplugin-vue-router'
// import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// // Utilities
// import { defineConfig } from 'vite'
// import { fileURLToPath, URL } from 'node:url'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     VueRouter(),
//     Layouts(),
//     Vue({
//       template: { transformAssetUrls },
//     }),
//     // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
//     Vuetify({
//       autoImport: true,
//       styles: {
//         configFile: 'src/styles/settings.scss',
//       },
//     }),
//     Components(),
//     Fonts({
//       google: {
//         families: [{
//           name: 'Roboto',
//           styles: 'wght@100;300;400;500;700;900',
//         }],
//       },
//     }),
//     AutoImport({
//       imports: [
//         'vue',
//         VueRouterAutoImports,
//         {
//           pinia: ['defineStore', 'storeToRefs'],
//         },
//       ],
//       eslintrc: {
//         enabled: true,
//       },
//       vueTemplate: true,
//     }),
//   ],
//   optimizeDeps: {
//     exclude: [
//       'vuetify',
//       'vue-router',
//       'unplugin-vue-router/runtime',
//       'unplugin-vue-router/data-loaders',
//       'unplugin-vue-router/data-loaders/basic',
//     ],
//   },
//   define: { 'process.env': {} },
//   resolve: {
//     alias: {
//       '@': fileURLToPath(new URL('src', import.meta.url)),
//     },
//     extensions: [
//       '.js',
//       '.json',
//       '.jsx',
//       '.mjs',
//       '.ts',
//       '.tsx',
//       '.vue',
//     ],
//   },
//   server: {
//     port: 3000,
//   },
// })

// vite.config.mjs

// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    Layouts(),
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify({
      autoImport: true,
      styles: { configFile: 'src/styles/settings.scss' },
    }),
    Components(),
    Fonts({
      google: {
        families: [{ name: 'Roboto', styles: 'wght@100;300;400;500;700;900' }],
      },
    }),
    AutoImport({
      imports: [
        'vue',
        VueRouterAutoImports,
        { pinia: ['defineStore', 'storeToRefs'] },
      ],
      eslintrc: { enabled: true },
      vueTemplate: true,
    }),
  ],

  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },

  define: { 'process.env': {} },

  resolve: {
    alias: { '@': fileURLToPath(new URL('src', import.meta.url)) },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },

  // ─────────────────────────────────────────────────────────────
  // DEV SERVER: esponi su 0.0.0.0 per accesso dall'host
  // e proxy le rotte interne verso i service name Docker
  server: {
    host: true,
    port: 3000,
    proxy: {
      // /api → backend (porta interna 80 nel container)
      '/api': {
        target: 'http://backend:80',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      // /analyzer → analyzer (porta interna 5003)
      '/analyzer': {
        target: 'http://analyzer:5003',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/analyzer/, ''),
      },
      // /config → webapp_analyzer_bridge (porta interna 5001)
      '/config': {
        target: 'http://webapp_analyzer_bridge:5001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/config/, ''),
      },
      // Opzionale: Keycloak same-origin (aiuta silent SSO)
      // '/auth': {
      //   target: 'http://keycloak:8080',
      //   changeOrigin: true,
      // },
    },
  },
})
