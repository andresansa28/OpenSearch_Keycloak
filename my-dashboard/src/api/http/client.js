// // src/api/client.js
// import axios from 'axios'

// // ───────────────────────────────────────────────────────────────
// // python FastAPI
// const httpClient = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
//   timeout: 10000,
//   headers: { 'Content-Type': 'application/json' }
// })

// // Client HTTP per l'analyzer (servizio separato)
// const analyzerClient = axios.create({
//   baseURL: import.meta.env.VITE_ANALYZER_BASE_URL || 'http://172.17.0.1:5003',
//   timeout: 30000, // operazioni più lunghe
//   headers: { 'Content-Type': 'application/json' }
// })

// // Client HTTP per configurazione/deploy
// const configClient = axios.create({
//   baseURL: import.meta.env.VITE_CONFIG_BASE_URL || 'http://172.17.0.1:5001',
//   timeout: 20000,
//   headers: { 'Content-Type': 'application/json' }
// })

// // (facoltativo) endpoint separato per OpenSearch
// // const opensearchClient = axios.create({
// //   baseURL: import.meta.env.VITE_OPENSEARCH_BASE_URL || 'http://172.17.0.1:9200',
// //   timeout: 30000,
// //   headers: { 'Content-Type': 'application/json' }
// // })

// // ───────────────────────────────────────────────────────────────
// // Interceptor condivisi
// // - Gestione base errori (5xx)
// // - (Auth disattivata per ora: nessun token allegato)
// const setupInterceptors = (client) => {
//   client.interceptors.request.use(
//     (config) => {
//       // Quando abiliterai Keycloak:
//       // import { useAuthStore } from '@/stores/auth'
//       // const token = useAuthStore().token
//       // if (token) config.headers.Authorization = `Bearer ${token}`
//       return config
//     },
//     (error) => Promise.reject(error)
//   )

//   client.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//       const status = error?.response?.status

//       // Quando abiliterai Keycloak, qui puoi gestire i 401 (logout/redirect)
//       // if (status === 401) { ... }

//       if (status >= 500) {
//         console.error('[API 5xx]', error?.response?.data || error?.message)
//       }
//       return Promise.reject(error)
//     }
//   )
// }

// // ───────────────────────────────────────────────────────────────
// // Applica gli interceptor (senza auth per ora)
// setupInterceptors(httpClient)
// setupInterceptors(analyzerClient)
// setupInterceptors(configClient)
// // setupInterceptors(opensearchClient)

// // ───────────────────────────────────────────────────────────────
// // Export
// export { analyzerClient }
// export { configClient }
// // export { opensearchClient }
// export default httpClient



// src/api/client.js
import axios from 'axios'

// ───────────────────────────────────────────────────────────────
// Client HTTP principali con baseURL relative (Vite proxy le inoltra)
// - /api      → backend
// - /config   → servizio config/deploy
// - /analyzer → analyzer
const httpClient = axios.create({
  baseURL: '/api',
  timeout: 0,
  headers: { 'Content-Type': 'application/json' },
})

const analyzerClient = axios.create({
  baseURL: '/analyzer',
  timeout: 0, // operazioni lunghe
  headers: { 'Content-Type': 'application/json' },
})

const configClient = axios.create({
  baseURL: '/config',
  timeout: 0,
  headers: { 'Content-Type': 'application/json' },
})

// ───────────────────────────────────────────────────────────────
// Interceptors condivisi (auth disattivata per ora)
const setupInterceptors = (client) => {
  client.interceptors.request.use(
    (config) => {
      // Quando abiliterai Keycloak:
      // import { useAuthStore } from '@/stores/auth'
      // const token = useAuthStore().token
      // if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    },
    (error) => Promise.reject(error),
  )

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status
      // Gestione 401 quando abiliterai Keycloak (logout/redirect)
      // if (status === 401) { ... }

      if (status >= 500) {
        console.error('[API 5xx]', error?.response?.data || error?.message)
      }
      return Promise.reject(error)
    },
  )
}

setupInterceptors(httpClient)
setupInterceptors(analyzerClient)
setupInterceptors(configClient)

export { analyzerClient, configClient }
export default httpClient
