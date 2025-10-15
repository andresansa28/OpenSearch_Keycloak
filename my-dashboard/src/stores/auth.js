import keycloakService from '@/services/keycloak'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    ready: false,
    authenticated: false,
    profile: null,
    token: '',
    tokenParsed: null,
    roles: [],
  }),

  getters: {
    isReady: (s) => s.ready,
    isAuthenticated: (s) => s.authenticated,
    userRoles: (s) => s.roles,
    userProfile: (s) => s.profile,
    accessToken: (s) => s.token,
  },

  actions: {
    async init() {
      if (this.ready) return

      try {
        const keycloak = await keycloakService.init()

        // Configura il callback per il token scaduto
        keycloakService.onTokenExpired(async () => {
          try {
            await keycloakService.updateToken(30)
            this.token = keycloakService.getToken() || ''
          } catch {
            await this.logout()
          }
        })

        // Aggiorna lo stato con i valori attuali
        this.authenticated = keycloakService.isAuthenticated()
        this.token = keycloakService.getToken() || ''
        this.tokenParsed = keycloakService.getTokenParsed()
        this.roles = keycloakService.getRoles()
        this.ready = true

        // Carica il profilo se autenticato
        if (this.authenticated) {
          try {
            this.profile = await keycloakService.loadUserProfile()
          } catch (error) {
            console.warn('Impossibile caricare il profilo utente:', error)
          }
        }

      } catch (error) {
        console.error('Errore nell\'inizializzazione di Keycloak:', error)
        this.ready = true // Segna come pronto anche in caso di errore
      }
    },

    async login(redirectUri) {
      try {
        await keycloakService.login(redirectUri)
      } catch (error) {
        console.error('Errore durante il login:', error)
      }
    },

    async logout() {
      try {
        const redirectUri = `${window.location.origin}/`
        await keycloakService.logout(redirectUri)

        // Reset dello stato
        this.$reset()
      } catch (error) {
        console.error('Errore durante il logout:', error)
        // Reset dello stato anche in caso di errore
        this.$reset()
      }
    },

    async ensureToken(minValiditySec = 30) {
      try {
        const refreshed = await keycloakService.updateToken(minValiditySec)
        if (refreshed) {
          this.token = keycloakService.getToken() || ''
          this.tokenParsed = keycloakService.getTokenParsed()
        }
        return this.token || null
      } catch (error) {
        console.error('Errore nell\'aggiornamento del token:', error)
        await this.login()
        return null
      }
    },

    // Metodo per aggiornare manualmente lo stato da Keycloak
    updateStateFromKeycloak() {
      this.authenticated = keycloakService.isAuthenticated()
      this.token = keycloakService.getToken() || ''
      this.tokenParsed = keycloakService.getTokenParsed()
      this.roles = keycloakService.getRoles()
    },
  },
})
