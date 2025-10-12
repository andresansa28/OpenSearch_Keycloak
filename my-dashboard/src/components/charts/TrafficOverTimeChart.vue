<template>
    <div class="chart-container">
        <div class="chart-header mb-4">
            <div>
                <h3 class="text-h6">Device Traffic Over Time</h3>
                <p class="text-caption text-medium-emphasis">
                    Monitor network interactions per device in the selected deploy
                </p>
            </div>
            <v-btn-toggle v-model="viewMode" mandatory variant="outlined" size="small">
                <v-btn value="devices">By Device</v-btn>
                <v-btn value="total">Total</v-btn>
            </v-btn-toggle>
        </div>

        <div class="chart-wrapper">
            <v-chart :option="chartOption" :theme="'dark'" autoresize class="echarts-container" @click="onChartClick" />
        </div>

        <!-- Device Details Dialog -->
        <DeviceDetailsDialog :show="showDeviceDetails" :device-info="selectedDeviceInfo" :view-mode="viewMode"
            :clicked-time="clickedTime" :total-traffic-info="totalTrafficInfo" :all-actors="allActors"
            @close="showDeviceDetails = false" />
    </div>
</template>

<script setup>
import DeviceDetailsDialog from '@/components/dialogs/DeviceDetailsDialog.vue'
import { LineChart } from 'echarts/charts'
import {
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent
} from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'

use([
    CanvasRenderer,
    LineChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
])

const viewMode = ref('devices')
const showDeviceDetails = ref(false)
const selectedDeviceInfo = ref(null)
const clickedTime = ref('')

// Device data for the current deploy
const deviceList = [
    {
        id: 1,
        name: 'PLC-001',
        type: 'plc',
        color: '#4CAF50',
        currentTraffic: '156.2',
        status: 'Online',
        uptime: '72.4',
        connections: 8,
        actors: [
            { id: 1, name: 'Control-Unit-A', type: 'controller', ip: '192.168.1.15', role: 'Primary Controller', lastSeen: '2 min ago', status: 'active' },
            { id: 2, name: 'Sensor-Bank-1', type: 'sensor', ip: '192.168.1.16', role: 'Temperature Monitor', lastSeen: '1 min ago', status: 'active' },
            { id: 3, name: 'Actuator-Valve-1', type: 'actuator', ip: '192.168.1.17', role: 'Flow Control', lastSeen: '3 min ago', status: 'active' }
        ]
    },
    {
        id: 2,
        name: 'PLC-002',
        type: 'plc',
        color: '#2196F3',
        currentTraffic: '142.8',
        status: 'Online',
        uptime: '68.1',
        connections: 6,
        actors: [
            { id: 4, name: 'Control-Unit-B', type: 'controller', ip: '192.168.1.25', role: 'Secondary Controller', lastSeen: '1 min ago', status: 'active' },
            { id: 5, name: 'Pressure-Sensor-2', type: 'sensor', ip: '192.168.1.26', role: 'Pressure Monitor', lastSeen: '2 min ago', status: 'active' }
        ]
    },
    {
        id: 3,
        name: 'SCADA-Main',
        type: 'scada',
        color: '#FF9800',
        currentTraffic: '289.5',
        status: 'Online',
        uptime: '96.2',
        connections: 15,
        actors: [
            { id: 6, name: 'Data-Historian', type: 'database', ip: '192.168.1.35', role: 'Data Storage', lastSeen: '30 sec ago', status: 'active' },
            { id: 7, name: 'Alarm-Manager', type: 'service', ip: '192.168.1.36', role: 'Alert System', lastSeen: '1 min ago', status: 'active' },
            { id: 8, name: 'Report-Generator', type: 'service', ip: '192.168.1.37', role: 'Analytics', lastSeen: '5 min ago', status: 'active' },
            { id: 9, name: 'Network-Monitor', type: 'monitor', ip: '192.168.1.38', role: 'Network Health', lastSeen: '1 min ago', status: 'active' }
        ]
    },
    {
        id: 4,
        name: 'SCADA-Backup',
        type: 'scada',
        color: '#9C27B0',
        currentTraffic: '98.4',
        status: 'Standby',
        uptime: '94.8',
        connections: 4,
        actors: [
            { id: 10, name: 'Backup-Controller', type: 'controller', ip: '192.168.1.45', role: 'Failover System', lastSeen: '2 min ago', status: 'active' },
            { id: 11, name: 'Sync-Service', type: 'service', ip: '192.168.1.46', role: 'Data Synchronization', lastSeen: '1 min ago', status: 'active' }
        ]
    },
    {
        id: 5,
        name: 'HMI-Panel-01',
        type: 'hmi',
        color: '#F44336',
        currentTraffic: '67.9',
        status: 'Online',
        uptime: '71.6',
        connections: 3,
        actors: [
            { id: 12, name: 'Operator-Interface', type: 'interface', ip: '192.168.1.55', role: 'User Interface', lastSeen: '30 sec ago', status: 'active' },
            { id: 13, name: 'Touch-Controller', type: 'controller', ip: '192.168.1.56', role: 'Input Handler', lastSeen: '1 min ago', status: 'active' }
        ]
    }
]

// Total traffic information
const totalTrafficInfo = ref({
    totalTraffic: '754.8',
    activeDevices: 5,
    totalConnections: 36,
    alerts: 2
})

// All actors aggregated for total view
const allActors = ref([
    { id: 1, name: 'Control-Unit-A', device: 'PLC-001', type: 'controller', ip: '192.168.1.15', traffic: '45.2', status: 'active' },
    { id: 2, name: 'Sensor-Bank-1', device: 'PLC-001', type: 'sensor', ip: '192.168.1.16', traffic: '12.8', status: 'active' },
    { id: 3, name: 'Data-Historian', device: 'SCADA-Main', type: 'database', ip: '192.168.1.35', traffic: '189.4', status: 'active' },
    { id: 4, name: 'Alarm-Manager', device: 'SCADA-Main', type: 'service', ip: '192.168.1.36', traffic: '34.7', status: 'active' },
    { id: 5, name: 'Operator-Interface', device: 'HMI-Panel-01', type: 'interface', ip: '192.168.1.55', traffic: '28.9', status: 'active' },
    { id: 6, name: 'Backup-Controller', device: 'SCADA-Backup', type: 'controller', ip: '192.168.1.45', traffic: '56.1', status: 'active' },
    { id: 7, name: 'Pressure-Sensor-2', device: 'PLC-002', type: 'sensor', ip: '192.168.1.26', traffic: '18.3', status: 'active' },
    { id: 8, name: 'Network-Monitor', device: 'SCADA-Main', type: 'monitor', ip: '192.168.1.38', traffic: '41.2', status: 'active' }
])

// Chart click handler
const onChartClick = (params) => {
    console.log('Chart clicked:', params)

    if (viewMode.value === 'devices') {
        // Find the clicked device by series name
        const seriesName = params.seriesName
        const deviceName = seriesName.split(' (')[0] // Extract device name before the type
        const device = deviceList.find(d => d.name === deviceName)

        if (device) {
            selectedDeviceInfo.value = device
            clickedTime.value = params.name // The time point that was clicked
            showDeviceDetails.value = true
        }
    } else {
        // Total view - show aggregated information
        selectedDeviceInfo.value = null
        clickedTime.value = params.name
        showDeviceDetails.value = true
    }
}

// Generate time labels for 24 hours
const generateTimeLabels = () => {
    const labels = []
    for (let i = 0; i < 24; i++) {
        labels.push(`${i.toString().padStart(2, '0')}:00`)
    }
    return labels
}

// Generate traffic data for a specific device
const generateDeviceTrafficData = (deviceType) => {
    const baseData = []
    const multiplier = deviceType === 'scada' ? 1.5 : deviceType === 'plc' ? 1.2 : 0.8

    for (let i = 0; i < 24; i++) {
        // Simulate working hours (6-18) having more traffic
        const isWorkingHours = i >= 6 && i <= 18
        const base = isWorkingHours ?
            Math.floor(Math.random() * 400 + 200) * multiplier :
            Math.floor(Math.random() * 150 + 50) * multiplier
        baseData.push(Math.floor(base))
    }
    return baseData
}

const chartOption = computed(() => {
    const labels = generateTimeLabels()

    if (viewMode.value === 'devices') {
        // Show individual device lines
        const series = deviceList.map(device => ({
            name: `${device.name} (${device.type.toUpperCase()})`,
            type: 'line',
            data: generateDeviceTrafficData(device.type),
            lineStyle: {
                color: device.color,
                width: 2
            },
            itemStyle: {
                color: device.color
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: device.color + '40' },
                        { offset: 1, color: device.color + '10' }
                    ]
                }
            },
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            emphasis: {
                focus: 'series',
                itemStyle: {
                    borderWidth: 3,
                    borderColor: device.color,
                    shadowBlur: 10,
                    shadowColor: device.color
                }
            }
        }))

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                textStyle: {
                    color: '#ffffff'
                }
            },
            legend: {
                data: deviceList.map(device => `${device.name} (${device.type.toUpperCase()})`),
                textStyle: {
                    color: '#ffffff'
                },
                bottom: 10,
                left: 'center'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '5%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: labels,
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    }
                },
                axisLabel: {
                    color: '#ffffff'
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Network Interactions',
                nameLocation: 'middle',
                nameGap: 50,
                nameTextStyle: {
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold'
                },
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    }
                },
                axisLabel: {
                    color: '#ffffff'
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            series: series
        }
    } else {
        // Show total traffic
        const totalData = []
        for (let i = 0; i < 24; i++) {
            const total = deviceList.reduce((sum, device) => {
                return sum + generateDeviceTrafficData(device.type)[i]
            }, 0)
            totalData.push(total)
        }

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                textStyle: {
                    color: '#ffffff'
                }
            },
            legend: {
                data: ['Total Traffic (all devices)'],
                textStyle: {
                    color: '#ffffff'
                },
                bottom: 10,
                left: 'center'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '5%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: labels,
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    }
                },
                axisLabel: {
                    color: '#ffffff'
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Network Interactions',
                nameLocation: 'middle',
                nameGap: 50,
                nameTextStyle: {
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold'
                },
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    }
                },
                axisLabel: {
                    color: '#ffffff'
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            series: [{
                name: 'Total Traffic (all devices)',
                type: 'line',
                data: totalData,
                lineStyle: {
                    color: '#1976D2',
                    width: 3
                },
                itemStyle: {
                    color: '#1976D2'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(25, 118, 210, 0.3)' },
                            { offset: 1, color: 'rgba(25, 118, 210, 0.1)' }
                        ]
                    }
                },
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                emphasis: {
                    itemStyle: {
                        borderWidth: 4,
                        borderColor: '#1976D2',
                        shadowBlur: 15,
                        shadowColor: '#1976D2'
                    }
                }
            }]
        }
    }
})
</script>

<style scoped>
.chart-container {
    height: 100%;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.chart-wrapper {
    height: 280px;
    margin-bottom: 20px;
}

.echarts-container {
    width: 100%;
    height: 100%;
}
</style>