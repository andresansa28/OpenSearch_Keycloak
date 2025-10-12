<template>
    <div class="chart-container">
        <h3 class="text-h6 mb-4">Network Anomalies (Zeek Weird Log)</h3>
        <div class="chart-wrapper">
            <v-chart :option="chartOption" :theme="'dark'" autoresize class="echarts-container" @click="onChartClick" />
        </div>
        <div class="anomaly-summary mt-4">
            <v-alert v-if="totalAnomalies > 50" type="warning" variant="tonal" density="compact">
                High anomaly count detected: {{ totalAnomalies }} issues
            </v-alert>
            <v-alert v-else-if="totalAnomalies > 20" type="info" variant="tonal" density="compact">
                Moderate anomaly activity: {{ totalAnomalies }} issues
            </v-alert>
            <v-alert v-else type="success" variant="tonal" density="compact">
                Low anomaly activity: {{ totalAnomalies }} issues
            </v-alert>
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

const anomalies = ref([
    { type: 'truncated_header', count: 23, severity: 'medium' },
    { type: 'bad_TCP_checksum', count: 18, severity: 'low' },
    { type: 'connection_state_mismatch', count: 15, severity: 'high' },
    { type: 'excessive_data_without_connection', count: 12, severity: 'high' },
    { type: 'SYN_seq_jump', count: 9, severity: 'medium' },
    { type: 'above_hole_data_without_any_acks', count: 7, severity: 'low' },
    { type: 'possible_split_routing', count: 6, severity: 'medium' },
    { type: 'data_before_established', count: 4, severity: 'high' },
    { type: 'FIN_storm', count: 3, severity: 'high' },
    { type: 'RST_storm', count: 2, severity: 'high' }
])

const totalAnomalies = computed(() =>
    anomalies.value.reduce((sum, item) => sum + item.count, 0)
)

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'high': return '#F44336'
        case 'medium': return '#FF9800'
        case 'low': return '#FFC107'
        default: return '#607D8B'
    }
}

const onChartClick = (params) => {
    console.log('Anomaly clicked:', params)
    // Preparato per future implementazioni di dialog
}

const chartOption = computed(() => {
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
                const data = params[0]
                const anomaly = anomalies.value[data.dataIndex]
                return `
                    <div style="text-align: left;">
                        <strong>${anomaly.type}</strong><br/>
                        Count: ${anomaly.count}<br/>
                        Severity: <span style="color: ${getSeverityColor(anomaly.severity)}">${anomaly.severity.toUpperCase()}</span>
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
            data: anomalies.value.map(item => item.type.replace(/_/g, ' ')),
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
            name: 'Count',
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
            name: 'Anomalies',
            type: 'bar',
            data: anomalies.value.map(item => ({
                value: item.count,
                itemStyle: {
                    color: getSeverityColor(item.severity),
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
            animationDelay: (idx) => idx * 100
        }]
    }
})
</script>

<style scoped>
.chart-container {
    height: 100%;
}

.chart-wrapper {
    height: 300px;
    margin-bottom: 20px;
}

.echarts-container {
    width: 100%;
    height: 100%;
}

.anomaly-summary {
    margin-top: 16px;
}
</style>