import { API_ENDPOINTS } from './endpoints'
import httpClient, { analyzerClient } from './http/client'

// Esporta i client HTTP e gli endpoints per un facile utilizzo
export { analyzerClient, API_ENDPOINTS, httpClient }

// Alias per compatibilità
export const api = httpClient

// Utility per costruire query parameters
export const buildQueryParams = (params) => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, value)
        }
    })

    return searchParams.toString()
}

// Utility migliorata per gestire errori API con messaggi più specifici
export const handleApiError = (error, defaultMessage = 'Si è verificato un errore') => {
    let errorMessage = defaultMessage
    let errorStatus = 0
    let errorData = null

    if (error.response) {
        // Server ha risposto con status di errore
        errorStatus = error.response.status
        errorData = error.response.data

        // Messaggi specifici per status code comuni
        switch (errorStatus) {
            case 400:
                errorMessage = errorData?.message || 'Richiesta non valida'
                break
            case 401:
                errorMessage = 'Accesso non autorizzato'
                break
            case 403:
                errorMessage = 'Accesso negato'
                break
            case 404:
                errorMessage = 'Risorsa non trovata'
                break
            case 422:
                errorMessage = errorData?.message || 'Dati non validi'
                break
            case 500:
                errorMessage = 'Errore interno del server'
                break
            case 502:
                errorMessage = 'Servizio temporaneamente non disponibile'
                break
            case 503:
                errorMessage = 'Servizio non disponibile'
                break
            default:
                errorMessage = errorData?.message || `Errore del server (${errorStatus})`
        }
    } else if (error.request) {
        // Richiesta effettuata ma nessuna risposta ricevuta
        errorMessage = 'Impossibile raggiungere il server. Verifica la connessione di rete.'
        errorStatus = 0
    } else {
        // Errore nella configurazione della richiesta
        errorMessage = error.message || 'Errore sconosciuto nella configurazione della richiesta'
        errorStatus = -1
    }

    // Restituisce un oggetto errore standardizzato
    const standardError = new Error(errorMessage)
    standardError.status = errorStatus
    standardError.data = errorData
    standardError.originalError = error

    return standardError
}