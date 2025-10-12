<template>
    <v-dialog v-model="dialog" max-width="1200px" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center pa-4">
                <div class="d-flex align-center">
                    <v-avatar size="40" class="mr-3" :color="getActorTypeColor(selectedActor?.type)">
                        <v-icon :icon="getActorTypeIcon(selectedActor?.type)" color="white" size="20"></v-icon>
                    </v-avatar>
                    <div>
                        <div class="text-h6">{{ selectedActor?.name }} Timeline</div>
                        <div class="text-caption text-medium-emphasis">
                            {{ selectedActor?.type }} • {{ selectedActor?.ipAddress }}
                        </div>
                    </div>
                </div>
                <v-spacer></v-spacer>
                <v-btn icon variant="text" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <!-- Actor Overview Stats -->
            <v-card-text class="pa-4">
                <v-row class="mb-6">
                    <v-col cols="12" sm="2">
                        <v-card variant="tonal" color="primary" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ actorStats.daysActive }}</div>
                            <div class="text-caption">Days Active</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-card variant="tonal" color="info" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ actorStats.totalEvents }}</div>
                            <div class="text-caption">Total Events</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-card variant="tonal" color="success" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ actorStats.successfulConnections }}</div>
                            <div class="text-caption">Successful</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-card variant="tonal" color="warning" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ actorStats.failedConnections }}</div>
                            <div class="text-caption">Failed</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-card variant="tonal" color="error" class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ actorStats.securityIncidents }}</div>
                            <div class="text-caption">Incidents</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-card variant="tonal" :color="getThreatLevelColor(selectedActor?.threatLevel)"
                            class="pa-3 text-center">
                            <div class="text-h6 font-weight-bold">{{ selectedActor?.threatLevel?.toUpperCase() }}</div>
                            <div class="text-caption">Risk Level</div>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Timeline Filter -->
                <div class="mb-4">
                    <div class="d-flex align-center justify-space-between mb-3">
                        <h3 class="text-h6">Activity Timeline</h3>
                        <div class="d-flex align-center ga-2">
                            <v-btn-toggle v-model="timelineFilter" mandatory variant="outlined" size="small">
                                <v-btn value="all">All Events</v-btn>
                                <v-btn value="security">Security</v-btn>
                                <v-btn value="connections">Connections</v-btn>
                                <v-btn value="anomalies">Anomalies</v-btn>
                            </v-btn-toggle>
                            <v-btn-toggle v-model="timeRange" mandatory variant="outlined" size="small">
                                <v-btn value="24h">24h</v-btn>
                                <v-btn value="7d">7d</v-btn>
                                <v-btn value="30d">30d</v-btn>
                                <v-btn value="all">All</v-btn>
                            </v-btn-toggle>
                        </div>
                    </div>
                </div>

                <!-- Timeline -->
                <div class="timeline-container">
                    <v-timeline side="end" align="start" class="timeline-custom">
                        <v-timeline-item v-for="(event, index) in filteredTimeline" :key="index"
                            :dot-color="getEventColor(event.type)" size="small" :icon="getEventIcon(event.type)">
                            <template v-slot:opposite>
                                <div class="text-caption text-medium-emphasis">
                                    {{ formatEventTime(event.timestamp) }}
                                </div>
                            </template>

                            <v-card class="elevation-2" :class="getEventCardClass(event.severity)">
                                <v-card-title class="text-subtitle-1 pa-3 pb-2">
                                    <div class="d-flex align-center justify-space-between">
                                        <div class="d-flex align-center">
                                            <v-chip :color="getEventTypeColor(event.type)" size="small" variant="flat"
                                                class="mr-2">
                                                {{ event.type }}
                                            </v-chip>
                                            <span>{{ event.title }}</span>
                                        </div>
                                        <v-chip :color="getSeverityColor(event.severity)" size="x-small" variant="flat">
                                            {{ event.severity }}
                                        </v-chip>
                                    </div>
                                </v-card-title>

                                <v-card-text class="pa-3 pt-1">
                                    <p class="text-body-2 mb-2">{{ event.description }}</p>

                                    <!-- Event Details -->
                                    <div v-if="event.details" class="event-details">
                                        <v-row dense>
                                            <v-col v-for="(value, key) in event.details" :key="key" cols="6" sm="4">
                                                <div class="text-caption text-medium-emphasis">{{ formatKey(key) }}
                                                </div>
                                                <div class="text-body-2 font-weight-medium">{{ value }}</div>
                                            </v-col>
                                        </v-row>
                                    </div>

                                    <!-- Security Impact -->
                                    <div v-if="event.securityImpact" class="mt-2">
                                        <v-alert :color="getSecurityImpactColor(event.securityImpact.level)"
                                            variant="tonal" density="compact" class="text-caption">
                                            <strong>Security Impact:</strong> {{ event.securityImpact.description }}
                                        </v-alert>
                                    </div>

                                    <!-- Action Taken -->
                                    <div v-if="event.actionTaken" class="mt-2">
                                        <div class="d-flex align-center">
                                            <v-icon size="small" color="success" class="mr-1">mdi-check-circle</v-icon>
                                            <span class="text-caption">Action: {{ event.actionTaken }}</span>
                                        </div>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-timeline-item>
                    </v-timeline>

                    <!-- No Events Message -->
                    <div v-if="filteredTimeline.length === 0" class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-timeline-outline</v-icon>
                        <div class="text-h6 text-medium-emphasis mt-2">No events found</div>
                        <div class="text-caption text-medium-emphasis">Try adjusting your filter settings</div>
                    </div>
                </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="closeDialog">
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    selectedActor: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue'])

const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const timelineFilter = ref('all')
const timeRange = ref('7d')

// Generate realistic timeline data for the actor
const generateActorTimeline = (actor) => {
    if (!actor) return []

    const now = new Date()
    const events = []

    // First appearance (entry into system)
    const firstEntry = new Date(now.getTime() - (Math.random() * 90 + 30) * 24 * 60 * 60 * 1000)
    events.push({
        timestamp: firstEntry,
        type: 'first-connection',
        title: 'First System Entry',
        description: `Actor ${actor.name} first detected in the network. Initial connection established from ${actor.ipAddress}.`,
        severity: 'info',
        details: {
            'IP Address': actor.ipAddress,
            'Actor Type': actor.type,
            'Detection Method': 'Network Scan',
            'Initial Protocol': 'TCP/443'
        },
        securityImpact: {
            level: 'low',
            description: 'New actor detected in network perimeter'
        },
        actionTaken: 'Added to monitoring list'
    })

    // Generate various events based on actor type and threat level
    const eventTypes = {
        'low': [
            'successful-connection', 'data-transfer', 'authentication', 'protocol-handshake'
        ],
        'medium': [
            'successful-connection', 'failed-authentication', 'unusual-traffic', 'port-scan', 'protocol-violation'
        ],
        'high': [
            'failed-authentication', 'brute-force-attempt', 'malware-detected', 'data-exfiltration', 'command-injection'
        ]
    }

    const actorEventTypes = eventTypes[actor.threatLevel] || eventTypes['low']
    const numEvents = Math.floor(Math.random() * 20) + 10

    for (let i = 0; i < numEvents; i++) {
        const eventTime = new Date(firstEntry.getTime() + (Math.random() * (now.getTime() - firstEntry.getTime())))
        const eventType = actorEventTypes[Math.floor(Math.random() * actorEventTypes.length)]

        events.push(generateEvent(eventType, eventTime, actor))
    }

    // Sort by timestamp (newest first)
    return events.sort((a, b) => b.timestamp - a.timestamp)
}

const generateEvent = (type, timestamp, actor) => {
    const eventTemplates = {
        'successful-connection': {
            title: 'Successful Connection',
            description: `Established successful connection to network resources.`,
            severity: 'info',
            details: {
                'Protocol': ['HTTPS', 'SSH', 'FTP', 'Modbus'][Math.floor(Math.random() * 4)],
                'Port': Math.floor(Math.random() * 9000) + 1000,
                'Bytes Transferred': `${Math.floor(Math.random() * 1000) + 100} KB`,
                'Duration': `${Math.floor(Math.random() * 300) + 10}s`
            }
        },
        'failed-authentication': {
            title: 'Authentication Failure',
            description: `Failed authentication attempt detected.`,
            severity: 'warning',
            details: {
                'Username': ['admin', 'root', 'user', 'operator'][Math.floor(Math.random() * 4)],
                'Method': ['Password', 'Certificate', 'Token'][Math.floor(Math.random() * 3)],
                'Attempts': Math.floor(Math.random() * 5) + 1,
                'Source Port': Math.floor(Math.random() * 65535)
            },
            securityImpact: {
                level: 'medium',
                description: 'Multiple failed authentication attempts may indicate brute force attack'
            }
        },
        'brute-force-attempt': {
            title: 'Brute Force Attack',
            description: `Detected brute force attack pattern.`,
            severity: 'critical',
            details: {
                'Target Service': ['SSH', 'RDP', 'HTTP', 'FTP'][Math.floor(Math.random() * 4)],
                'Attempts Count': Math.floor(Math.random() * 100) + 50,
                'Time Window': `${Math.floor(Math.random() * 60) + 5} minutes`,
                'Success Rate': `${Math.floor(Math.random() * 10)}%`
            },
            securityImpact: {
                level: 'high',
                description: 'Systematic brute force attack detected'
            },
            actionTaken: 'IP temporarily blocked'
        },
        'data-transfer': {
            title: 'Data Transfer',
            description: `Large data transfer operation completed.`,
            severity: 'info',
            details: {
                'Data Size': `${Math.floor(Math.random() * 500) + 50} MB`,
                'Direction': ['Upload', 'Download'][Math.floor(Math.random() * 2)],
                'Transfer Rate': `${Math.floor(Math.random() * 100) + 10} Mbps`,
                'File Type': ['Log Files', 'Configuration', 'Database', 'Images'][Math.floor(Math.random() * 4)]
            }
        },
        'port-scan': {
            title: 'Port Scanning Activity',
            description: `Network port scanning detected from this actor.`,
            severity: 'warning',
            details: {
                'Ports Scanned': Math.floor(Math.random() * 1000) + 100,
                'Scan Type': ['TCP SYN', 'UDP', 'TCP Connect'][Math.floor(Math.random() * 3)],
                'Target Range': `192.168.${Math.floor(Math.random() * 255)}.0/24`,
                'Duration': `${Math.floor(Math.random() * 120) + 10}s`
            },
            securityImpact: {
                level: 'medium',
                description: 'Reconnaissance activity detected'
            }
        },
        'malware-detected': {
            title: 'Malware Detection',
            description: `Malicious software detected in traffic from this actor.`,
            severity: 'critical',
            details: {
                'Malware Type': ['Trojan', 'Worm', 'Backdoor', 'Spyware'][Math.floor(Math.random() * 4)],
                'Detection Engine': 'ClamAV',
                'Threat Signature': `MAL-${Math.random().toString(36).substring(7).toUpperCase()}`,
                'File Hash': Math.random().toString(36).substring(2, 34)
            },
            securityImpact: {
                level: 'critical',
                description: 'Active malware threat identified'
            },
            actionTaken: 'Connection blocked, quarantine initiated'
        },
        'protocol-violation': {
            title: 'Protocol Violation',
            description: `Network protocol violation detected.`,
            severity: 'warning',
            details: {
                'Protocol': ['HTTP', 'Modbus', 'DNP3', 'IEC 61850'][Math.floor(Math.random() * 4)],
                'Violation Type': ['Invalid Header', 'Malformed Packet', 'Unexpected Command'][Math.floor(Math.random() * 3)],
                'Packet Size': `${Math.floor(Math.random() * 1500) + 64} bytes`,
                'Error Code': `0x${Math.floor(Math.random() * 255).toString(16).toUpperCase()}`
            },
            securityImpact: {
                level: 'low',
                description: 'Protocol compliance issue detected'
            }
        }
    }

    const template = eventTemplates[type] || eventTemplates['successful-connection']

    return {
        timestamp,
        type,
        ...template
    }
}

const actorTimeline = computed(() => {
    return generateActorTimeline(props.selectedActor)
})

const actorStats = computed(() => {
    if (!props.selectedActor) return {}

    const timeline = actorTimeline.value
    const firstEvent = timeline[timeline.length - 1]
    const lastEvent = timeline[0]

    const daysActive = firstEvent ? Math.ceil((new Date() - firstEvent.timestamp) / (1000 * 60 * 60 * 24)) : 0
    const successfulConnections = timeline.filter(e => e.type === 'successful-connection' || e.type === 'data-transfer').length
    const failedConnections = timeline.filter(e => e.type === 'failed-authentication' || e.severity === 'warning' || e.severity === 'critical').length
    const securityIncidents = timeline.filter(e => e.securityImpact && e.securityImpact.level !== 'low').length

    return {
        daysActive,
        totalEvents: timeline.length,
        successfulConnections,
        failedConnections,
        securityIncidents
    }
})

const filteredTimeline = computed(() => {
    let timeline = actorTimeline.value

    // Filter by event type
    if (timelineFilter.value !== 'all') {
        const filterMap = {
            'security': ['failed-authentication', 'brute-force-attempt', 'malware-detected', 'port-scan'],
            'connections': ['successful-connection', 'data-transfer', 'first-connection'],
            'anomalies': ['protocol-violation', 'port-scan', 'brute-force-attempt', 'malware-detected']
        }
        const allowedTypes = filterMap[timelineFilter.value]
        if (allowedTypes) {
            timeline = timeline.filter(event => allowedTypes.includes(event.type))
        }
    }

    // Filter by time range
    if (timeRange.value !== 'all') {
        const now = new Date()
        const timeRanges = {
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        }
        const range = timeRanges[timeRange.value]
        if (range) {
            const cutoff = new Date(now.getTime() - range)
            timeline = timeline.filter(event => event.timestamp >= cutoff)
        }
    }

    return timeline
})

// Utility functions
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

const getThreatLevelColor = (level) => {
    switch (level) {
        case 'high': return 'error'
        case 'medium': return 'warning'
        case 'low': return 'success'
        default: return 'primary'
    }
}

const getEventColor = (type) => {
    const colors = {
        'first-connection': 'primary',
        'successful-connection': 'success',
        'failed-authentication': 'warning',
        'brute-force-attempt': 'error',
        'data-transfer': 'info',
        'port-scan': 'orange',
        'malware-detected': 'red',
        'protocol-violation': 'amber'
    }
    return colors[type] || 'grey'
}

const getEventIcon = (type) => {
    const icons = {
        'first-connection': 'mdi-login',
        'successful-connection': 'mdi-check-circle',
        'failed-authentication': 'mdi-alert-circle',
        'brute-force-attempt': 'mdi-security',
        'data-transfer': 'mdi-swap-horizontal',
        'port-scan': 'mdi-radar',
        'malware-detected': 'mdi-virus',
        'protocol-violation': 'mdi-alert-triangle'
    }
    return icons[type] || 'mdi-circle'
}

const getEventTypeColor = (type) => {
    return getEventColor(type)
}

const getEventCardClass = (severity) => {
    switch (severity) {
        case 'critical': return 'border-error'
        case 'warning': return 'border-warning'
        case 'info': return 'border-info'
        default: return ''
    }
}

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'critical': return 'error'
        case 'warning': return 'warning'
        case 'info': return 'info'
        default: return 'grey'
    }
}

const getSecurityImpactColor = (level) => {
    switch (level) {
        case 'critical': return 'error'
        case 'high': return 'error'
        case 'medium': return 'warning'
        case 'low': return 'info'
        default: return 'grey'
    }
}

const formatEventTime = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) {
        return `${days}d ago`
    } else if (hours > 0) {
        return `${hours}h ago`
    } else if (minutes > 0) {
        return `${minutes}m ago`
    } else {
        return 'Just now'
    }
}

const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

// Actions
const closeDialog = () => {
    dialog.value = false
}

const exportTimeline = () => {
    const timeline = filteredTimeline.value
    const csv = [
        'Timestamp,Type,Title,Description,Severity',
        ...timeline.map(event =>
            `"${event.timestamp.toISOString()}","${event.type}","${event.title}","${event.description}","${event.severity}"`
        )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.selectedActor?.name}_timeline.csv`
    a.click()
    window.URL.revokeObjectURL(url)
}

const generateReport = () => {
    console.log('Generating security report for actor:', props.selectedActor?.name)
    // Here you would implement report generation logic
}
</script>

<style scoped>
.timeline-container {
    max-height: 600px;
    overflow-y: auto;
}

.timeline-custom {
    padding-left: 0;
}

.event-details {
    background-color: rgba(var(--v-theme-surface-variant), 0.3);
    border-radius: 4px;
    padding: 8px;
}

.border-error {
    border-left: 4px solid rgb(var(--v-theme-error));
}

.border-warning {
    border-left: 4px solid rgb(var(--v-theme-warning));
}

.border-info {
    border-left: 4px solid rgb(var(--v-theme-info));
}

:deep(.v-timeline-item__body) {
    padding-bottom: 24px;
}

:deep(.v-timeline-item__opposite) {
    flex: 0 1 auto;
    padding-right: 16px;
}
</style>