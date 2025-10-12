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
                    <v-select v-model="selectedTenant" :items="tenants" item-title="name" item-value="id"
                        label="Choose a tenant to analyze" prepend-icon="mdi-database" variant="outlined"
                        density="comfortable" @update:model-value="onTenantChange" class="tenant-select"></v-select>
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
import { onMounted, ref } from 'vue'

const selectedTenant = ref(null)
const tenants = ref([
    { id: 'tenanto', name: 'Select a tenant...' },
    { id: 'tenant1', name: 'Production' },
    { id: 'tenant2', name: 'Staging' },
    { id: 'tenant3', name: 'Development' },
    { id: 'tenant4', name: 'Testing' }
])

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
    console.log('Selected tenant:', tenantId)
    // Qui in futuro caricheremo i dati del tenant selezionato
}

onMounted(() => {
    // Imposta il primo tenant come default
    if (tenants.value.length > 0) {
        selectedTenant.value = tenants.value[0].id
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