// Endpoints API organizzati per modulo
export const API_ENDPOINTS = {
    // Autenticazione
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile'
    },

    // Utenti
    USERS: {
        LIST: '/users',
        CREATE: '/users',
        GET: (id) => `/users/${id}`,
        UPDATE: (id) => `/users/${id}`,
        DELETE: (id) => `/users/${id}`
    },

    // Analytics e dati di analisi
    ANALYTICS: {
        DASHBOARD_DATA: '/analytics/dashboard',
        TRAFFIC_DATA: '/analytics/traffic',
        PROTOCOL_DISTRIBUTION: '/analytics/protocols',
        TOP_IPS: '/analytics/top-ips',
        ANOMALIES: '/analytics/anomalies',
        GEOGRAPHIC_CONNECTIONS: '/analytics/geographic',
        INDUSTRIAL_PROTOCOLS: '/analytics/industrial-protocols'
    },

    // OpenSearch
    OPENSEARCH: {
        SEARCH: '/opensearch/search',
        INDICES: '/opensearch/indices',
        LOGS: '/opensearch/logs'
    },

    // Sicurezza
    SECURITY: {
        THREATS: '/security/threats',
        ALERTS: '/security/alerts',
        INCIDENTS: '/security/incidents'
    },

    // Analyzer
    ANALYZER: {
        START: '/start',
        STOP: '/stop',
        STATUS: '/status',
        FORCE_OPENSEARCH_SETUP: '/force_opensearch_config',
        LOAD_JSON: '/load_json',
        RUN_ZEEK: '/run_zeek'
    }
}

export default API_ENDPOINTS