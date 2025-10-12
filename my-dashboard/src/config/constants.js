// Costanti globali dell'applicazione
export const APP_CONSTANTS = {
    // Configurazione generale
    APP_NAME: 'OpenSearch Security Dashboard',
    APP_VERSION: '1.0.0',

    // Timeout e intervalli
    API_TIMEOUT: 10000,
    REFRESH_INTERVAL: 30000, // 30 secondi
    SESSION_TIMEOUT: 3600000, // 1 ora

    // Paginazione
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // Chart settings
    CHART_COLORS: [
        '#1976D2', '#388E3C', '#F57C00', '#D32F2F',
        '#7B1FA2', '#455A64', '#E64A19', '#C2185B'
    ],

    // Severità delle anomalie
    SEVERITY_LEVELS: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },

    // Ruoli utente
    USER_ROLES: {
        ADMIN: 'admin',
        ANALYST: 'analyst',
        VIEWER: 'viewer'
    },

    // Protocolli supportati
    SUPPORTED_PROTOCOLS: [
        'HTTP', 'HTTPS', 'TCP', 'UDP', 'ICMP',
        'DNS', 'SSH', 'FTP', 'SMTP', 'Modbus',
        'DNP3', 'IEC104'
    ],

    // Formati data
    DATE_FORMATS: {
        SHORT: 'DD/MM/YYYY',
        LONG: 'DD/MM/YYYY HH:mm:ss',
        ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    },

    // Messaggi di errore comuni
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Errore di connessione al server',
        UNAUTHORIZED: 'Non autorizzato',
        FORBIDDEN: 'Accesso negato',
        NOT_FOUND: 'Risorsa non trovata',
        SERVER_ERROR: 'Errore interno del server',
        VALIDATION_ERROR: 'Dati non validi'
    }
}

export default APP_CONSTANTS