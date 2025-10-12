<template>
    <div class="chart-container">
        <div class="chart-header mb-4">
            <div>
                <h3 class="text-h6">Top Geographic Connections</h3>
                <p class="text-caption text-medium-emphasis">
                    Monitor connections by geographic region and protocol type
                </p>
                <p class="text-caption text-info">
                    <v-icon size="small" class="mr-1">mdi-information</v-icon>
                    Click on any country bar to view top 10 actors
                </p>
            </div>
            <v-btn-toggle v-model="selectedProtocol" mandatory variant="outlined" size="small">
                <v-btn value="all">All Protocols</v-btn>
                <v-btn value="modbus">Modbus</v-btn>
                <v-btn value="nmap">Nmap</v-btn>
                <v-btn value="http">HTTP</v-btn>
            </v-btn-toggle>
        </div>

        <!-- Chart -->
        <div class="chart-wrapper">
            <Bar :data="chartData" :options="chartOptions" />
        </div>

        <!-- Country Actors Dialog -->
        <CountryActorsDialog v-model="showActorsDialog" :selected-country="selectedCountryForDialog"
            :selected-protocol="selectedProtocol" @actor-blocked="handleActorBlocked" />

        <!-- Geographic Statistics -->
        <div class="geographic-stats mt-4">
            <v-row>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold">{{ stats.totalCountries }}</div>
                        <div class="text-caption">Countries</div>
                        <div class="text-caption text-medium-emphasis">Active regions</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold">{{ stats.totalConnections.toLocaleString() }}</div>
                        <div class="text-caption">Total Connections</div>
                        <div class="text-caption text-medium-emphasis">{{ selectedProtocol.toUpperCase() }}</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold text-warning">{{ stats.suspiciousRegions }}</div>
                        <div class="text-caption">Suspicious Regions</div>
                        <div class="text-caption text-medium-emphasis">High risk areas</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold text-success">{{ stats.blockedConnections.toLocaleString()
                        }}</div>
                        <div class="text-caption">Blocked</div>
                        <div class="text-caption text-medium-emphasis">Security actions</div>
                    </v-card>
                </v-col>
            </v-row>
        </div>

    </div>
</template>

<script setup>
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js'
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import CountryActorsDialog from '../dialogs/CountryActorsDialog.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const selectedProtocol = ref('all')
const showActorsDialog = ref(false)
const selectedCountryForDialog = ref(null)

// Dati geografici per protocollo
const geographicData = {
    all: {
        totalCountries: 28,
        totalConnections: 145680,
        suspiciousRegions: 5,
        blockedConnections: 2340,
        regions: [
            { country: 'United States', city: 'New York', flag: '🇺🇸', connections: 28450, successRate: 97.2, riskLevel: 'low' },
            { country: 'China', city: 'Shanghai', flag: '🇨🇳', connections: 22380, successRate: 94.8, riskLevel: 'medium' },
            { country: 'Germany', city: 'Frankfurt', flag: '🇩🇪', connections: 18920, successRate: 98.5, riskLevel: 'low' },
            { country: 'Russia', city: 'Moscow', flag: '🇷🇺', connections: 15640, successRate: 89.2, riskLevel: 'high' },
            { country: 'Japan', city: 'Tokyo', flag: '🇯🇵', connections: 12850, successRate: 99.1, riskLevel: 'low' },
            { country: 'United Kingdom', city: 'London', flag: '🇬🇧', connections: 11290, successRate: 96.8, riskLevel: 'low' },
            { country: 'France', city: 'Paris', flag: '🇫🇷', connections: 9840, successRate: 97.4, riskLevel: 'low' },
            { country: 'Brazil', city: 'São Paulo', flag: '🇧🇷', connections: 8650, successRate: 93.6, riskLevel: 'medium' },
            { country: 'India', city: 'Mumbai', flag: '🇮🇳', connections: 7920, successRate: 91.8, riskLevel: 'medium' },
            { country: 'South Korea', city: 'Seoul', flag: '🇰🇷', connections: 6480, successRate: 98.2, riskLevel: 'low' },
            { country: 'Canada', city: 'Toronto', flag: '🇨🇦', connections: 5680, successRate: 97.1, riskLevel: 'low' },
            { country: 'Australia', city: 'Sydney', flag: '🇦🇺', connections: 4890, successRate: 96.9, riskLevel: 'low' },
            { country: 'Netherlands', city: 'Amsterdam', flag: '🇳🇱', connections: 4120, successRate: 98.3, riskLevel: 'low' },
            { country: 'Italy', city: 'Milan', flag: '🇮🇹', connections: 3650, successRate: 97.2, riskLevel: 'low' },
            { country: 'Spain', city: 'Madrid', flag: '🇪🇸', connections: 3240, successRate: 96.8, riskLevel: 'low' }
        ]
    },
    modbus: {
        totalCountries: 15,
        totalConnections: 34820,
        suspiciousRegions: 3,
        blockedConnections: 580,
        regions: [
            { country: 'Germany', city: 'Frankfurt', flag: '🇩🇪', connections: 8940, successRate: 98.8, riskLevel: 'low' },
            { country: 'United States', city: 'Chicago', flag: '🇺🇸', connections: 6720, successRate: 97.5, riskLevel: 'low' },
            { country: 'Japan', city: 'Osaka', flag: '🇯🇵', connections: 4650, successRate: 99.2, riskLevel: 'low' },
            { country: 'China', city: 'Beijing', flag: '🇨🇳', connections: 3890, successRate: 94.1, riskLevel: 'medium' },
            { country: 'Italy', city: 'Milan', flag: '🇮🇹', connections: 2980, successRate: 96.8, riskLevel: 'low' },
            { country: 'Russia', city: 'St. Petersburg', flag: '🇷🇺', connections: 2450, successRate: 87.9, riskLevel: 'high' },
            { country: 'South Korea', city: 'Busan', flag: '🇰🇷', connections: 1890, successRate: 98.5, riskLevel: 'low' },
            { country: 'Canada', city: 'Toronto', flag: '🇨🇦', connections: 1650, successRate: 97.9, riskLevel: 'low' },
            { country: 'Netherlands', city: 'Amsterdam', flag: '🇳🇱', connections: 1320, successRate: 98.1, riskLevel: 'low' },
            { country: 'Sweden', city: 'Stockholm', flag: '🇸🇪', connections: 1100, successRate: 99.0, riskLevel: 'low' }
        ]
    },
    nmap: {
        totalCountries: 22,
        totalConnections: 89240,
        suspiciousRegions: 8,
        blockedConnections: 1890,
        regions: [
            { country: 'United States', city: 'Los Angeles', flag: '🇺🇸', connections: 18920, successRate: 96.2, riskLevel: 'low' },
            { country: 'China', city: 'Shenzhen', flag: '🇨🇳', connections: 15640, successRate: 92.8, riskLevel: 'high' },
            { country: 'Russia', city: 'Moscow', flag: '🇷🇺', connections: 12380, successRate: 85.4, riskLevel: 'high' },
            { country: 'Germany', city: 'Berlin', flag: '🇩🇪', connections: 8950, successRate: 98.1, riskLevel: 'low' },
            { country: 'United Kingdom', city: 'Manchester', flag: '🇬🇧', connections: 7820, successRate: 95.9, riskLevel: 'low' },
            { country: 'Iran', city: 'Tehran', flag: '🇮🇷', connections: 6450, successRate: 78.2, riskLevel: 'high' },
            { country: 'Brazil', city: 'Rio de Janeiro', flag: '🇧🇷', connections: 5680, successRate: 91.5, riskLevel: 'medium' },
            { country: 'India', city: 'Delhi', flag: '🇮🇳', connections: 4920, successRate: 89.8, riskLevel: 'medium' },
            { country: 'Turkey', city: 'Istanbul', flag: '🇹🇷', connections: 4120, successRate: 87.6, riskLevel: 'medium' },
            { country: 'North Korea', city: 'Pyongyang', flag: '🇰🇵', connections: 3850, successRate: 72.1, riskLevel: 'high' }
        ]
    },
    http: {
        totalCountries: 25,
        totalConnections: 21620,
        suspiciousRegions: 2,
        blockedConnections: 290,
        regions: [
            { country: 'United States', city: 'San Francisco', flag: '🇺🇸', connections: 4890, successRate: 98.5, riskLevel: 'low' },
            { country: 'Germany', city: 'Munich', flag: '🇩🇪', connections: 3420, successRate: 99.1, riskLevel: 'low' },
            { country: 'Japan', city: 'Tokyo', flag: '🇯🇵', connections: 2980, successRate: 99.3, riskLevel: 'low' },
            { country: 'United Kingdom', city: 'Edinburgh', flag: '🇬🇧', connections: 2650, successRate: 98.7, riskLevel: 'low' },
            { country: 'France', city: 'Lyon', flag: '🇫🇷', connections: 2340, successRate: 98.9, riskLevel: 'low' },
            { country: 'Canada', city: 'Vancouver', flag: '🇨🇦', connections: 1890, successRate: 98.2, riskLevel: 'low' },
            { country: 'Australia', city: 'Sydney', flag: '🇦🇺', connections: 1650, successRate: 97.8, riskLevel: 'low' },
            { country: 'Netherlands', city: 'Rotterdam', flag: '🇳🇱', connections: 1420, successRate: 98.6, riskLevel: 'low' },
            { country: 'Switzerland', city: 'Zurich', flag: '🇨🇭', connections: 1180, successRate: 99.2, riskLevel: 'low' },
            { country: 'Singapore', city: 'Singapore', flag: '🇸🇬', connections: 980, successRate: 98.9, riskLevel: 'low' }
        ]
    }
}

const stats = computed(() => {
    return geographicData[selectedProtocol.value]
})

const topRegions = computed(() => {
    return stats.value.regions.slice(0, 10)
})

const chartData = computed(() => {
    const regions = topRegions.value

    return {
        labels: regions.map(region => `${region.flag} ${region.country}`),
        datasets: [
            {
                label: 'Connections',
                data: regions.map(region => region.connections),
                backgroundColor: regions.map(region => {
                    switch (region.riskLevel) {
                        case 'high': return 'rgba(244, 67, 54, 0.8)'
                        case 'medium': return 'rgba(255, 152, 0, 0.8)'
                        case 'low': return 'rgba(76, 175, 80, 0.8)'
                        default: return 'rgba(63, 81, 181, 0.8)'
                    }
                }),
                borderColor: regions.map(region => {
                    switch (region.riskLevel) {
                        case 'high': return 'rgb(244, 67, 54)'
                        case 'medium': return 'rgb(255, 152, 0)'
                        case 'low': return 'rgb(76, 175, 80)'
                        default: return 'rgb(63, 81, 181)'
                    }
                }),
                borderWidth: 2
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Grafico a barre orizzontali
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            callbacks: {
                label: function (context) {
                    const region = topRegions.value[context.dataIndex]
                    return [
                        `Connections: ${context.parsed.x.toLocaleString()}`,
                        `Success Rate: ${region.successRate}%`,
                        `Risk Level: ${region.riskLevel}`,
                        `City: ${region.city}`
                    ]
                }
            }
        }
    },
    onClick: (event, elements) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index
            const clickedCountry = topRegions.value[elementIndex]
            selectedCountryForDialog.value = clickedCountry
            showActorsDialog.value = true
        }
    },
    scales: {
        x: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Number of Connections',
                color: '#ffffff'
            },
            ticks: {
                color: '#ffffff',
                callback: function (value) {
                    return value.toLocaleString()
                }
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            }
        },
        y: {
            title: {
                display: true,
                text: 'Geographic Regions',
                color: '#ffffff'
            },
            ticks: {
                color: '#ffffff'
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            }
        }
    }
}

// Funzioni per gestire gli eventi del dialog
const handleActorBlocked = ({ actor, blocked }) => {
    console.log(`Actor ${actor.name} ${blocked ? 'blocked' : 'unblocked'}`)
    // Qui puoi implementare la logica per bloccare/sbloccare l'attore
    // ad esempio chiamare un'API o aggiornare lo stato globale
}
</script>

<style scoped>
.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.chart-wrapper {
    height: 400px;
    margin-bottom: 20px;
    cursor: pointer;
}

.chart-wrapper:hover {
    opacity: 0.9;
    transition: opacity 0.2s ease;
}

.text-info {
    color: rgb(var(--v-theme-info));
}
</style>