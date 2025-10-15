// Endpoints API organizzati per modulo
export const API_ENDPOINTS = {
    // Autenticazione
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile'
    },

    // Utenti (Keycloak User Management)
    USERS: {
        LIST: '/users',
        CREATE: '/user/create/',
        UPDATE: '/user/update/',
        DELETE: '/user/delete/',
        USER_GROUPS: '/user/group/',
        ADD_TO_GROUP: '/user/group/add/',
        REMOVE_FROM_GROUP: '/user/group/remove/'
    },

    // Gruppi (Keycloak Groups)
    GROUPS: {
        LIST: '/groups',
        CREATE: '/group/create/',
        DELETE: '/group/delete/'
    },

    // OpenSearch Tenants
    TENANTS: {
        LIST: '/api/tenants',
        INDICES: '/api/tenant'
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