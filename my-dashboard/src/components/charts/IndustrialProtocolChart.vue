<template>
    <div class="chart-container">
        <div class="chart-header mb-4">
            <div>
                <h3 class="text-h6">Industrial Protocol Activity</h3>
                <p class="text-caption text-medium-emphasis">
                    Monitor ICS/SCADA traffic: commands, device communications, and protocol errors
                </p>
            </div>
            <v-btn-toggle v-model="protocolType" mandatory variant="outlined" size="small">
                <v-btn value="modbus">Modbus</v-btn>
                <v-btn value="s7comm">S7Comm</v-btn>
            </v-btn-toggle>
        </div>

        <!-- Chart with increased height -->
        <div class="chart-wrapper">
            <Line :data="chartData" :options="chartOptions" />
        </div>

        <div class="protocol-stats mt-4">
            <v-row>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold">{{ stats.commands }}</div>
                        <div class="text-caption">Total Commands</div>
                        <div class="text-caption text-medium-emphasis">Sent to devices</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold">{{ stats.devices }}</div>
                        <div class="text-caption">Active Devices</div>
                        <div class="text-caption text-medium-emphasis">Connected PLCs/HMIs</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold text-error">{{ stats.errors }}</div>
                        <div class="text-caption">Protocol Errors</div>
                        <div class="text-caption text-medium-emphasis">Failed communications</div>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                    <v-card variant="tonal" class="pa-3 text-center">
                        <div class="text-h6 font-weight-bold text-success">{{ stats.successRate }}%</div>
                        <div class="text-caption">Success Rate</div>
                        <div class="text-caption text-medium-emphasis">Reliable connections</div>
                    </v-card>
                </v-col>
            </v-row>

        </div>
    </div>
</template>

<script setup>
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js'
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const protocolType = ref('modbus')

const modbusData = {
    commands: 1248,
    devices: 15,
    errors: 23,
    successRate: 98.2,
    deviceList: [
        { id: 1, name: 'PLC-001', type: 'plc', ip: '192.168.1.10', status: 'active', commands: 245 },
        { id: 2, name: 'PLC-002', type: 'plc', ip: '192.168.1.11', status: 'active', commands: 198 },
        { id: 3, name: 'HMI-Main', type: 'hmi', ip: '192.168.1.20', status: 'active', commands: 156 },
        { id: 4, name: 'SCADA-01', type: 'scada', ip: '192.168.1.30', status: 'active', commands: 312 },
        { id: 5, name: 'Gateway-01', type: 'gateway', ip: '192.168.1.40', status: 'inactive', commands: 45 }
    ],
    hourlyData: [
        { hour: '00:00', commands: 45, errors: 1 },
        { hour: '01:00', commands: 32, errors: 0 },
        { hour: '02:00', commands: 28, errors: 2 },
        { hour: '03:00', commands: 31, errors: 0 },
        { hour: '04:00', commands: 38, errors: 1 },
        { hour: '05:00', commands: 42, errors: 0 },
        { hour: '06:00', commands: 68, errors: 3 },
        { hour: '07:00', commands: 89, errors: 2 },
        { hour: '08:00', commands: 112, errors: 4 },
        { hour: '09:00', commands: 124, errors: 3 },
        { hour: '10:00', commands: 118, errors: 2 },
        { hour: '11:00', commands: 95, errors: 1 },
        { hour: '12:00', commands: 87, errors: 2 },
        { hour: '13:00', commands: 93, errors: 1 },
        { hour: '14:00', commands: 78, errors: 0 },
        { hour: '15:00', commands: 82, errors: 1 },
        { hour: '16:00', commands: 76, errors: 0 },
        { hour: '17:00', commands: 64, errors: 1 },
        { hour: '18:00', commands: 52, errors: 0 },
        { hour: '19:00', commands: 41, errors: 0 },
        { hour: '20:00', commands: 38, errors: 1 },
        { hour: '21:00', commands: 35, errors: 0 },
        { hour: '22:00', commands: 33, errors: 0 },
        { hour: '23:00', commands: 29, errors: 0 }
    ]
}

const s7commData = {
    commands: 892,
    devices: 8,
    errors: 15,
    successRate: 98.7,
    deviceList: [
        { id: 1, name: 'S7-PLC-01', type: 'plc', ip: '192.168.2.10', status: 'active', commands: 198 },
        { id: 2, name: 'S7-PLC-02', type: 'plc', ip: '192.168.2.11', status: 'active', commands: 165 },
        { id: 3, name: 'S7-HMI', type: 'hmi', ip: '192.168.2.20', status: 'active', commands: 123 },
        { id: 4, name: 'SIMATIC-01', type: 'scada', ip: '192.168.2.30', status: 'active', commands: 287 }
    ],
    hourlyData: [
        { hour: '00:00', commands: 28, errors: 0 },
        { hour: '01:00', commands: 22, errors: 0 },
        { hour: '02:00', commands: 18, errors: 1 },
        { hour: '03:00', commands: 21, errors: 0 },
        { hour: '04:00', commands: 26, errors: 0 },
        { hour: '05:00', commands: 31, errors: 1 },
        { hour: '06:00', commands: 48, errors: 2 },
        { hour: '07:00', commands: 62, errors: 1 },
        { hour: '08:00', commands: 78, errors: 2 },
        { hour: '09:00', commands: 85, errors: 2 },
        { hour: '10:00', commands: 82, errors: 1 },
        { hour: '11:00', commands: 74, errors: 1 },
        { hour: '12:00', commands: 68, errors: 1 },
        { hour: '13:00', commands: 71, errors: 0 },
        { hour: '14:00', commands: 65, errors: 1 },
        { hour: '15:00', commands: 59, errors: 0 },
        { hour: '16:00', commands: 54, errors: 1 },
        { hour: '17:00', commands: 48, errors: 0 },
        { hour: '18:00', commands: 42, errors: 0 },
        { hour: '19:00', commands: 36, errors: 0 },
        { hour: '20:00', commands: 32, errors: 1 },
        { hour: '21:00', commands: 29, errors: 0 },
        { hour: '22:00', commands: 26, errors: 0 },
        { hour: '23:00', commands: 23, errors: 0 }
    ]
}

const stats = computed(() => {
    return protocolType.value === 'modbus' ? modbusData : s7commData
})

const chartData = computed(() => {
    const data = stats.value.hourlyData

    return {
        labels: data.map(item => item.hour),
        datasets: [
            {
                label: 'Commands',
                data: data.map(item => item.commands),
                borderColor: 'rgb(63, 81, 181)',
                backgroundColor: 'rgba(63, 81, 181, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            },
            {
                label: 'Errors',
                data: data.map(item => item.errors),
                borderColor: 'rgb(244, 67, 54)',
                backgroundColor: 'rgba(244, 67, 54, 0.3)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                color: '#ffffff'
            }
        },
        tooltip: {
            mode: 'index',
            intersect: false,
        }
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: 'Time (24h)',
                color: '#ffffff'
            },
            ticks: {
                color: '#ffffff'
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            }
        },
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'Commands',
                color: '#ffffff'
            },
            ticks: {
                color: '#ffffff'
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Errors',
                color: '#ffffff'
            },
            ticks: {
                color: '#ffffff'
            },
            grid: {
                drawOnChartArea: false,
            }
        }
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
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
</script>

<style scoped>
.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.chart-wrapper {
    height: 280px;
    margin-bottom: 20px;
}
</style>