import { api } from '@/api'
import { API_ENDPOINTS } from '@/api/endpoints'

/**
 * Servizio per la gestione degli utenti tramite Keycloak
 * Replica le funzionalità del vecchio servizio Angular
 */
class UserManagementService {
    constructor() {
        // L'API client è già configurato con baseURL='/api' che punta al backend
        this.client = api
        this.endpoints = API_ENDPOINTS
    }

    /**
     * Ottiene tutti gli utenti
     * @returns {Promise} Lista degli utenti
     */
    async getUsers() {
        try {
            // Verifica che l'utente sia autenticato e abbia i permessi
            const authStore = (await import('@/stores/auth')).useAuthStore()

            if (!authStore.isAuthenticated) {
                throw new Error('Utente non autenticato')
            }

            // Assicurati che il token sia valido prima della richiesta
            await authStore.ensureToken(30)

            const response = await this.client.get(this.endpoints.USERS.LIST)
            return response.data
        } catch (error) {
            console.error('Errore nel recupero degli utenti:', error)

            // Gestione specifica per errori di autenticazione
            if (error.response?.status === 403) {
                throw new Error('Non hai i permessi necessari per accedere alla gestione utenti. È richiesto il ruolo admin.')
            } else if (error.response?.status === 401) {
                throw new Error('Sessione scaduta. Effettua nuovamente il login.')
            }

            throw error
        }
    }

    /**
     * Rimuove un utente
     * @param {string} userId - ID dell'utente da rimuovere
     * @returns {Promise} Risultato dell'operazione
     */
    async removeUser(userId) {
        try {
            const response = await this.client.delete(this.endpoints.USERS.DELETE, {
                params: { user_id: userId }
            })
            return response.data
        } catch (error) {
            console.error('Errore nella rimozione dell\'utente:', error)
            throw error
        }
    }

    /**
     * Crea un nuovo utente
     * @param {Object} userData - Dati dell'utente
     * @param {string} userData.username - Username
     * @param {string} userData.firstname - Nome
     * @param {string} userData.lastname - Cognome
     * @param {string} userData.email - Email
     * @param {string} userData.password - Password
     * @returns {Promise} Risultato della creazione
     */
    async createUser({ username, firstname, lastname, email, password }) {
        try {
            const payload = {
                username,
                first_name: firstname,
                last_name: lastname,
                email,
                password
            }

            const response = await this.client.post(this.endpoints.USERS.CREATE, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            return response.data
        } catch (error) {
            console.error('Errore nella creazione dell\'utente:', error)

            if (error.response?.status === 409) {
                throw new Error(`L'utente '${username}' o l'email '${email}' è già registrato`)
            }

            throw error
        }
    }

    /**
     * Ottiene i ruoli/gruppi di un utente
     * @param {string} userId - ID dell'utente
     * @returns {Promise} Lista dei gruppi dell'utente
     */
    async getUserRoles(userId) {
        try {
            const response = await this.client.get(this.endpoints.USERS.USER_GROUPS, {
                params: { user_id: userId }
            })
            return response.data
        } catch (error) {
            console.error('Errore nel recupero dei ruoli utente:', error)
            throw error
        }
    }

    /**
     * Ottiene tutti i gruppi disponibili
     * @returns {Promise} Lista di tutti i gruppi
     */
    async getAllGroups() {
        try {
            const response = await this.client.get(this.endpoints.GROUPS.LIST)
            return response.data
        } catch (error) {
            console.error('Errore nel recupero dei gruppi:', error)
            throw error
        }
    }

    /**
     * Assegna un utente a un gruppo
     * @param {string} userId - ID dell'utente
     * @param {string} groupName - Nome del gruppo
     * @returns {Promise} Risultato dell'operazione
     */
    async setUserGroup(userId, groupName) {
        try {
            const payload = {
                user_id: userId,
                group_name: groupName
            }

            const response = await this.client.post(this.endpoints.USERS.ADD_TO_GROUP, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            return response.data
        } catch (error) {
            console.error('Errore nell\'assegnazione del gruppo:', error)
            throw error
        }
    }

    /**
     * Crea un nuovo gruppo
     * @param {string} groupName - Nome del gruppo
     * @param {string} description - Descrizione del gruppo (opzionale)
     * @returns {Promise} Risultato della creazione
     */
    async createGroup(groupName, description) {
        try {
            const payload = {
                name: groupName,
                description: description || `Gruppo per deployment ${groupName}`
            }

            const response = await this.client.post(this.endpoints.GROUPS.CREATE, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error) {
            console.error('Errore nella creazione del gruppo:', error)
            throw error
        }
    }

    /**
     * Elimina un gruppo
     * @param {string} groupName - Nome del gruppo da eliminare
     * @returns {Promise} Risultato dell'operazione
     */
    async deleteGroup(groupName) {
        try {
            const response = await this.client.delete(this.endpoints.GROUPS.DELETE, {
                params: { group_name: groupName }
            })
            return response.data
        } catch (error) {
            console.error('Errore nell\'eliminazione del gruppo:', error)
            throw error
        }
    }

    /**
     * Rimuove un utente da un gruppo
     * @param {string} userId - ID dell'utente
     * @param {string} groupName - Nome del gruppo
     * @returns {Promise} Risultato dell'operazione
     */
    async removeUserFromGroup(userId, groupName) {
        try {
            const payload = {
                user_id: userId,
                group_name: groupName
            }

            const response = await this.client.post(this.endpoints.USERS.REMOVE_FROM_GROUP, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error) {
            console.error('Errore nella rimozione dal gruppo:', error)
            throw error
        }
    }

    /**
     * Aggiorna i dati di un utente
     * @param {Object} userData - Dati aggiornati dell'utente
     * @returns {Promise} Risultato dell'aggiornamento
     */
    async updateUser(userData) {
        try {
            // Trasforma i dati nel formato KeycloakUser completo come nel modello Angular
            const keycloakUserData = {
                id: userData.id,
                username: userData.username || '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                enabled: userData.enabled !== undefined ? userData.enabled : true,
                emailVerified: userData.emailVerified || false,
                attributes: userData.attributes || {},

                // Campi aggiuntivi obbligatori dal modello Angular
                createdTimestamp: userData.createdTimestamp || Date.now(),
                totp: userData.totp || false,
                disableableCredentialTypes: userData.disableableCredentialTypes || [],
                requiredActions: userData.requiredActions || [],
                notBefore: userData.notBefore || 0
            }

            const response = await this.client.put(this.endpoints.USERS.UPDATE, keycloakUserData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error) {
            console.error('Errore nell\'aggiornamento dell\'utente:', error)
            throw error
        }
    }

}

// Esporta l'istanza singleton del servizio
const userManagementService = new UserManagementService()
export default userManagementService