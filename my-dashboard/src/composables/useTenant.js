import tenantService from '@/services/tenant.service'
import { computed, ref } from 'vue'

const tenants = ref([])
const selectedTenant = ref(null)
const loading = ref(false)
const error = ref(null)

/**
 * Composable per la gestione dei tenant OpenSearch
 * Fornisce stato reattivo e metodi per gestire i tenant accessibili
 */
export function useTenant() {
    /**
     * Carica tutti i tenant accessibili all'utente
     */
    async function fetchTenants() {
        loading.value = true
        error.value = null

        try {
            const result = await tenantService.getTenants()
            tenants.value = result

            // Se non c'è un tenant selezionato e ci sono tenant disponibili,
            // seleziona il primo tenant
            if (!selectedTenant.value && result.length > 0) {
                selectedTenant.value = result[0]
            }

            console.log('Tenant caricati:', result)
            return result
        } catch (err) {
            error.value = err.message || 'Errore nel caricamento dei tenant'
            console.error('Errore nel caricamento dei tenant:', err)
            tenants.value = []
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Seleziona un tenant specifico
     * @param {Object} tenant - Tenant da selezionare
     */
    function selectTenant(tenant) {
        if (tenant && tenant.id) {
            selectedTenant.value = tenant
            console.log('Tenant selezionato:', tenant)
        }
    }

    /**
     * Trova un tenant per ID
     * @param {string} tenantId - ID del tenant da trovare
     * @returns {Object|null} Tenant trovato o null
     */
    function findTenantById(tenantId) {
        return tenants.value.find(tenant => tenant.id === tenantId) || null
    }

    /**
     * Reset dei dati dei tenant
     */
    function resetTenants() {
        tenants.value = []
        selectedTenant.value = null
        error.value = null
        loading.value = false
    }

    // Computed properties
    const hasMultipleTenants = computed(() => tenants.value.length > 1)
    const currentTenantName = computed(() => selectedTenant.value?.displayName || 'Nessun tenant selezionato')
    const isGlobalTenant = computed(() => selectedTenant.value?.id === 'global_tenant')

    return {
        // Stato reattivo
        tenants,
        selectedTenant,
        loading,
        error,

        // Computed properties
        hasMultipleTenants,
        currentTenantName,
        isGlobalTenant,

        // Metodi
        fetchTenants,
        selectTenant,
        findTenantById,
        resetTenants
    }
}