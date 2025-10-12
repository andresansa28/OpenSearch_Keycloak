<template>
    <div class="chart-container">
        <div class="chart-header mb-4">
            <h3 class="text-h6">Top Source IPs</h3>
            <v-btn-toggle v-model="viewType" mandatory variant="outlined" size="small">
                <v-btn value="source">Source</v-btn>
                <v-btn value="destination">Destination</v-btn>
            </v-btn-toggle>
        </div>
        <div class="chart-wrapper">
            <v-chart :option="chartOption" :theme="'dark'" autoresize class="echarts-container" @click="onChartClick" />
        </div>
    </div>
</template>

<script setup>
import { BarChart } from 'echarts/charts'
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
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
])

const viewType = ref('source')

const sourceIPs = [
    { ip: '192.168.1.100', connections: 1250, suspicious: false },
    { ip: '10.0.0.15', connections: 980, suspicious: true },
    { ip: '192.168.1.50', connections: 756, suspicious: false },
    { ip: '172.16.0.25', connections: 643, suspicious: true },
    { ip: '192.168.1.200', connections: 521, suspicious: false },
    { ip: '10.0.0.88', connections: 445, suspicious: false },
    { ip: '192.168.1.75', connections: 389, suspicious: false },
    { ip: '172.16.0.100', connections: 321, suspicious: true },
    { ip: '192.168.1.150', connections: 287, suspicious: false },
    { ip: '10.0.0.200', connections: 234, suspicious: false }
]

const destinationIPs = [
    { ip: '192.168.1.1', connections: 2100, suspicious: false },
    { ip: '8.8.8.8', connections: 1580, suspicious: false },
    { ip: '192.168.1.10', connections: 1200, suspicious: false },
    { ip: '1.1.1.1', connections: 890, suspicious: false },
    { ip: '192.168.1.254', connections: 756, suspicious: false },
    { ip: '208.67.222.222', connections: 643, suspicious: false },
    { ip: '192.168.1.5', connections: 521, suspicious: false },
    { ip: '74.125.224.72', connections: 445, suspicious: false },
    { ip: '192.168.1.20', connections: 389, suspicious: false },
    { ip: '157.240.221.35', connections: 321, suspicious: false }
]

const onChartClick = (params) => {
    console.log('IP clicked:', params)
    // Preparato per future implementazioni di dialog
}

const chartOption = computed(() => {
    const data = viewType.value === 'source' ? sourceIPs : destinationIPs

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            textStyle: {
                color: '#ffffff'
            },
            formatter: (params) => {
                const item = params[0]
                const ipData = data[item.dataIndex]
                return `
                    <div style="text-align: left;">
                        <strong>${ipData.ip}</strong><br/>
                        Connections: ${ipData.connections}<br/>
                        Status: <span style="color: ${ipData.suspicious ? '#F44336' : '#4CAF50'}">${ipData.suspicious ? 'Suspicious' : 'Normal'}</span>
                    </div>
                `
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.ip),
            axisLabel: {
                color: '#ffffff',
                rotate: 45,
                fontSize: 10
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'Connections',
            nameLocation: 'middle',
            nameGap: 40,
            nameTextStyle: {
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 'bold'
            },
            axisLabel: {
                color: '#ffffff'
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        series: [{
            name: 'Connections',
            type: 'bar',
            data: data.map(item => ({
                value: item.connections,
                itemStyle: {
                    color: item.suspicious ? '#F44336' : '#4CAF50',
                    borderRadius: [4, 4, 0, 0]
                }
            })),
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                    shadowColor: 'rgba(255, 255, 255, 0.5)'
                }
            },
            animationDelay: (idx) => idx * 50
        }]
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
    align-items: center;
}

.chart-wrapper {
    height: 300px;
    margin-bottom: 20px;
}

.echarts-container {
    width: 100%;
    height: 100%;
}
</style>