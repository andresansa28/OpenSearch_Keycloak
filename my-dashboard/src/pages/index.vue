<template>
    <div class="pa-6">
        <!-- Header della dashboard -->
        <div class="text-center mb-6">
            <h1 class="text-h4 font-weight-bold mb-2">Dashboard</h1>
            <p class="text-subtitle-1 text-medium-emphasis mb-6">
                Network Traffic Analysis Overview
            </p>

            <!-- Selezione Tenant centrata -->
            <div class="d-flex justify-center">
                <v-card class="pa-6" width="400" elevation="3">
                    <h3 class="text-h6 mb-4 text-center">Select OpenSearch Tenant</h3>

                    <!-- Stato di caricamento -->
                    <div v-if="tenantsLoading" class="text-center py-4">
                        <v-progress-circular :size="30" :width="3" color="primary" indeterminate>
                        </v-progress-circular>
                        <p class="mt-2 text-caption">Loading available tenants...</p>
                    </div>

                    <!-- Errore nel caricamento -->
                    <v-alert v-else-if="tenantsError" type="error" variant="tonal" class="mb-4" :text="tenantsError">
                    </v-alert>

                    <!-- Selezione tenant -->
                    <v-select v-else :model-value="selectedTenant?.id" :items="tenants" item-title="displayName"
                        item-value="id" label="Choose a tenant to analyze" prepend-icon="mdi-database"
                        variant="outlined" density="comfortable" @update:model-value="onTenantChange"
                        class="tenant-select" :disabled="tenants.length === 0">
                    </v-select>

                    <!-- Messaggio se non ci sono tenant -->
                    <v-alert v-if="!tenantsLoading && !tenantsError && tenants.length === 0" type="info" variant="tonal"
                        text="No tenants available. Contact your administrator.">
                    </v-alert>

                    <!-- Tenant corrente -->
                    <div v-if="selectedTenant && !tenantsLoading" class="mt-3 text-center">
                        <v-chip color="primary" variant="tonal" size="small">
                            Current: {{ currentTenantName }}
                        </v-chip>
                    </div>
                </v-card>
            </div>
        </div>

        Statistiche principali
        <v-row class="mb-6">
            <v-col cols="12" sm="6" md="4">
                <v-card class="pa-4" elevation="2">
                    <div class="d-flex align-center">
                        <v-icon color="primary" size="40" class="mr-3">mdi-chart-line</v-icon>
                        <div>
                            <p class="text-subtitle-2 text-medium-emphasis mb-1">Total Traffic</p>
                            <h3 class="text-h5 font-weight-bold">{{ formatBytes(stats.totalTraffic) }}</h3>
                        </div>
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="4">
                <v-card class="pa-4" elevation="2">
                    <div class="d-flex align-center">
                        <v-icon color="success" size="40" class="mr-3">mdi-server-network</v-icon>
                        <div>
                            <p class="text-subtitle-2 text-medium-emphasis mb-1">Active Connections</p>
                            <h3 class="text-h5 font-weight-bold">{{ stats.activeConnections.toLocaleString() }}</h3>
                        </div>
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="4">
                <v-card class="pa-4" elevation="2">
                    <div class="d-flex align-center">
                        <v-icon color="warning" size="40" class="mr-3">mdi-alert-circle</v-icon>
                        <div>
                            <p class="text-subtitle-2 text-medium-emphasis mb-1">Alerts</p>
                            <h3 class="text-h5 font-weight-bold">{{ stats.alerts }}</h3>
                        </div>
                    </div>
                </v-card>
            </v-col>

            <!-- <v-col cols="12" sm="6" md="3">
                <v-card class="pa-4" elevation="2">
                    <div class="d-flex align-center">
                        <v-icon color="info" size="40" class="mr-3">mdi-speedometer</v-icon>
                        <div>
                            <p class="text-subtitle-2 text-medium-emphasis mb-1">Avg Latency</p>
                            <h3 class="text-h5 font-weight-bold">{{ stats.avgLatency }}ms</h3>
                        </div>
                    </div>
                </v-card>
            </v-col> -->
        </v-row>

        <!-- Grafici principali -->
        <v-row class="mb-6">
            <v-col cols="12" lg="8">
                <v-card class="pa-4" elevation="2" height="520px">
                    <TrafficOverTimeChart />
                </v-card>
            </v-col>

            <v-col cols="12" lg="4">
                <v-card class="pa-6" elevation="2" height="520px">
                    <ProtocolDistributionChart />
                </v-card>
            </v-col>
        </v-row>

        <!-- Grafico geografico -->
        <v-row class="mb-6">
            <v-col cols="12" lg="12">
                <v-card class="pa-4" elevation="2">
                    <GeographicConnectionsChart />
                </v-card>
            </v-col>
        </v-row>

        <!-- Grafici secondari -->
        <v-row class="mb-6">
            <v-col cols="12" lg="6">
                <v-card class="pa-4" elevation="2" height="450">
                    <TopIPsChart />
                </v-card>
            </v-col>

            <v-col cols="12" lg="6">
                <v-card class="pa-4" elevation="2" height="450">
                    <AnomaliesChart />
                </v-card>
            </v-col>
        </v-row>

        <!-- Grafici avanzati -->
        <v-row class="mb-6">
            <v-col cols="12" lg="12">
                <v-card class="pa-4" elevation="2">
                    <IndustrialProtocolChart />
                </v-card>
            </v-col>
        </v-row>

    </div>
</template>

<script setup>
import AnomaliesChart from '@/components/charts/AnomaliesChart.vue'
import GeographicConnectionsChart from '@/components/charts/GeographicConnectionsChart.vue'
import IndustrialProtocolChart from '@/components/charts/IndustrialProtocolChart.vue'
import ProtocolDistributionChart from '@/components/charts/ProtocolDistributionChart.vue'
import TopIPsChart from '@/components/charts/TopIPsChart.vue'
import TrafficOverTimeChart from '@/components/charts/TrafficOverTimeChart.vue'
import { useTenant } from '@/composables/useTenant'
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref, watch } from 'vue'

// Usa il composable per gestire i tenant
const {
    tenants,
    selectedTenant,
    loading: tenantsLoading,
    error: tenantsError,
    fetchTenants,
    selectTenant,
    currentTenantName
} = useTenant()

const authStore = useAuthStore()

const stats = ref({
    totalTraffic: 2547892734, // bytes
    activeConnections: 1247,
    alerts: 3,
    avgLatency: 24
})

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const onTenantChange = (tenantId) => {
    console.log('Selected tenant ID:', tenantId)

    // Trova il tenant selezionato e aggiorna lo stato
    const tenant = tenants.value.find(t => t.id === tenantId)
    if (tenant) {
        selectTenant(tenant)
        console.log('Tenant selected:', tenant)

        // Qui in futuro caricheremo i dati specifici del tenant
        // loadTenantData(tenant)
    }
}

// Carica i tenant quando l'utente è autenticato
const loadTenantsData = async () => {
    if (authStore.isAuthenticated) {
        try {
            await fetchTenants()
            console.log('Tenant caricati con successo')
        } catch (error) {
            console.error('Errore nel caricamento dei tenant:', error)
        }
    }
}

// Osserva i cambiamenti dello stato di autenticazione
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
    if (isAuthenticated) {
        await loadTenantsData()
    }
}, { immediate: true })

onMounted(async () => {
    // Se l'utente è già autenticato, carica i tenant
    if (authStore.isAuthenticated) {
        await loadTenantsData()
    }
})
</script>

<style scoped>
.v-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.tenant-select {
    font-size: 1.1rem;
}

.tenant-select :deep(.v-field) {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
}

.tenant-select :deep(.v-field--focused) {
    background-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.3);
}
</style>