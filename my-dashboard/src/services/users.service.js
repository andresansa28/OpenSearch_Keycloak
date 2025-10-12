import { API_ENDPOINTS, buildQueryParams, handleApiError, httpClient } from '@/api'

class UsersService {
    async getUsers(filters = {}) {
        try {
            const queryParams = buildQueryParams(filters)
            const url = queryParams ? `${API_ENDPOINTS.USERS.LIST}?${queryParams}` : API_ENDPOINTS.USERS.LIST
            const response = await httpClient.get(url)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getUserById(id) {
        try {
            const response = await httpClient.get(API_ENDPOINTS.USERS.GET(id))
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async createUser(userData) {
        try {
            const response = await httpClient.post(API_ENDPOINTS.USERS.CREATE, userData)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async updateUser(id, userData) {
        try {
            const response = await httpClient.put(API_ENDPOINTS.USERS.UPDATE(id), userData)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async deleteUser(id) {
        try {
            const response = await httpClient.delete(API_ENDPOINTS.USERS.DELETE(id))
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }
}

export default new UsersService()