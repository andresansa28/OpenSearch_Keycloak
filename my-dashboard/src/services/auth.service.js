import { API_ENDPOINTS, handleApiError, httpClient } from '@/api'

class AuthService {
    async login(credentials) {
        try {
            const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async logout() {
        try {
            await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT)
        } catch (error) {
            console.error('Errore durante il logout:', error)
        }
    }

    async refreshToken() {
        try {
            const response = await httpClient.post(API_ENDPOINTS.AUTH.REFRESH)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getProfile() {
        try {
            const response = await httpClient.get(API_ENDPOINTS.AUTH.PROFILE)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }
}

export default new AuthService()