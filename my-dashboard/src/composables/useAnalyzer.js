// src/composables/useAnalyzer.js
import analyzerService from '@/services/analyzer.service'
import { computed, ref } from 'vue'


export function useAnalyzer() {
    const isLoading = ref(false)
    const error = ref(null)
    const status = ref(null)
    const lastOperation = ref(null)

    const isRunning = computed(() => !!(status.value && status.value.running))

    const analyzerState = computed(() => {
        if (isLoading.value) return 'loading'
        if (error.value) return 'error'
        if (status.value == null) return 'unknown'
        return isRunning.value ? 'running' : 'stopped'
    })

    const statusColor = computed(() => {
        const map = {
            running: 'success',
            loading: 'warning',
            error: 'error',
            stopped: 'grey',
            unknown: 'grey-lighten-1'
        }
        return map[analyzerState.value] || 'grey'
    })


    const executeAsyncOperation = async (operation, operationName, updateStatus = false) => {
        isLoading.value = true
        error.value = null
        lastOperation.value = operationName
        try {
            const result = await operation()
            if (updateStatus) await checkStatus(1) // piccolo retry per consistenza
            return { ok: true, data: result }
        } catch (err) {
            error.value = err?.message || `Errore durante ${operationName}`
            return { ok: false, data: null }
        } finally {
            isLoading.value = false
        }
    }

    const checkStatus = async (retries = 0) => {
        const res = await executeAsyncOperation(() => analyzerService.getStatus(), 'controllo status')
        if (res.ok) {
            status.value = res.data
            return res.data
        }
        if (retries > 0) {
            return checkStatus(retries - 1)
        }
        status.value = null
        return null
    }

    // Azioni principali
    const startAnalyzer = async () =>
        (await executeAsyncOperation(() => analyzerService.start(), 'avvio analyzer', true)).ok

    const stopAnalyzer = async () =>
        (await executeAsyncOperation(() => analyzerService.stop(), 'stop analyzer', true)).ok

    const forceOpenSearchSetup = async () =>
        (await executeAsyncOperation(() => analyzerService.forceOpenSearchSetup(), 'configurazione OpenSearch')).ok

    const loadJson = async () =>
        (await executeAsyncOperation(() => analyzerService.loadJson(), 'caricamento JSON')).ok

    const runZeek = async (standard = false) =>
        (await executeAsyncOperation(() => analyzerService.runZeek(standard), 'esecuzione Zeek')).ok


    const clearError = () => { error.value = null }
    const reset = () => { error.value = null; status.value = null; lastOperation.value = null }

    return {
        
        isLoading, error, status, isRunning, lastOperation,
        
        analyzerState, statusColor,
        
        startAnalyzer, stopAnalyzer, forceOpenSearchSetup, loadJson, runZeek, checkStatus,
        
        clearError, reset
    }
}
