// src/composables/useConfig.js
import configService from '@/services/config.service'
import { ref } from 'vue'

export function useConfig() {
  const isLoading = ref(false)
  const error = ref(null)
  const deployments = ref([])   // elenco deployment (getConfig)
  const lastOperation = ref(null)

  const run = async (operationName, operation, onSuccess = null) => {
    try {
      isLoading.value = true
      error.value = null

      const result = await operation()

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (err) {
      console.error(`Errore durante ${operationName}:`, err)
      error.value = err.response?.data?.message || err.message || `Errore durante ${operationName}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadDeployments = async () =>
    run('caricamento configurazioni', () => configService.getDeployments(), (data) => {
      // Estrai l'array corretto dai dati
      let deploymentsArray = []

      if (Array.isArray(data)) {
        deploymentsArray = data
      } else if (data && Array.isArray(data.RemoteDeployments)) {
        deploymentsArray = data.RemoteDeployments
      } else if (data && Array.isArray(data.deployments)) {
        deploymentsArray = data.deployments
      } else if (data) {
        deploymentsArray = [data]
      }

      deployments.value = deploymentsArray
      console.log('Deployments caricati:', deploymentsArray.length)
    })

  const checkDeployments = async () =>
    run('verifica deployments', () => configService.checkDeployments())

  const checkSingleDeployment = async (ip) =>
    run('verifica singolo deployment', () => configService.checkSingleDeployment(ip))

  const setDelayConfig = async (delay) =>
    run('set delay', () => configService.setDelayConfig(delay))

  const setKeyConfig = async (key) =>
    run('set key', () => configService.setKeyConfig(key))

  const addDeployment = async (deployment /* DeployModel */) =>
    run('aggiunta deployment', () => configService.addDeployment(deployment), () => loadDeployments())

  const removeDeployment = async (ip) =>
    run('rimozione deployment', () => configService.removeDeployment(ip), () => loadDeployments())

  const clearError = () => { error.value = null }

  return {
    // stato
    isLoading, error, deployments, lastOperation,
    // azioni
    loadDeployments, checkDeployments, checkSingleDeployment,
    setDelayConfig, setKeyConfig, addDeployment, removeDeployment,
    // utils
    clearError
  }
}
