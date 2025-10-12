<template>
    <v-dialog v-model="dialog" max-width="900px" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center pa-4">
                <div class="d-flex align-center">
                    <span class="text-h5 mr-3">{{ selectedCountry?.flag }}</span>
                    <div>
                        <div class="text-h6">Top Actors in {{ selectedCountry?.country }}</div>
                        <div class="text-caption text-medium-emphasis">
                            {{ selectedCountry?.city }} • {{ selectedProtocol.toUpperCase() }} Protocol
                        </div>
                    </div>
                </div>
                <v-spacer></v-spacer>
                <v-btn icon variant="text" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <!-- Country Overview Stats -->
            <v-card-text class="pa-4">
                <v-row class="mb-4">
                    <v-col cols="12" sm="3">
                        <v-card variant="tonal" color="primary" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ selectedCountry?.connections?.toLocaleString() }}
                            </div>
                            <div class="text-caption">Total Connections</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-card variant="tonal" color="success" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ selectedCountry?.successRate }}%</div>
                            <div class="text-caption">Success Rate</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-card variant="tonal" :color="getRiskColor(selectedCountry?.riskLevel)"
                            class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ selectedCountry?.riskLevel?.toUpperCase() }}</div>
                            <div class="text-caption">Risk Level</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-card variant="tonal" color="info" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ countryActors.length }}</div>
                            <div class="text-caption">Active Actors</div>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Top Actors Table -->
                <div class="mb-3">
                    <h3 class="text-h6 mb-3">Top 10 Actors</h3>
                </div>

                <v-data-table :headers="actorHeaders" :items="countryActors" :items-per-page="10" class="elevation-1"
                    item-value="id">
                    <!-- Actor Name with Icon -->
                    <template v-slot:item.name="{ item }">
                        <div class="d-flex align-center">
                            <v-avatar size="32" class="mr-3" :color="getActorTypeColor(item.type)">
                                <v-icon :icon="getActorTypeIcon(item.type)" color="white" size="18"></v-icon>
                            </v-avatar>
                            <div>
                                <div class="font-weight-medium">{{ item.name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.type }}</div>
                            </div>
                        </div>
                    </template>

                    <!-- IP Address -->
                    <template v-slot:item.ipAddress="{ item }">
                        <v-chip size="small" variant="outlined" class="font-mono">
                            {{ item.ipAddress }}
                        </v-chip>
                    </template>

                    <!-- Connections -->
                    <template v-slot:item.connections="{ item }">
                        <div class="text-right">
                            <div class="font-weight-medium">{{ item.connections.toLocaleString() }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ ((item.connections / selectedCountry?.connections) * 100).toFixed(1) }}%
                            </div>
                        </div>
                    </template>

                    <!-- Success Rate -->
                    <template v-slot:item.successRate="{ item }">
                        <div class="d-flex align-center">
                            <v-progress-linear :model-value="item.successRate"
                                :color="getSuccessRateColor(item.successRate)" height="6" class="mr-2"
                                style="min-width: 60px;"></v-progress-linear>
                            <span class="text-caption">{{ item.successRate }}%</span>
                        </div>
                    </template>

                    <!-- Threat Level -->
                    <template v-slot:item.threatLevel="{ item }">
                        <v-chip :color="getThreatLevelColor(item.threatLevel)" size="small" variant="flat">
                            {{ item.threatLevel }}
                        </v-chip>
                    </template>

                    <!-- Last Activity -->
                    <template v-slot:item.lastActivity="{ item }">
                        <div class="text-caption">
                            {{ formatTimeAgo(item.lastActivity) }}
                        </div>
                    </template>

                    <!-- Actions -->
                    <template v-slot:item.actions="{ item }">
                        <v-btn-group variant="text" size="small">
                            <v-btn icon size="small" @click="viewActorDetails(item)">
                                <v-icon>mdi-eye</v-icon>
                                <v-tooltip activator="parent">View Details</v-tooltip>
                            </v-btn>
                        </v-btn-group>
                    </template>
                </v-data-table>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="closeDialog">
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Actor Timeline Dialog -->
        <ActorTimelineDialog v-model="showActorTimeline" :selected-actor="selectedActorForTimeline" />
    </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import ActorTimelineDialog from './ActorTimelineDialog.vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    selectedCountry: {
        type: Object,
        default: null
    },
    selectedProtocol: {
        type: String,
        default: 'all'
    }
})

const emit = defineEmits(['update:modelValue', 'actor-details', 'actor-blocked'])

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Variables for Actor Timeline Dialog
const showActorTimeline = ref(false)
const selectedActorForTimeline = ref(null)

// Headers per la tabella degli attori
const actorHeaders = [
    { title: 'Actor', key: 'name', width: '200px', sortable: false },
    { title: 'IP Address', key: 'ipAddress', width: '140px' },
    { title: 'Connections', key: 'connections', width: '120px', align: 'end' },
    { title: 'Success Rate', key: 'successRate', width: '150px' },
    { title: 'Threat Level', key: 'threatLevel', width: '120px' },
    { title: 'Last Activity', key: 'lastActivity', width: '120px' },
    { title: 'Actions', key: 'actions', width: '100px', sortable: false }
]

// Dati degli attori per paese - simulati ma realistici
const actorsData = {
    'United States': [
        { id: 1, name: 'Corporate-NYC-01', type: 'Corporate', ipAddress: '192.168.1.45', connections: 8450, successRate: 98.2, threatLevel: 'low', lastActivity: '2 minutes ago', blocked: false },
        { id: 2, name: 'Industrial-OH-03', type: 'Industrial', ipAddress: '10.0.15.78', connections: 6720, successRate: 97.8, threatLevel: 'low', lastActivity: '5 minutes ago', blocked: false },
        { id: 3, name: 'Research-CA-12', type: 'Research', ipAddress: '172.16.88.23', connections: 4890, successRate: 99.1, threatLevel: 'low', lastActivity: '1 hour ago', blocked: false },
        { id: 4, name: 'Gov-DC-07', type: 'Government', ipAddress: '198.51.100.42', connections: 3560, successRate: 99.5, threatLevel: 'low', lastActivity: '30 minutes ago', blocked: false },
        { id: 5, name: 'Unknown-FL-99', type: 'Unknown', ipAddress: '203.0.113.67', connections: 2340, successRate: 85.4, threatLevel: 'medium', lastActivity: '15 minutes ago', blocked: false },
        { id: 6, name: 'Energy-TX-08', type: 'Energy', ipAddress: '192.0.2.156', connections: 1890, successRate: 96.7, threatLevel: 'low', lastActivity: '3 hours ago', blocked: false },
        { id: 7, name: 'Telecom-WA-04', type: 'Telecom', ipAddress: '198.51.100.89', connections: 1650, successRate: 94.3, threatLevel: 'low', lastActivity: '1 day ago', blocked: false },
        { id: 8, name: 'Financial-NY-15', type: 'Financial', ipAddress: '203.0.113.234', connections: 1420, successRate: 98.9, threatLevel: 'low', lastActivity: '4 hours ago', blocked: false },
        { id: 9, name: 'Healthcare-MA-02', type: 'Healthcare', ipAddress: '192.168.100.78', connections: 980, successRate: 97.2, threatLevel: 'low', lastActivity: '2 days ago', blocked: false },
        { id: 10, name: 'Anomalous-XX-01', type: 'Anomalous', ipAddress: '192.0.2.999', connections: 760, successRate: 45.2, threatLevel: 'high', lastActivity: '10 minutes ago', blocked: true }
    ],
    'China': [
        { id: 11, name: 'State-BJ-001', type: 'Government', ipAddress: '218.85.157.45', connections: 9850, successRate: 92.1, threatLevel: 'medium', lastActivity: '1 minute ago', blocked: false },
        { id: 12, name: 'Telecom-SH-078', type: 'Telecom', ipAddress: '202.108.22.67', connections: 7420, successRate: 94.8, threatLevel: 'medium', lastActivity: '3 minutes ago', blocked: false },
        { id: 13, name: 'Industrial-GZ-12', type: 'Industrial', ipAddress: '61.135.169.23', connections: 4560, successRate: 89.7, threatLevel: 'medium', lastActivity: '15 minutes ago', blocked: false },
        { id: 14, name: 'Research-SZ-45', type: 'Research', ipAddress: '183.60.83.19', connections: 3890, successRate: 91.3, threatLevel: 'low', lastActivity: '1 hour ago', blocked: false },
        { id: 15, name: 'Unknown-XX-789', type: 'Unknown', ipAddress: '115.239.211.89', connections: 2780, successRate: 76.4, threatLevel: 'high', lastActivity: '5 minutes ago', blocked: false },
        { id: 16, name: 'Energy-TJ-03', type: 'Energy', ipAddress: '222.73.196.45', connections: 2340, successRate: 88.9, threatLevel: 'medium', lastActivity: '2 hours ago', blocked: false },
        { id: 17, name: 'Financial-HK-08', type: 'Financial', ipAddress: '202.67.45.123', connections: 1890, successRate: 95.6, threatLevel: 'low', lastActivity: '4 hours ago', blocked: false },
        { id: 18, name: 'Manufacturing-DG-15', type: 'Industrial', ipAddress: '119.75.217.88', connections: 1650, successRate: 87.2, threatLevel: 'medium', lastActivity: '6 hours ago', blocked: false },
        { id: 19, name: 'Logistics-CD-22', type: 'Logistics', ipAddress: '124.232.132.67', connections: 1120, successRate: 93.4, threatLevel: 'low', lastActivity: '1 day ago', blocked: false },
        { id: 20, name: 'Suspicious-XX-999', type: 'Anomalous', ipAddress: '58.240.127.34', connections: 890, successRate: 34.7, threatLevel: 'high', lastActivity: '30 minutes ago', blocked: true }
    ],
    'Germany': [
        { id: 21, name: 'Automotive-FF-01', type: 'Industrial', ipAddress: '85.214.132.45', connections: 7890, successRate: 99.2, threatLevel: 'low', lastActivity: '5 minutes ago', blocked: false },
        { id: 22, name: 'Research-MU-15', type: 'Research', ipAddress: '217.160.0.78', connections: 6520, successRate: 98.8, threatLevel: 'low', lastActivity: '10 minutes ago', blocked: false },
        { id: 23, name: 'Energy-HH-08', type: 'Energy', ipAddress: '62.75.137.23', connections: 4780, successRate: 97.9, threatLevel: 'low', lastActivity: '1 hour ago', blocked: false },
        { id: 24, name: 'Financial-FR-03', type: 'Financial', ipAddress: '195.71.11.156', connections: 3450, successRate: 99.1, threatLevel: 'low', lastActivity: '2 hours ago', blocked: false },
        { id: 25, name: 'Telecom-BE-12', type: 'Telecom', ipAddress: '80.67.169.89', connections: 2890, successRate: 98.5, threatLevel: 'low', lastActivity: '3 hours ago', blocked: false },
        { id: 26, name: 'Manufacturing-ST-07', type: 'Industrial', ipAddress: '84.19.178.67', connections: 2340, successRate: 97.3, threatLevel: 'low', lastActivity: '4 hours ago', blocked: false },
        { id: 27, name: 'Healthcare-KO-04', type: 'Healthcare', ipAddress: '91.250.85.34', connections: 1890, successRate: 98.7, threatLevel: 'low', lastActivity: '5 hours ago', blocked: false },
        { id: 28, name: 'Logistics-DU-09', type: 'Logistics', ipAddress: '188.174.22.123', connections: 1650, successRate: 96.8, threatLevel: 'low', lastActivity: '6 hours ago', blocked: false },
        { id: 29, name: 'Gov-BE-001', type: 'Government', ipAddress: '193.174.76.45', connections: 1420, successRate: 99.3, threatLevel: 'low', lastActivity: '1 day ago', blocked: false },
        { id: 30, name: 'Corporate-MU-25', type: 'Corporate', ipAddress: '217.6.2.78', connections: 980, successRate: 98.1, threatLevel: 'low', lastActivity: '2 days ago', blocked: false }
    ],
    'Russia': [
        { id: 31, name: 'State-MSK-001', type: 'Government', ipAddress: '85.21.78.45', connections: 6780, successRate: 87.4, threatLevel: 'high', lastActivity: '2 minutes ago', blocked: false },
        { id: 32, name: 'Energy-SPB-08', type: 'Energy', ipAddress: '178.154.131.67', connections: 4520, successRate: 91.2, threatLevel: 'medium', lastActivity: '5 minutes ago', blocked: false },
        { id: 33, name: 'Unknown-XX-456', type: 'Unknown', ipAddress: '95.173.136.89', connections: 3890, successRate: 72.8, threatLevel: 'high', lastActivity: '1 minute ago', blocked: false },
        { id: 34, name: 'Telecom-EKB-12', type: 'Telecom', ipAddress: '46.17.46.123', connections: 2780, successRate: 89.6, threatLevel: 'medium', lastActivity: '15 minutes ago', blocked: false },
        { id: 35, name: 'Military-XX-999', type: 'Military', ipAddress: '5.188.206.34', connections: 2340, successRate: 78.3, threatLevel: 'high', lastActivity: '3 minutes ago', blocked: true },
        { id: 36, name: 'Industrial-NSK-03', type: 'Industrial', ipAddress: '109.195.23.78', connections: 1890, successRate: 85.7, threatLevel: 'medium', lastActivity: '1 hour ago', blocked: false },
        { id: 37, name: 'Research-MSK-25', type: 'Research', ipAddress: '217.69.139.45', connections: 1650, successRate: 93.4, threatLevel: 'low', lastActivity: '2 hours ago', blocked: false },
        { id: 38, name: 'Financial-MSK-17', type: 'Financial', ipAddress: '91.200.14.156', connections: 1420, successRate: 88.9, threatLevel: 'medium', lastActivity: '4 hours ago', blocked: false },
        { id: 39, name: 'Cyber-XX-777', type: 'Anomalous', ipAddress: '188.120.246.67', connections: 980, successRate: 45.6, threatLevel: 'high', lastActivity: '10 minutes ago', blocked: true },
        { id: 40, name: 'Corporate-KRD-08', type: 'Corporate', ipAddress: '176.59.108.23', connections: 760, successRate: 92.1, threatLevel: 'low', lastActivity: '1 day ago', blocked: false }
    ],
    'Japan': [
        { id: 41, name: 'Industrial-TKY-01', type: 'Industrial', ipAddress: '202.32.115.45', connections: 5890, successRate: 99.4, threatLevel: 'low', lastActivity: '3 minutes ago', blocked: false },
        { id: 42, name: 'Research-OSK-15', type: 'Research', ipAddress: '133.137.4.67', connections: 4520, successRate: 99.1, threatLevel: 'low', lastActivity: '10 minutes ago', blocked: false },
        { id: 43, name: 'Automotive-NGY-08', type: 'Industrial', ipAddress: '210.165.9.123', connections: 3780, successRate: 98.9, threatLevel: 'low', lastActivity: '15 minutes ago', blocked: false },
        { id: 44, name: 'Telecom-TKY-03', type: 'Telecom', ipAddress: '61.211.241.89', connections: 2890, successRate: 99.2, threatLevel: 'low', lastActivity: '30 minutes ago', blocked: false },
        { id: 45, name: 'Financial-TKY-12', type: 'Financial', ipAddress: '153.126.169.34', connections: 2340, successRate: 99.5, threatLevel: 'low', lastActivity: '1 hour ago', blocked: false },
        { id: 46, name: 'Energy-FKS-07', type: 'Energy', ipAddress: '219.94.164.78', connections: 1890, successRate: 98.7, threatLevel: 'low', lastActivity: '2 hours ago', blocked: false },
        { id: 47, name: 'Healthcare-KYO-04', type: 'Healthcare', ipAddress: '160.16.82.156', connections: 1650, successRate: 99.0, threatLevel: 'low', lastActivity: '3 hours ago', blocked: false },
        { id: 48, name: 'Gov-TKY-001', type: 'Government', ipAddress: '203.165.7.45', connections: 1420, successRate: 99.6, threatLevel: 'low', lastActivity: '4 hours ago', blocked: false },
        { id: 49, name: 'Tech-TKY-88', type: 'Corporate', ipAddress: '126.2.14.67', connections: 980, successRate: 98.8, threatLevel: 'low', lastActivity: '6 hours ago', blocked: false },
        { id: 50, name: 'Logistics-YOK-09', type: 'Logistics', ipAddress: '202.13.9.123', connections: 760, successRate: 97.9, threatLevel: 'low', lastActivity: '1 day ago', blocked: false }
    ]
}

// Genera attori per altri paesi se non esistono
const generateActorsForCountry = (countryName) => {
    if (actorsData[countryName]) {
        return actorsData[countryName]
    }

    // Genera attori generici per paesi non definiti
    const actorTypes = ['Corporate', 'Industrial', 'Research', 'Government', 'Energy', 'Telecom', 'Financial', 'Healthcare', 'Logistics', 'Unknown']
    const threatLevels = ['low', 'medium', 'high']

    return Array.from({ length: 10 }, (_, index) => ({
        id: Date.now() + index,
        name: `Actor-${countryName.substring(0, 3).toUpperCase()}-${(index + 1).toString().padStart(2, '0')}`,
        type: actorTypes[index % actorTypes.length],
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        connections: Math.floor(Math.random() * 8000) + 500,
        successRate: Math.floor(Math.random() * 40) + 60,
        threatLevel: threatLevels[Math.floor(Math.random() * threatLevels.length)],
        lastActivity: ['1 minute ago', '5 minutes ago', '1 hour ago', '2 hours ago', '1 day ago'][Math.floor(Math.random() * 5)],
        blocked: Math.random() < 0.1
    }))
}

const countryActors = computed(() => {
    if (!props.selectedCountry?.country) return []
    return generateActorsForCountry(props.selectedCountry.country)
})

// Utility functions
const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
        case 'high': return 'error'
        case 'medium': return 'warning'
        case 'low': return 'success'
        default: return 'primary'
    }
}

const getActorTypeColor = (type) => {
    const colors = {
        'Corporate': 'blue',
        'Industrial': 'orange',
        'Research': 'green',
        'Government': 'purple',
        'Energy': 'yellow',
        'Telecom': 'cyan',
        'Financial': 'teal',
        'Healthcare': 'pink',
        'Logistics': 'brown',
        'Military': 'red',
        'Unknown': 'grey',
        'Anomalous': 'deep-orange'
    }
    return colors[type] || 'grey'
}

const getActorTypeIcon = (type) => {
    const icons = {
        'Corporate': 'mdi-office-building',
        'Industrial': 'mdi-factory',
        'Research': 'mdi-flask',
        'Government': 'mdi-bank',
        'Energy': 'mdi-lightning-bolt',
        'Telecom': 'mdi-cellphone-wireless',
        'Financial': 'mdi-currency-usd',
        'Healthcare': 'mdi-hospital-box',
        'Logistics': 'mdi-truck',
        'Military': 'mdi-shield',
        'Unknown': 'mdi-help',
        'Anomalous': 'mdi-alert'
    }
    return icons[type] || 'mdi-help'
}

const getSuccessRateColor = (rate) => {
    if (rate >= 95) return 'success'
    if (rate >= 85) return 'warning'
    return 'error'
}

const getThreatLevelColor = (level) => {
    switch (level) {
        case 'high': return 'error'
        case 'medium': return 'warning'
        case 'low': return 'success'
        default: return 'primary'
    }
}

const formatTimeAgo = (timeString) => {
    return timeString
}

// Actions
const closeDialog = () => {
    dialog.value = false
}

const viewActorDetails = (actor) => {
    selectedActorForTimeline.value = actor
    showActorTimeline.value = true
}

const toggleActorBlock = (actor) => {
    actor.blocked = !actor.blocked
    emit('actor-blocked', { actor, blocked: actor.blocked })
}

const exportActorData = () => {
    const data = countryActors.value
    const csv = [
        'Name,Type,IP Address,Connections,Success Rate,Threat Level,Last Activity,Blocked',
        ...data.map(actor =>
            `"${actor.name}","${actor.type}","${actor.ipAddress}",${actor.connections},${actor.successRate},"${actor.threatLevel}","${actor.lastActivity}",${actor.blocked}`
        )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.selectedCountry?.country}_actors_${props.selectedProtocol}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
}
</script>

<style scoped>
.font-mono {
    font-family: 'Roboto Mono', monospace;
}

.v-data-table {
    background: transparent;
}

:deep(.v-data-table-header) {
    background-color: rgba(var(--v-theme-surface-variant), 0.4);
}

:deep(.v-data-table__td) {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}
</style>