import { api } from '@/api'
import { API_ENDPOINTS } from '@/api/endpoints'

/**
 * Servizio per la gestione dei tenant OpenSearch
 * Gestisce l'accesso ai tenant in base ai gruppi dell'utente
 */
class TenantService {
    constructor() {
        this.client = api
        this.endpoints = API_ENDPOINTS
    }

    /**
     * Ottiene tutti i tenant accessibili all'utente corrente
     * @returns {Promise} Lista dei tenant accessibili
     */
    async getTenants() {
        try {
            // Verifica che l'utente sia autenticato
            const authStore = (await import('@/stores/auth')).useAuthStore()

            if (!authStore.isAuthenticated) {
                throw new Error('Utente non autenticato')
            }

            // Assicurati che il token sia valido prima della richiesta
            await authStore.ensureToken(30)

            const response = await this.client.get(this.endpoints.TENANTS.LIST)

            // Il backend restituisce un oggetto con i tenant come chiavi
            // Trasformiamo in array di oggetti per maggiore flessibilità
            const tenantsData = response.data || {}
            const tenantsList = Object.keys(tenantsData).map(tenantName => ({
                id: tenantName,
                name: tenantName,
                displayName: this.formatTenantName(tenantName),
                description: tenantsData[tenantName]?.description || `Tenant ${tenantName}`,
                ...tenantsData[tenantName]
            }))

            return tenantsList
        } catch (error) {
            console.error('Errore nel recupero dei tenant:', error)

            // Gestione specifica per errori di autenticazione
            if (error.response?.status === 403) {
                throw new Error('Non hai i permessi necessari per accedere ai tenant.')
            } else if (error.response?.status === 401) {
                throw new Error('Sessione scaduta. Effettua nuovamente il login.')
            }

            throw error
        }
    }

    /**
     * Ottiene gli indici disponibili per un tenant specifico
     * @param {string} tenantName - Nome del tenant
     * @returns {Promise} Lista degli indici del tenant
     */
    async getTenantIndices(tenantName) {
        try {
            const response = await this.client.get(this.endpoints.TENANTS.INDICES, {
                params: { tenant: tenantName }
            })

            return response.data
        } catch (error) {
            console.error(`Errore nel recupero degli indici per il tenant ${tenantName}:`, error)
            throw error
        }
    }

    /**
     * Formatta il nome del tenant per la visualizzazione
     * @param {string} tenantName - Nome del tenant
     * @returns {string} Nome formattato
     */
    formatTenantName(tenantName) {
        // Gestisce casi speciali
        if (tenantName === 'global_tenant') {
            return 'Global Tenant'
        }

        // Capitalizza la prima lettera e sostituisce underscore con spazi
        return tenantName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }
}

// Esporta l'istanza singleton del servizio
const tenantService = new TenantService()
export default tenantService