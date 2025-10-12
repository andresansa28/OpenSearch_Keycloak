// src/models/deploy.model.js

/**
 * @typedef {Object} Container
 * @property {string} IP           - Indirizzo IP del container
 * @property {string} name         - Nome del container
 * @property {string} [status]     - Stato del container (opzionale)
 */

/**
 * @typedef {Object} DeployModel
 * @property {string} name         - Nome del deployment
 * @property {string} IP           - Indirizzo IP dell'host remoto
 * @property {string} user         - Utente per la connessione SSH o remota
 * @property {string} passw        - Password o token per la connessione
 * @property {boolean} active      - Se il deployment è attivo
 * @property {Container[]} Containers - Lista di container associati
 * @property {string} [status]     - Stato opzionale del deployment
 * @property {string} [DockerNet]  - Nome rete Docker (macvlan, ecc.)
 */

/**
 * @typedef {Object} DeploymentsModel
 * @property {number} delay                     - Delay di configurazione
 * @property {string} MaxMind_GeoDB_Key         - Chiave API per GeoDB MaxMind
 * @property {DeployModel[]} RemoteDeployments  - Elenco dei deployment remoti
 */

