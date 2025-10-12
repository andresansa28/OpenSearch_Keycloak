<template>
    <div class="chart-container">
        <h3 class="text-h6 mb-4">Protocol Distribution</h3>
        <div class="chart-wrapper">
            <v-chart :option="chartOption" :theme="'dark'" autoresize class="echarts-container" @click="onChartClick" />
        </div>
        <div class="protocol-stats mt-4">
            <v-row>
                <v-col v-for="(item, index) in protocolStats" :key="index" cols="6" sm="4">
                    <div class="d-flex align-center">
                        <div class="protocol-dot mr-2" :style="{ backgroundColor: item.color }"></div>
                        <div>
                            <div class="text-caption">{{ item.protocol }}</div>
                            <div class="text-body-2 font-weight-bold">{{ item.percentage }}%</div>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </div>
    </div>
</template>

<script setup>
import { PieChart } from 'echarts/charts'
import {
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
    PieChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent
])

const protocolData = ref([
    { protocol: 'HTTP', value: 45, color: '#4CAF50' },
    { protocol: 'HTTPS/SSL', value: 25, color: '#9C27B0' },
    { protocol: 'DNS', value: 12, color: '#FFC107' },
    { protocol: 'Modbus', value: 8, color: '#FF5722' },
    { protocol: 'TCP', value: 6, color: '#2196F3' },
    { protocol: 'UDP', value: 4, color: '#E91E63' }
])

const onChartClick = (params) => {
    console.log('Protocol clicked:', params)
    // Preparato per future implementazioni di dialog
}

const chartOption = computed(() => {
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            textStyle: {
                color: '#ffffff'
            },
            formatter: '{a} <br/>{b}: {c}% ({d}%)'
        },
        series: [{
            name: 'Protocol Distribution',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: protocolData.value.map(item => ({
                name: item.protocol,
                value: item.value,
                itemStyle: {
                    color: item.color,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }
            })),
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 4
                },
                scaleSize: 5
            },
            label: {
                show: true,
                position: 'outside',
                color: '#ffffff',
                fontSize: 12,
                formatter: '{b}\n{d}%'
            },
            labelLine: {
                show: true,
                lineStyle: {
                    color: '#ffffff'
                }
            },
            animationType: 'scale',
            animationEasing: 'elasticOut'
        }]
    }
})

const protocolStats = computed(() =>
    protocolData.value.map(item => ({
        ...item,
        percentage: item.value
    }))
)
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

.protocol-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.protocol-stats {
    max-height: 120px;
    overflow-y: auto;
}
</style>