// src/composables/useConfig.js
import configService from '@/services/config.service'
import userManagementService from '@/services/userManagement.service'
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

  const addDeployment = async (deployment /* DeployModel */) => {
    try {
      isLoading.value = true
      error.value = null

      // Prima aggiungi il deployment
      const result = await configService.addDeployment(deployment)

      // Se il deployment è stato aggiunto con successo, crea il gruppo
      if (result) {
        console.log('Deployment aggiunto:', result)

        // Crea automaticamente il gruppo per il deployment
        await createGroupForDeployment(deployment.name)

        // Ricarica i deployments
        await loadDeployments()
      }

      return { ok: true, data: result }
    } catch (err) {
      console.error('Errore durante aggiunta deployment:', err)
      error.value = err.response?.data?.message || err.message || 'Errore durante aggiunta deployment'
      return { ok: false, error: err }
    } finally {
      isLoading.value = false
    }
  }

  const removeDeployment = async (ip) => {
    try {
      isLoading.value = true
      error.value = null

      // Prima trova il deployment da rimuovere per ottenere il nome
      const deploymentToRemove = deployments.value.find(d =>
        d.IP === ip || d.ip === ip || d.ipAddress === ip
      )

      // Rimuovi il deployment
      const result = await configService.removeDeployment(ip)

      if (result && deploymentToRemove) {
        console.log('Deployment rimosso:', result)

        // Elimina automaticamente il gruppo associato
        await deleteGroupForDeployment(deploymentToRemove.name)

        // Ricarica i deployments
        await loadDeployments()
      }

      return { ok: true, data: result }
    } catch (err) {
      console.error('Errore durante rimozione deployment:', err)
      error.value = err.response?.data?.message || err.message || 'Errore durante rimozione deployment'
      return { ok: false, error: err }
    } finally {
      isLoading.value = false
    }
  }

  // Metodo per creare automaticamente un gruppo per il deployment
  const createGroupForDeployment = async (deploymentName) => {
    try {
      const groupName = `${deploymentName}`
      const description = `Gruppo automatico per il deployment ${deploymentName}`

      console.log(`Creazione gruppo automatico: ${groupName}`)

      await userManagementService.createGroup(groupName, description)
      console.log('Gruppo creato con successo:', groupName)

    } catch (error) {
      console.error('Errore nella creazione del gruppo:', error)

      // Non bloccare l'operazione se il gruppo esiste già o c'è un errore minore
      if (error.response?.data?.message?.includes('esiste già') ||
        error.response?.data?.message?.includes('already exists')) {
        console.log('Gruppo già esistente, continuando...')
      } else {
        console.warn('Attenzione: errore nella creazione automatica del gruppo')
      }
    }
  }

  // Metodo per eliminare automaticamente il gruppo quando un deployment viene rimosso
  const deleteGroupForDeployment = async (deploymentName) => {
    try {
      const groupName = `${deploymentName}`

      console.log(`Eliminazione gruppo automatico: ${groupName}`)

      await userManagementService.deleteGroup(groupName)
      console.log('Gruppo eliminato con successo:', groupName)

    } catch (error) {
      console.error('Errore nell\'eliminazione del gruppo:', error)

      // Non bloccare l'operazione se il gruppo non esiste o c'è un errore minore
      if (error.response?.data?.message?.includes('non trovato') ||
        error.response?.data?.message?.includes('not found')) {
        console.log('Gruppo non esistente, continuando...')
      } else {
        console.warn('Attenzione: errore nell\'eliminazione automatica del gruppo')
      }
    }
  }

  const clearError = () => { error.value = null }

  return {
    // stato
    isLoading, error, deployments, lastOperation,
    // azioni
    loadDeployments, checkDeployments, checkSingleDeployment,
    setDelayConfig, setKeyConfig, addDeployment, removeDeployment,
    // gestione gruppi
    createGroupForDeployment, deleteGroupForDeployment,
    // utils
    clearError
  }
}
