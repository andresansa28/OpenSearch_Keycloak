<template>
    <div class="pa-6">
        <!-- Header -->
        <div class="d-flex align-center justify-center mb-6">
            <div class="d-flex flex-column align-center justify-center">
                <h1 class="text-h4 font-weight-bold mb-2">Analyzer Configuration</h1>
                <p class="text-subtitle-1 text-medium-emphasis">
                    Manage deployment configurations and analyzer settings
                </p>
            </div>
        </div>

        <!-- Status card -->
        <v-row class="mb-6">
            <v-col cols="12" md="6">
                <v-card class="pa-4" elevation="2">
                    <h3 class="text-h6 mb-3">Analyzer Status</h3>
                    <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                            <v-icon :color="isRunning ? 'success' : 'error'" size="30" class="mr-3">
                                {{ isRunning ? 'mdi-play-circle' : 'mdi-stop-circle' }}
                            </v-icon>
                            <div>
                                <p class="text-body-1 font-weight-medium">
                                    {{ isRunning ? 'Running' : 'Stopped' }}
                                </p>
                                <p class="text-body-2 text-medium-emphasis">
                                    Last updated: {{ lastUpdate }}
                                </p>
                                <!-- Mostra errori se presenti -->
                                <p v-if="analyzerError" class="text-body-2 text-error mt-1">
                                    {{ analyzerError }}
                                </p>
                            </div>
                        </div>
                        <v-btn :color="isRunning ? 'error' : 'success'"
                            :prepend-icon="isRunning ? 'mdi-stop' : 'mdi-play'" :loading="analyzerLoading"
                            :disabled="isAnyLoading" @click="toggleAnalyzer">
                            {{ isRunning ? 'Stop' : 'Start' }}
                        </v-btn>
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" md="6">
                <v-card class="pa-4" elevation="2">
                    <h3 class="text-h6 mb-3">OpenSearch Connection</h3>
                    <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                            <v-icon :color="opensearchStatus ? 'success' : 'error'" size="30" class="mr-3">
                                {{ opensearchStatus ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                            </v-icon>
                            <div>
                                <p class="text-body-1 font-weight-medium">
                                    {{ opensearchStatus ? 'Connected' : 'Disconnected' }}
                                </p>
                                <p class="text-body-2 text-medium-emphasis">
                                    Cluster: opensearch-cluster-01
                                </p>
                            </div>
                        </div>
                        <v-btn color="primary" prepend-icon="mdi-cog" variant="outlined" :loading="analyzerLoading"
                            :disabled="isAnyLoading" @click="setupOpenSearch">
                            Auto Setup
                        </v-btn>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Deployment configurations con card moderne -->
        <div class="mb-6">
            <div class="d-flex align-center justify-space-between mb-4">
                <h2 class="text-h6">Deployment Configurations</h2>
                <div>
                    <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="openWizard">
                        Add New Deploy
                    </v-btn>
                    <v-btn color="primary" variant="outlined" size="small" :loading="configLoading"
                        :disabled="isAnyLoading" @click="refreshDeployments">
                        <v-icon start>mdi-refresh</v-icon>
                        Refresh Status
                    </v-btn>
                </div>
            </div>

            <!-- Mostra errori di configurazione se presenti -->
            <v-alert v-if="configError || analyzerError" type="error" class="mb-4" dismissible
                @click:close="clearAllErrors">
                {{ configError || analyzerError }}
            </v-alert>

            <!-- Loading state per deployments -->
            <v-row v-if="configLoading && (!deployments || deployments.length === 0)">
                <v-col cols="12">
                    <v-card class="pa-6 text-center">
                        <v-progress-circular indeterminate color="primary" class="mb-3"></v-progress-circular>
                        <p class="text-body-1">Caricamento deployments...</p>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Empty state -->
            <v-row v-else-if="!configLoading && (!deployments || deployments.length === 0)">
                <v-col cols="12">
                    <v-card class="pa-6 text-center">
                        <v-icon size="60" color="grey" class="mb-3">mdi-server-off</v-icon>
                        <h3 class="text-h6 mb-2">Nessun deployment configurato</h3>
                        <p class="text-body-2 text-medium-emphasis mb-4">
                            Aggiungi il tuo primo deployment per iniziare
                        </p>
                        <v-btn color="primary" prepend-icon="mdi-plus" @click="openWizard">
                            Aggiungi Deployment
                        </v-btn>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Lista deployments -->
            <v-row v-else>
                <v-col v-for="(deploy, index) in deployments" :key="deploy.ip || deploy.IP || index" cols="12" md="6"
                    lg="4">
                    <v-card class="deploy-card pa-4" elevation="3"
                        :class="{ 'deploy-card--online': isDeploymentOnline(deploy) }"
                        @click="showDeployDetails(deploy)" hover>
                        <!-- Header della card -->
                        <div class="d-flex align-center justify-space-between mb-3">
                            <div>
                                <h3 class="text-h6 font-weight-bold">{{ deploy.name || 'Nome non disponibile' }}</h3>
                                <div class="text-body-2 text-medium-emphasis font-family-monospace">
                                    {{ deploy.IP || deploy.ip || deploy.ipAddress }}
                                </div>
                            </div>
                            <v-menu>
                                <template v-slot:activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props"
                                        @click.stop class="menu-button"></v-btn>
                                </template>
                                <v-list>
                                    <v-list-item @click="editDeploy(deploy)">
                                        <v-list-item-title>
                                            <v-icon start>mdi-pencil</v-icon>
                                            Edit
                                        </v-list-item-title>
                                    </v-list-item>
                                    <v-list-item @click="deleteDeploy(deploy)">
                                        <v-list-item-title class="text-error">
                                            <v-icon start>mdi-delete</v-icon>
                                            Delete
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>

                        <!-- Status indicators -->
                        <div class="mb-4">
                            <v-chip :color="getDeploymentStatusColor(deploy)" size="small" class="mr-2 mb-2">
                                <v-icon start>{{ isDeploymentOnline(deploy) ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
                                {{ getDeploymentStatusText(deploy) }}
                                <v-progress-circular v-if="isCheckingDeployment(deploy)" indeterminate size="16"
                                    width="2" class="ml-2"></v-progress-circular>
                            </v-chip>

                            <v-chip color="info" size="small" class="mb-2">
                                <v-icon start>mdi-database</v-icon>
                                Config OK
                            </v-chip>
                        </div>

                        <!-- Device count -->
                        <div class="d-flex align-center mb-3">
                            <v-icon color="primary" class="mr-2">mdi-devices</v-icon>
                            <span class="text-body-1">{{ (deploy.Containers || deploy.devices || []).length }}
                                devices</span>
                        </div>

                        <!-- Created date -->
                        <div class="d-flex justify-end">
                            <div class="text-caption text-medium-emphasis">
                                Deploy configurato
                            </div>
                        </div>

                        <!-- Click indicator -->
                        <div class="deploy-card__overlay">
                            <v-icon>mdi-eye</v-icon>
                            <span class="ml-2">View Details</span>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </div>

        <!-- Dialog per la creazione di un nuovo deploy -->
        <v-dialog v-model="wizardDialog" max-width="820px" persistent>
            <DeployWizard @close="wizardDialog = false" @save="handleDeploySave" />
        </v-dialog>

        <!-- Dialog per visualizzare i dettagli del deploy -->
        <v-dialog v-model="deployDialog" max-width="700px">
            <v-card v-if="selectedDeploy">
                <v-card-title class="d-flex align-center justify-space-between">
                    <div>
                        <span class="text-h5">{{ selectedDeploy.name }}</span>
                        <div class="text-body-2 text-medium-emphasis font-family-monospace">
                            Deploy IP: {{ selectedDeploy.IP || selectedDeploy.ip || selectedDeploy.ipAddress }}
                        </div>
                    </div>
                    <v-btn icon="mdi-close" variant="text" @click="deployDialog = false"></v-btn>
                </v-card-title>

                <v-card-text>
                    <!-- Status del deploy -->
                    <div class="mb-4">
                        <v-chip :color="getDeploymentStatusColor(selectedDeploy)" size="small" class="mr-2">
                            <v-icon start>{{ isDeploymentOnline(selectedDeploy) ? 'mdi-wifi' : 'mdi-wifi-off'
                            }}</v-icon>
                            {{ getDeploymentStatusText(selectedDeploy) }}
                        </v-chip>

                        <v-chip color="info" size="small">
                            <v-icon start>mdi-database</v-icon>
                            Configurato
                        </v-chip>
                    </div>

                    <!-- Informazioni di connessione -->
                    <div class="mb-4">
                        <h4 class="text-subtitle-1 mb-2">Connection Details</h4>
                        <v-chip size="small" variant="outlined" class="mr-2 mb-1">
                            <v-icon start>mdi-account</v-icon>
                            User: {{ selectedDeploy.user }}
                        </v-chip>
                        <v-chip v-if="selectedDeploy.DockerNet" size="small" variant="outlined" class="mb-1">
                            <v-icon start>mdi-docker</v-icon>
                            Network: {{ selectedDeploy.DockerNet }}
                        </v-chip>
                    </div>

                    <!-- Lista dispositivi -->
                    <h3 class="text-h6 mb-3">Connected Devices ({{ (selectedDeploy.Containers || selectedDeploy.devices
                        ||
                        []).length }})</h3>

                    <v-row>
                        <v-col v-for="device in (selectedDeploy.Containers || selectedDeploy.devices || [])"
                            :key="device.id || device.IP || device.ip" cols="12" sm="6">
                            <v-card variant="outlined" class="pa-3">
                                <div class="d-flex align-center mb-2">
                                    <v-icon :color="getDeviceTypeColor(device.type || 'plc')" size="24" class="mr-2">
                                        {{ getDeviceIcon(device.type || 'plc') }}
                                    </v-icon>
                                    <span class="text-subtitle-1 font-weight-medium">{{ device.name }}</span>
                                </div>

                                <div class="text-body-2 text-medium-emphasis mb-1">
                                    Type: {{ (device.type || 'PLC').toUpperCase() }}
                                </div>

                                <div class="text-body-2 font-family-monospace">
                                    IP: {{ device.IP || device.ip || device.ipAddress || 'N/A' }}
                                </div>

                                <v-chip color="success" size="x-small" class="mt-2">
                                    configured
                                </v-chip>
                            </v-card>
                        </v-col>

                        <!-- Empty state per devices -->
                        <v-col
                            v-if="!selectedDeploy.Containers && !selectedDeploy.devices || (selectedDeploy.Containers || selectedDeploy.devices || []).length === 0"
                            cols="12">
                            <v-card variant="outlined" class="pa-6 text-center">
                                <v-icon size="40" color="grey" class="mb-2">mdi-devices</v-icon>
                                <p class="text-body-2 text-medium-emphasis">
                                    Nessun dispositivo configurato per questo deployment
                                </p>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="outlined" @click="deployDialog = false">
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Placeholder per configurazioni aggiuntive -->
        <v-row class="mt-6 ">

            <v-col cols="12" md="6">
                <v-card class="pa-6" elevation="2" height="200">
                    <h3 class="text-h6 mb-4">Log Settings</h3>
                    <div class="d-flex align-center justify-center" style="height: 120px;">
                        <div class="text-center">
                            <v-icon size="50" color="secondary" class="mb-2">mdi-file-document</v-icon>
                            <p class="text-body-1 text-medium-emphasis">Logging configuration</p>
                        </div>
                    </div>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import DeployWizard from '@/components/DeployWizard.vue'
import { useAnalyzer } from '@/composables/useAnalyzer'
import { useConfig } from '@/composables/useConfig'
import { computed, onMounted, ref, watch } from 'vue'

// Composables per gestire analyzer e configurazioni
const {
    isLoading: analyzerLoading,
    error: analyzerError,
    status: analyzerStatus,
    isRunning,
    startAnalyzer,
    stopAnalyzer,
    forceOpenSearchSetup,
    checkStatus,
    clearError: clearAnalyzerError
} = useAnalyzer()

const {
    isLoading: configLoading,
    error: configError,
    deployments,
    loadDeployments,
    checkDeployments,
    checkSingleDeployment,
    addDeployment,
    removeDeployment,
    clearError: clearConfigError
} = useConfig()

// State locale per i dialog e gestione UI
const deployDialog = ref(false)
const selectedDeploy = ref(null)
const wizardDialog = ref(false)
const lastUpdate = ref(new Date().toLocaleString())

// Mappa per memorizzare lo stato online dei deployment
const deploymentStatus = ref(new Map())

// Set per tracciare i deployment in fase di controllo
const checkingDeployments = ref(new Set())

// Computed properties
const isAnyLoading = computed(() => analyzerLoading.value || configLoading.value)

const opensearchStatus = computed(() => {
    // Controlla se OpenSearch è configurato dal status dell'analyzer
    return analyzerStatus.value?.opensearch_configured || false
})

// Watch per aggiornare l'ultimo timestamp quando cambia lo stato
watch([isRunning, analyzerStatus], () => {
    lastUpdate.value = new Date().toLocaleString()
})

// Funzioni per gestire l'analyzer (ispirate al componente Angular)
const toggleAnalyzer = async () => {
    clearAnalyzerError()

    if (isRunning.value) {
        const success = await stopAnalyzer()
        if (success) {
            console.log('Analyzer fermato con successo')
        }
    } else {
        const success = await startAnalyzer()
        if (success) {
            console.log('Analyzer avviato con successo')
        }
    }
}

const setupOpenSearch = async () => {
    clearAnalyzerError()
    const success = await forceOpenSearchSetup()
    if (success) {
        console.log('Setup OpenSearch completato')
        // Aggiorna lo status dopo il setup
        await checkStatus()
    }
}

// Funzioni per gestire i deployments (refactor: niente fallback su `active/status`)
const refreshDeployments = async () => {
    clearConfigError()
    console.log('Aggiornamento deployments...')
    await loadDeployments()

    // inizializza la mappa stati a null per tutti gli IP noti
    const initMap = new Map()
    for (const d of deployments.value || []) {
        const ip = d.IP || d.ip || d.ipAddress
        if (ip) initMap.set(ip, null)
    }
    deploymentStatus.value = initMap

    // poi esegui il controllo reale (ping)
    await checkAllDeployments()
    console.log('fine chiamata')
}

const checkAllDeployments = async () => {
    try {
        const result = await checkDeployments()

        if (result && result.deployments) {
            const statusMap = new Map(deploymentStatus.value)

            // normalizza le varie forme di risposta
            let deploymentsList = result.deployments
            deploymentsList.forEach((item, index) => {
                const ip = item.ip || item.IP || item.ipAddress

                if (!ip) {
                    return
                }

                // considera online solo un boolean esplicito dalla chiamata di check
                if (typeof item.online === 'boolean') {
                    statusMap.set(ip, item.online)
                } else if (typeof item.isOnline === 'boolean') {
                    statusMap.set(ip, item.isOnline)
                } else {
                    statusMap.set(ip, null) // sconosciuto se non c'è esito
                }
            })

            deploymentStatus.value = statusMap
        } else {
            console.log('TEMP DEBUG: checkDeployments non ha restituito result.deployments', result)
        }
    } catch (error) {
        console.error('Errore nel controllo dei deployments:', error)
    }
}

const handleDeploySave = async (deployData) => {
    const deploymentData = {
        name: deployData.name,
        IP: deployData.vmIp,
        user: deployData.sshUser,
        passw: deployData.sshPassword,
        active: true,
        Containers: deployData.devices.map(device => ({
            name: device.name,
            IP: device.ip
        })),
        DockerNet: deployData.dockerNet || undefined
    }

    const result = await addDeployment(deploymentData)
    if (result.ok) {
        wizardDialog.value = false
        await refreshDeployments()
        console.log(`Deployment '${deploymentData.name}' aggiunto con successo e gruppo creato automaticamente`)
    } else {
        console.error('Errore nell\'aggiunta del deployment:', result.error)
    }
}

const editDeploy = (deploy) => {
    console.log('Modifica deploy:', deploy)
    // TODO: Implementare modifica deploy
}

const deleteDeploy = async (deploy) => {
    const deployIP = deploy.IP || deploy.ip || deploy.ipAddress
    if (!deployIP) {
        console.error('IP del deployment non trovato')
        return
    }

    const result = await removeDeployment(deployIP)
    if (result.ok) {
        await refreshDeployments()
        console.log(`Deployment '${deploy.name}' rimosso con successo e gruppo eliminato automaticamente`)
    } else {
        console.error('Errore nella rimozione del deployment:', result.error)
    }
}

// Utility functions (invariato)
const getDeviceTypeColor = (type) => {
    switch (type) {
        case 'plc': return 'primary'
        case 'scada': return 'success'
        case 'hmi': return 'info'
        case 'gateway': return 'warning'
        default: return 'grey'
    }
}
const getDeviceIcon = (type) => {
    switch (type) {
        case 'plc': return 'mdi-chip'
        case 'scada': return 'mdi-monitor-dashboard'
        case 'hmi': return 'mdi-tablet'
        case 'gateway': return 'mdi-router-wireless'
        default: return 'mdi-devices'
    }
}
const showDeployDetails = (deploy) => {
    selectedDeploy.value = deploy
    deployDialog.value = true
}
const openWizard = () => { wizardDialog.value = true }

// Pulizia errori unificata
const clearAllErrors = () => {
    clearConfigError()
    clearAnalyzerError()
}

// Stato online: true/false/null (sconosciuto)
const isDeploymentOnline = (deploy) => {
    const ip = deploy.IP || deploy.ip || deploy.ipAddress
    const val = deploymentStatus.value.get(ip)
    if (val === true) return true
    if (val === false) return false
    return null // sconosciuto
}
const getDeploymentStatusText = (deploy) => {
    const v = isDeploymentOnline(deploy)
    if (v === true) return 'Online'
    if (v === false) return 'Offline'
    return 'Sconosciuto'
}
const getDeploymentStatusColor = (deploy) => {
    const v = isDeploymentOnline(deploy)
    if (v === true) return 'success'
    if (v === false) return 'error'
    return 'grey'
}

const isCheckingDeployment = (deploy) => {
    const ip = deploy.IP || deploy.ip || deploy.ipAddress
    return checkingDeployments.value.has(ip)
}


// Inizializzazione (unica onMounted)
onMounted(async () => {
    console.log('Inizializzazione analyzer page...')
    try {
        await checkStatus()
        await loadDeployments()

        // inizializza mappa stati a null per ips conosciuti
        const initMap = new Map()
        for (const d of deployments.value || []) {
            const ip = d.IP || d.ip || d.ipAddress
            if (ip) initMap.set(ip, null)
        }
        deploymentStatus.value = initMap

        // poi esegui il controllo reale
        await checkAllDeployments()

        lastUpdate.value = new Date().toLocaleString()
        console.log('Inizializzazione completata')
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error)
    }
})

</script>

<style scoped>
.v-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.deploy-card {
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(145deg, rgba(30, 30, 30, 0.8), rgba(45, 45, 45, 0.6));
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
}

.deploy-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.3);
}

.deploy-card--online {
    border-left: 4px solid #4CAF50;
}

.deploy-card--online:hover {
    border-left: 4px solid #82fe86;
}

.deploy-card:not(.deploy-card--online) {
    border-left: 4px solid #F44336;
}

.deploy-card:not(.deploy-card--online):hover {
    border-left: 4px solid #ff786e;
}

.deploy-card__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    color: white;
    font-weight: 500;
    pointer-events: none;
}

.deploy-card:hover .deploy-card__overlay {
    opacity: 1;
}

/* Assicura che il menu button rimanga cliccabile durante l'hover */
.menu-button {
    position: relative;
    z-index: 10;
    pointer-events: auto !important;
}

.text-body-1 {
    font-weight: 500;
}

.v-chip {
    font-weight: 500;
}

/* Stili per le device cards nel dialog */
.v-card[variant="outlined"] {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.2s ease;
}

.v-card[variant="outlined"]:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.25);
}

.font-family-monospace {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-weight: 600;
}
</style>