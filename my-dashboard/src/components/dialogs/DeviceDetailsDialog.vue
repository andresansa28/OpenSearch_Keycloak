<template>
    <v-dialog :model-value="show" @update:model-value="$emit('close')" max-width="800">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" :color="deviceInfo?.color || 'primary'">
                    {{ getDeviceIcon(deviceInfo?.type) }}
                </v-icon>
                <span>{{ deviceInfo?.name || 'All Devices' }} - Traffic Details</span>
                <v-spacer></v-spacer>
                <v-btn icon variant="text" @click="$emit('close')">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text>
                <div v-if="viewMode === 'devices' && deviceInfo">
                    <!-- Single Device Details -->
                    <v-row class="mb-4">
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold">{{ deviceInfo.currentTraffic }}</div>
                                <div class="text-caption">Current Traffic</div>
                                <div class="text-caption text-medium-emphasis">KB/s</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold text-success">{{ deviceInfo.status }}</div>
                                <div class="text-caption">Status</div>
                                <div class="text-caption text-medium-emphasis">Operational</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold">{{ deviceInfo.uptime }}</div>
                                <div class="text-caption">Uptime</div>
                                <div class="text-caption text-medium-emphasis">Hours</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold">{{ deviceInfo.connections }}</div>
                                <div class="text-caption">Connections</div>
                                <div class="text-caption text-medium-emphasis">Active</div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Device Actors -->
                    <div class="mb-4">
                        <h4 class="text-subtitle-1 mb-3">Connected Actors</h4>
                        <v-row>
                            <v-col v-for="actor in deviceInfo.actors" :key="actor.id" cols="12" sm="6" md="4">
                                <v-card variant="outlined" class="pa-3">
                                    <div class="d-flex align-center mb-2">
                                        <v-icon :color="actor.status === 'active' ? 'success' : 'error'" class="mr-2">
                                            {{ getActorIcon(actor.type) }}
                                        </v-icon>
                                        <span class="text-subtitle-2 font-weight-medium">{{ actor.name }}</span>
                                    </div>
                                    <div class="text-caption text-medium-emphasis">{{ actor.ip }}</div>
                                    <div class="text-caption">Role: {{ actor.role }}</div>
                                    <div class="text-caption">Last Seen: {{ actor.lastSeen }}</div>
                                    <v-chip :color="actor.status === 'active' ? 'success' : 'error'" size="x-small"
                                        class="mt-1">
                                        {{ actor.status }}
                                    </v-chip>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>
                </div>

                <div v-else>
                    <!-- Total Traffic Details -->
                    <v-row class="mb-4">
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold">{{ totalTrafficInfo.totalTraffic }}</div>
                                <div class="text-caption">Total Traffic</div>
                                <div class="text-caption text-medium-emphasis">KB/s</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold">{{ totalTrafficInfo.activeDevices }}</div>
                                <div class="text-caption">Active Devices</div>
                                <div class="text-caption text-medium-emphasis">Online</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold">{{ totalTrafficInfo.totalConnections }}</div>
                                <div class="text-caption">Total Connections</div>
                                <div class="text-caption text-medium-emphasis">Active</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6" md="3">
                            <v-card variant="tonal" class="pa-3 text-center">
                                <div class="text-h6 font-weight-bold text-warning">{{ totalTrafficInfo.alerts }}</div>
                                <div class="text-caption">Active Alerts</div>
                                <div class="text-caption text-medium-emphasis">Monitoring</div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- All Actors Summary -->
                    <div class="mb-4">
                        <h4 class="text-subtitle-1 mb-3">All Network Actors ({{ clickedTime }})</h4>
                        <v-row>
                            <v-col v-for="actor in allActors" :key="actor.id" cols="12" sm="6" md="4">
                                <v-card variant="outlined" class="pa-3">
                                    <div class="d-flex align-center mb-2">
                                        <v-icon :color="actor.status === 'active' ? 'success' : 'error'" class="mr-2">
                                            {{ getActorIcon(actor.type) }}
                                        </v-icon>
                                        <div>
                                            <span class="text-subtitle-2 font-weight-medium">{{ actor.name }}</span>
                                            <div class="text-caption text-medium-emphasis">{{ actor.device }}</div>
                                        </div>
                                    </div>
                                    <div class="text-caption text-medium-emphasis">{{ actor.ip }}</div>
                                    <div class="text-caption">Traffic: {{ actor.traffic }} KB/s</div>
                                    <v-chip :color="actor.status === 'active' ? 'success' : 'error'" size="x-small"
                                        class="mt-1">
                                        {{ actor.status }}
                                    </v-chip>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup>
// Props
defineProps({
    show: {
        type: Boolean,
        required: true
    },
    deviceInfo: {
        type: Object,
        default: null
    },
    viewMode: {
        type: String,
        required: true
    },
    clickedTime: {
        type: String,
        default: ''
    },
    totalTrafficInfo: {
        type: Object,
        required: true
    },
    allActors: {
        type: Array,
        required: true
    }
})

// Emits
defineEmits(['close', 'update:modelValue'])

// Icon mapping functions
const getDeviceIcon = (type) => {
    switch (type) {
        case 'plc': return 'mdi-chip'
        case 'scada': return 'mdi-monitor-dashboard'
        case 'hmi': return 'mdi-tablet'
        default: return 'mdi-devices'
    }
}

const getActorIcon = (type) => {
    switch (type) {
        case 'controller': return 'mdi-cog'
        case 'sensor': return 'mdi-thermometer'
        case 'actuator': return 'mdi-valve'
        case 'database': return 'mdi-database'
        case 'service': return 'mdi-application'
        case 'monitor': return 'mdi-monitor-eye'
        case 'interface': return 'mdi-monitor-screenshot'
        default: return 'mdi-circle'
    }
}
</script>