// src/services/analyzer.service.js
import { analyzerClient } from '@/api/http/client'

// Endpoint locali al service
const ENDPOINTS = {
    START: '/start',
    STOP: '/stop',
    STATUS: '/status',
    FORCE_OPENSEARCH_SETUP: '/force_opensearch_config',
    LOAD_JSON: '/config/load-json',
    RUN_ZEEK: '/run-zeek'
}

// Normalizza gli errori in un oggetto Error con message leggibile
function normalizeApiError(err, fallbackMsg) {
    const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        fallbackMsg ||
        'Errore di rete'
    return new Error(msg)
}

class AnalyzerService {
    async start() {
        try {
            const r = await analyzerClient.get(ENDPOINTS.START)
            return r.data
        } catch (e) {
            throw normalizeApiError(e, "Errore durante l'avvio dell'analyzer")
        }
    }

    async stop() {
        try {
            const r = await analyzerClient.get(ENDPOINTS.STOP)
            return r.data
        } catch (e) {
            throw normalizeApiError(e, "Errore durante lo stop dell'analyzer")
        }
    }

    async forceOpenSearchSetup() {
        try {
            const r = await analyzerClient.get(ENDPOINTS.FORCE_OPENSEARCH_SETUP)
            return r.data
        } catch (e) {
            throw normalizeApiError(e, 'Errore durante la configurazione di OpenSearch')
        }
    }

    async loadJson() {
        try {
            const r = await analyzerClient.post(ENDPOINTS.LOAD_JSON)
            return r.data
        } catch (e) {
            throw normalizeApiError(e, 'Errore durante il caricamento del JSON')
        }
    }

    async runZeek(standard = false) {
        try {
            const r = await analyzerClient.get(ENDPOINTS.RUN_ZEEK, { standard })
            return r.data
        } catch (e) {
            throw normalizeApiError(e, "Errore durante l'esecuzione di Zeek")
        }
    }

    async getStatus() {
        try {
            const r = await analyzerClient.get(ENDPOINTS.STATUS)
            return r.data
        } catch (e) {
            throw normalizeApiError(e, 'Errore durante il controllo dello status')
        }
    }
}

const analyzerService = new AnalyzerService()
export default analyzerService
