import Keycloak from 'keycloak-js'

/**
 * Singleton per gestire l'istanza di Keycloak
 * Mantiene l'istanza fuori da Pinia per evitare problemi di reattività
 */
class KeycloakService {
    constructor() {
        this.keycloak = null
        this.initialized = false
    }

    /**
     * Inizializza Keycloak
     */
    async init() {
        if (this.initialized) return this.keycloak

        this.keycloak = new Keycloak({
            url: import.meta.env.VITE_KC_URL,
            realm: import.meta.env.VITE_KC_REALM,
            clientId: import.meta.env.VITE_KC_CLIENT_ID,
        })

        const authenticated = await this.keycloak.init({
            onLoad: 'login-required',
            pkceMethod: 'S256',
            checkLoginIframe: true,
            silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        })

        this.initialized = true

        // Log del token al login
        if (authenticated && this.keycloak.token) {
            console.log('🔐 Token di accesso:', this.keycloak.token)
            console.log('📋 Token parsed:', this.keycloak.tokenParsed)
        }

        return this.keycloak
    }

    /**
     * Ottiene l'istanza di Keycloak
     */
    getInstance() {
        return this.keycloak
    }

    /**
     * Verifica se Keycloak è inizializzato
     */
    isInitialized() {
        return this.initialized && this.keycloak !== null
    }

    /**
     * Ottiene il token corrente
     */
    getToken() {
        return this.keycloak?.token || null
    }

    /**
     * Ottiene il token parsed
     */
    getTokenParsed() {
        return this.keycloak?.tokenParsed || null
    }

    /**
     * Verifica se l'utente è autenticato
     */
    isAuthenticated() {
        return this.keycloak?.authenticated || false
    }

    /**
     * Ottiene i ruoli dell'utente
     */
    getRoles() {
        return this.keycloak?.realmAccess?.roles || []
    }

    /**
     * Carica il profilo utente
     */
    async loadUserProfile() {
        if (!this.keycloak?.authenticated) return null
        try {
            return await this.keycloak.loadUserProfile()
        } catch (error) {
            console.error('Errore nel caricamento del profilo:', error)
            return null
        }
    }

    /**
     * Aggiorna il token
     */
    async updateToken(minValiditySec = 30) {
        if (!this.keycloak) return false
        try {
            const refreshed = await this.keycloak.updateToken(minValiditySec)
            if (refreshed && this.keycloak.token) {
                console.log('🔄 Token aggiornato:', this.keycloak.token)
            }
            return refreshed
        } catch (error) {
            console.error('Errore nell\'aggiornamento del token:', error)
            return false
        }
    }

    /**
     * Esegue il login
     */
    async login(redirectUri) {
        if (!this.keycloak) return
        return await this.keycloak.login({
            redirectUri: redirectUri || window.location.href,
        })
    }

    /**
     * Esegue il logout
     */
    async logout(redirectUri) {
        if (!this.keycloak) return
        const logoutUri = redirectUri || `${window.location.origin}/`
        console.log('👋 Logout in corso...')
        return await this.keycloak.logout({ redirectUri: logoutUri })
    }

    /**
     * Configura i callback per eventi
     */
    onTokenExpired(callback) {
        if (this.keycloak) {
            this.keycloak.onTokenExpired = callback
        }
    }

    /**
     * Reset dell'istanza (per test o reinizializzazione)
     */
    reset() {
        this.keycloak = null
        this.initialized = false
    }
}

// Crea e esporta l'istanza singleton
const keycloakService = new KeycloakService()
export default keycloakService