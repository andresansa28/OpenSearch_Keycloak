import userManagementService from '@/services/userManagement.service'
import { computed, reactive, ref } from 'vue'

/**
 * Composable per la gestione degli utenti
 * Fornisce stato reattivo e metodi per operazioni CRUD
 */
export function useUserManagement() {
    // Stati reattivi
    const users = ref([])
    const groups = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Stato per operazioni specifiche
    const operationLoading = reactive({
        create: false,
        update: false,
        delete: false,
        assignGroup: false
    })

    // Computed per statistiche utenti
    const userStats = computed(() => {
        const totalUsers = users.value.length
        const activeUsers = users.value.filter(user => user.enabled).length
        const inactiveUsers = totalUsers - activeUsers

        return {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers
        }
    })

    /**
     * Carica tutti gli utenti con i loro gruppi
     */
    const fetchUsers = async () => {
        try {
            loading.value = true
            error.value = null

            const response = await userManagementService.getUsers()
            const usersData = response || []

            // Carica i gruppi per ogni utente e formatta i dati
            const usersWithGroups = await Promise.all(
                usersData.map(async (user) => {
                    try {
                        const userGroups = await userManagementService.getUserRoles(user.id)
                        const groupNames = userGroups.map(g => g.name || g.id)

                        // Formatta i dati dell'utente nel formato atteso dal componente
                        return {
                            id: user.id,
                            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                            email: user.email,
                            username: user.username,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            status: user.enabled ? 'active' : 'inactive',
                            role: 'viewer',
                            groups: groupNames, // Gruppi Keycloak dell'utente
                            tenants: [], // Tenant OpenSearch (separati)
                            lastLogin: user.lastLogin || null,
                            createdTimestamp: user.createdTimestamp,
                            enabled: user.enabled
                        }
                    } catch (groupError) {
                        // Se fallisce il caricamento gruppi, restituisce l'utente senza gruppi
                        console.warn(`Impossibile caricare gruppi per utente ${user.username}:`, groupError)
                        return {
                            id: user.id,
                            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                            email: user.email,
                            username: user.username,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            status: user.enabled ? 'active' : 'inactive',
                            role: 'viewer',
                            groups: [],
                            tenants: [],
                            lastLogin: user.lastLogin || null,
                            createdTimestamp: user.createdTimestamp,
                            enabled: user.enabled
                        }
                    }
                })
            )

            users.value = usersWithGroups
            console.log('Utenti caricati con gruppi:', users.value.length)
            return users.value
        } catch (err) {
            error.value = err.message || 'Errore nel caricamento degli utenti'
            console.error('Errore fetchUsers:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Carica tutti i gruppi
     */
    const fetchGroups = async () => {
        try {
            const response = await userManagementService.getAllGroups()
            groups.value = response || []

            console.log('Gruppi caricati:', groups.value.length)
            return groups.value
        } catch (err) {
            error.value = err.message || 'Errore nel caricamento dei gruppi'
            console.error('Errore fetchGroups:', err)
            throw err
        }
    }

    /**
     * Crea un nuovo utente
     */
    const createUser = async (userData) => {
        try {
            operationLoading.create = true
            error.value = null

            const response = await userManagementService.createUser(userData)

            // Ricarica la lista degli utenti
            await fetchUsers()

            console.log('Utente creato:', response)
            return response
        } catch (err) {
            error.value = err.message || 'Errore nella creazione dell\'utente'
            console.error('Errore createUser:', err)
            throw err
        } finally {
            operationLoading.create = false
        }
    }

    /**
     * Aggiorna un utente esistente
     */
    const updateUser = async (userData) => {
        try {
            operationLoading.update = true
            error.value = null

            const response = await userManagementService.updateUser(userData)

            // Ricarica la lista degli utenti
            await fetchUsers()

            console.log('Utente aggiornato:', response)
            return response
        } catch (err) {
            error.value = err.message || 'Errore nell\'aggiornamento dell\'utente'
            console.error('Errore updateUser:', err)
            throw err
        } finally {
            operationLoading.update = false
        }
    }

    /**
     * Elimina un utente
     */
    const deleteUser = async (userId) => {
        try {
            operationLoading.delete = true
            error.value = null

            const response = await userManagementService.removeUser(userId)

            // Rimuove l'utente dalla lista locale
            users.value = users.value.filter(user => user.id !== userId)

            console.log('Utente eliminato:', userId)
            return response
        } catch (err) {
            error.value = err.message || 'Errore nell\'eliminazione dell\'utente'
            console.error('Errore deleteUser:', err)
            throw err
        } finally {
            operationLoading.delete = false
        }
    }


    /**
     * Ottiene i gruppi di un utente
     */
    const getUserGroups = async (userId) => {
        try {
            const response = await userManagementService.getUserRoles(userId)
            return response || []
        } catch (err) {
            error.value = err.message || 'Errore nel recupero dei gruppi utente'
            console.error('Errore getUserGroups:', err)
            throw err
        }
    }

    /**
     * Assegna un utente a un gruppo
     */
    const assignUserToGroup = async (userId, groupName) => {
        try {
            operationLoading.assignGroup = true
            error.value = null

            const response = await userManagementService.setUserGroup(userId, groupName)
            return response
        } catch (err) {
            error.value = err.message || 'Errore nell\'assegnazione al gruppo'
            console.error('Errore assignUserToGroup:', err)
            throw err
        } finally {
            operationLoading.assignGroup = false
        }
    }

    /**
     * Rimuove un utente da un gruppo
     */
    const removeUserFromGroup = async (userId, groupName) => {
        try {
            const response = await userManagementService.removeUserFromGroup(userId, groupName)
            return response
        } catch (err) {
            error.value = err.message || 'Errore nella rimozione dal gruppo'
            console.error('Errore removeUserFromGroup:', err)
            throw err
        }
    }

    /**
     * Crea un nuovo gruppo
     */
    const createGroup = async (groupName, description) => {
        try {
            const response = await userManagementService.createGroup(groupName, description)

            // Ricarica la lista dei gruppi
            await fetchGroups()

            console.log('Gruppo creato:', groupName)
            return response
        } catch (err) {
            error.value = err.message || 'Errore nella creazione del gruppo'
            console.error('Errore createGroup:', err)
            throw err
        }
    }

    /**
     * Elimina un gruppo
     */
    const deleteGroup = async (groupName) => {
        try {
            const response = await userManagementService.deleteGroup(groupName)

            // Rimuove il gruppo dalla lista locale
            groups.value = groups.value.filter(group => group.name !== groupName)

            console.log('Gruppo eliminato:', groupName)
            return response
        } catch (err) {
            error.value = err.message || 'Errore nell\'eliminazione del gruppo'
            console.error('Errore deleteGroup:', err)
            throw err
        }
    }

    /**
     * Pulisce gli errori
     */
    const clearError = () => {
        error.value = null
    }

    /**
     * Inizializza il composable caricando utenti e gruppi
     */
    const initialize = async () => {
        try {
            // Importa il store auth per verificare lo stato
            const { useAuthStore } = await import('@/stores/auth')
            const authStore = useAuthStore()

            // Aspetta che l'autenticazione sia pronta
            if (!authStore.isReady) {
                console.log('Aspettando inizializzazione auth...')
                // Dai un po' di tempo per l'inizializzazione
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Verifica che l'utente sia autenticato
            if (!authStore.isAuthenticated) {
                console.warn('Utente non autenticato, impossibile caricare dati utenti')
                error.value = 'Utente non autenticato'
                return
            }

            // Carica utenti e gruppi
            await Promise.all([
                fetchUsers(),
                fetchGroups()
            ])
        } catch (err) {
            console.error('Errore nell\'inizializzazione user management:', err)
            error.value = err.message || 'Errore nell\'inizializzazione'
        }
    }

    return {
        // Stato
        users, // Usa direttamente users invece di formattedUsers per aggiornamenti real-time
        groups,
        loading,
        error,
        operationLoading,
        userStats,

        // Metodi
        fetchUsers,
        fetchGroups,
        createUser,
        updateUser,
        deleteUser,
        getUserGroups,
        assignUserToGroup,
        removeUserFromGroup,
        createGroup,
        deleteGroup,
        clearError,
        initialize
    }
}