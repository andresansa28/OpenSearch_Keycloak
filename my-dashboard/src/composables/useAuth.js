import { AuthToken, User } from '@/models/auth'
import { authService } from '@/services'
import { computed, ref } from 'vue'

// Composable per gestire l'autenticazione
export function useAuth() {
    const user = ref(null)
    const token = ref(null)
    const isLoading = ref(false)
    const error = ref(null)

    // Computed per verificare se l'utente è autenticato
    const isAuthenticated = computed(() => {
        return user.value !== null && token.value !== null
    })

    // Computed per verificare se l'utente è admin
    const isAdmin = computed(() => {
        return user.value?.isAdmin || false
    })

    // Login
    const login = async (credentials) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await authService.login(credentials)

            user.value = new User(response.user)
            token.value = new AuthToken(response.token)

            // Salva il token nel localStorage
            localStorage.setItem('authToken', JSON.stringify(token.value))
            localStorage.setItem('user', JSON.stringify(user.value))

            return true
        } catch (err) {
            error.value = err.message
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Logout
    const logout = async () => {
        try {
            await authService.logout()
        } catch (err) {
            console.error('Errore durante il logout:', err)
        } finally {
            user.value = null
            token.value = null
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
        }
    }

    // Inizializza l'autenticazione dal localStorage
    const initAuth = () => {
        const savedToken = localStorage.getItem('authToken')
        const savedUser = localStorage.getItem('user')

        if (savedToken && savedUser) {
            try {
                const tokenData = JSON.parse(savedToken)
                const userData = JSON.parse(savedUser)

                token.value = new AuthToken(tokenData)
                user.value = new User(userData)

                // Verifica se il token è scaduto
                if (token.value.isExpired) {
                    logout()
                }
            } catch (err) {
                console.error('Errore nel parsing dei dati di autenticazione:', err)
                logout()
            }
        }
    }

    // Refresh del token
    const refreshToken = async () => {
        try {
            const response = await authService.refreshToken()
            token.value = new AuthToken(response.token)
            localStorage.setItem('authToken', JSON.stringify(token.value))
            return true
        } catch (err) {
            logout()
            return false
        }
    }

    return {
        // State
        user,
        token,
        isLoading,
        error,

        // Computed
        isAuthenticated,
        isAdmin,

        // Actions
        login,
        logout,
        initAuth,
        refreshToken
    }
}