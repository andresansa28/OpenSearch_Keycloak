// src/api/config.service.js
import { configClient } from '@/api/http/client'

// Endpoints locali al service (puoi centralizzarli in un file condiviso se preferisci)
const ENDPOINTS = {
  GET_CONFIG: '/getConfig',
  CHECK_DEPLOYMENTS: '/checkDeployments',
  CHECK_SINGLE: (ip) => `/checkSingleDeployment/${ip}`,
  CHANGE_DELAY: (delay) => `/change_delay/${delay}`,
  CHANGE_KEY: (key) => `/change_key/${encodeURIComponent(key)}`,
  ADD_DEPLOY: '/addDeploy',
  REMOVE_DEPLOY: '/removeDeploy'
}

// Normalizza l'errore in un Error con message leggibile
function normalizeApiError(err, fallbackMsg) {
  const msg =
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallbackMsg ||
    'Errore di rete'
  return new Error(msg)
}

class ConfigService {
  // GET /getConfig
  async getDeployments() {
    try {
      const r = await configClient.get(ENDPOINTS.GET_CONFIG)
      return r.data
    } catch (e) {
      throw normalizeApiError(e, 'Errore nel recupero dei deployment')
    }
  }

  // GET /checkDeployments
  async checkDeployments() {
    try {
      const r = await configClient.get(ENDPOINTS.CHECK_DEPLOYMENTS)
      console.log(r)
      return r.data
    } catch (e) {
      throw normalizeApiError(e, 'Errore nel controllo dei deployment')
    }
  }

  // GET /checkSingleDeployment/:ip
  async checkSingleDeployment(ip) {
    try {
      const r = await configClient.get(ENDPOINTS.CHECK_SINGLE(ip))
      return r.data
    } catch (e) {
      throw normalizeApiError(e, `Errore nel controllo del deployment ${ip}`)
    }
  }

  // GET /change_delay/:delay   (nota: idealmente sarebbe POST; manteniamo GET per compatibilità backend)
  async setDelayConfig(delay) {
    try {
      const r = await configClient.get(ENDPOINTS.CHANGE_DELAY(delay))
      return r.data
    } catch (e) {
      throw normalizeApiError(e, 'Errore nella modifica del delay')
    }
  }

  // GET /change_key/:key      (nota: idealmente POST; manteniamo GET per compatibilità backend)
  async setKeyConfig(key) {
    try {
      const r = await configClient.get(ENDPOINTS.CHANGE_KEY(key))
      return r.data
    } catch (e) {
      throw normalizeApiError(e, 'Errore nella modifica della chiave')
    }
  }

  // POST /addDeploy  body: DeployModel
  async addDeployment(deployment /* DeployModel */) {
    try {
      const r = await configClient.post(ENDPOINTS.ADD_DEPLOY, deployment)
      return r.data
    } catch (e) {
      throw normalizeApiError(e, 'Errore nell’aggiunta del deployment')
    }
  }

  // POST /removeDeploy  body: { ips: [ip] }
  async removeDeployment(ipToRemove) {
    try {
      const body = { ips: [ipToRemove] }
      const r = await configClient.post(ENDPOINTS.REMOVE_DEPLOY, body)
      return r.data
    } catch (e) {
      throw normalizeApiError(e, 'Errore nella rimozione del deployment')
    }
  }
}

const configService = new ConfigService()
export default configService
