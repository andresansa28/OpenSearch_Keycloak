import { API_ENDPOINTS, buildQueryParams, handleApiError, httpClient } from '@/api'

class AnalyticsService {
    async getDashboardData() {
        try {
            const response = await httpClient.get(API_ENDPOINTS.ANALYTICS.DASHBOARD_DATA)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getTrafficData(filters = {}) {
        try {
            const queryParams = buildQueryParams(filters)
            const url = queryParams ? `${API_ENDPOINTS.ANALYTICS.TRAFFIC_DATA}?${queryParams}` : API_ENDPOINTS.ANALYTICS.TRAFFIC_DATA
            const response = await httpClient.get(url)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getProtocolDistribution(timeRange = {}) {
        try {
            const queryParams = buildQueryParams(timeRange)
            const url = queryParams ? `${API_ENDPOINTS.ANALYTICS.PROTOCOL_DISTRIBUTION}?${queryParams}` : API_ENDPOINTS.ANALYTICS.PROTOCOL_DISTRIBUTION
            const response = await httpClient.get(url)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getTopIPs(limit = 10) {
        try {
            const response = await httpClient.get(`${API_ENDPOINTS.ANALYTICS.TOP_IPS}?limit=${limit}`)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getAnomalies(filters = {}) {
        try {
            const queryParams = buildQueryParams(filters)
            const url = queryParams ? `${API_ENDPOINTS.ANALYTICS.ANOMALIES}?${queryParams}` : API_ENDPOINTS.ANALYTICS.ANOMALIES
            const response = await httpClient.get(url)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getGeographicConnections() {
        try {
            const response = await httpClient.get(API_ENDPOINTS.ANALYTICS.GEOGRAPHIC_CONNECTIONS)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }

    async getIndustrialProtocols() {
        try {
            const response = await httpClient.get(API_ENDPOINTS.ANALYTICS.INDUSTRIAL_PROTOCOLS)
            return response.data
        } catch (error) {
            throw handleApiError(error)
        }
    }
}

export default new AnalyticsService()