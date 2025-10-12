<template>
    <v-card class="deploy-wizard" elevation="6">
        <v-card-title class="d-flex align-center justify-space-between">
            <div>
                <div class="text-h6 font-weight-bold">New Deploy Wizard</div>
                <div class="text-body-2 text-medium-emphasis">Step {{ currentStep }} of {{ steps.length }}</div>
            </div>
            <v-btn icon="mdi-close" variant="text" @click="emitClose"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text>
            <v-progress-linear :model-value="progress" height="6" color="primary" class="mb-4"
                rounded></v-progress-linear>

            <div class="wizard-steps mb-4">
                <div v-for="step in steps" :key="step.value" class="wizard-step-header"
                    :class="{ 'wizard-step-header--active': step.value === currentStep, 'wizard-step-header--complete': step.value < currentStep }">
                    <div class="wizard-step-number">{{ step.value }}</div>
                    <div class="wizard-step-info">
                        <div class="wizard-step-title">{{ step.title }}</div>
                        <div class="wizard-step-subtitle">{{ step.subtitle }}</div>
                    </div>
                </div>
            </div>

            <v-window v-model="currentStep" class="wizard-window">
                <v-window-item :value="1">
                    <div class="wizard-step-content">
                        <v-row>
                            <v-col cols="12" class="mt-2">
                                <v-text-field v-model="form.name" label="Deploy Name" prepend-icon="mdi-pound"
                                    variant="outlined" required :rules="[rules.required]" clearable></v-text-field>
                            </v-col>
                            <v-col cols="12">
                                <v-text-field v-model="form.vmIp" label="Deploy VM IP" prepend-icon="mdi-ip"
                                    variant="outlined" required :rules="[rules.required]" clearable></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6" class="mb-2">
                                <v-text-field v-model="form.sshUser" label="SSH Username" prepend-icon="mdi-account"
                                    variant="outlined" required :rules="[rules.required]" clearable></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6" class="mb-2">
                                <v-text-field v-model="form.sshPassword" label="SSH Password" prepend-icon="mdi-lock"
                                    variant="outlined" type="password" required
                                    :rules="[rules.required]"></v-text-field>
                            </v-col>
                        </v-row>
                    </div>
                </v-window-item>

                <v-window-item :value="2">
                    <div class="wizard-step-content">
                        <v-row class="align-center mb-4" dense>
                            <v-col cols="12" md="5" class="mt-2">
                                <v-text-field v-model="deviceForm.name" label="Device Name" prepend-icon="mdi-chip"
                                    variant="outlined" clearable></v-text-field>
                            </v-col>
                            <v-col cols="12" md="5" class="mt-2">
                                <v-text-field v-model="deviceForm.ip" label="Device IP" prepend-icon="mdi-ip"
                                    variant="outlined" clearable></v-text-field>
                            </v-col>
                            <v-col cols="12" md="2" class="d-flex justify-end">
                                <v-btn color="primary" prepend-icon="mdi-plus" @click="addDevice"
                                    :disabled="!canAddDevice">
                                    Add
                                </v-btn>
                            </v-col>
                        </v-row>

                        <div class="devices-wrapper">
                            <v-alert v-if="!form.devices.length" type="info" variant="tonal" density="compact">
                                Add at least one device to continue.
                            </v-alert>

                            <v-list v-else class="device-list" lines="two">
                                <v-list-item v-for="device in form.devices" :key="device.id" class="device-list-item">
                                    <template #prepend>
                                        <v-avatar size="36" color="primary" class="mr-3">
                                            <v-icon size="20">mdi-lan</v-icon>
                                        </v-avatar>
                                    </template>
                                    <div class="text-subtitle-1 font-weight-medium">{{ device.name }}</div>
                                    <div class="text-body-2 text-medium-emphasis font-family-monospace">{{ device.ip }}
                                    </div>
                                    <template #append>
                                        <v-btn icon="mdi-delete" variant="text" color="error"
                                            @click="removeDevice(device.id)"></v-btn>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </div>
                    </div>
                </v-window-item>

                <v-window-item :value="3">
                    <div class="wizard-step-content">
                        <v-card variant="tonal" class="mb-4 pa-4">
                            <h3 class="text-h6 mb-3">Deploy Information</h3>
                            <div class="summary-row">
                                <span class="text-medium-emphasis">Name</span>
                                <span class="font-weight-medium">{{ form.name }}</span>
                            </div>
                            <div class="summary-row">
                                <span class="text-medium-emphasis">VM IP</span>
                                <span class="font-family-monospace">{{ form.vmIp }}</span>
                            </div>
                            <div class="summary-row">
                                <span class="text-medium-emphasis">SSH User</span>
                                <span>{{ form.sshUser }}</span>
                            </div>
                        </v-card>

                        <v-card variant="tonal" class="pa-4">
                            <h3 class="text-h6 mb-3">Devices ({{ form.devices.length }})</h3>
                            <v-list density="compact" class="device-summary-list">
                                <v-list-item v-for="device in form.devices" :key="device.id">
                                    <v-list-item-title>{{ device.name }}</v-list-item-title>
                                    <v-list-item-subtitle class="font-family-monospace">{{ device.ip
                                        }}</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </div>
                </v-window-item>
            </v-window>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
            <v-btn variant="tonal" color="primary" @click="goPrevious" :disabled="currentStep === 1">
                Previous
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="goNext" :disabled="!canProceed">
                {{ currentStep === steps.length ? 'Save Deploy' : 'Next' }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const emit = defineEmits(['close', 'save'])

const steps = [
    { value: 1, title: 'Deploy Details', subtitle: 'VM & credentials' },
    { value: 2, title: 'Devices', subtitle: 'Add connected devices' },
    { value: 3, title: 'Summary', subtitle: 'Review & save' }
]

const currentStep = ref(1)

const form = reactive({
    name: '',
    vmIp: '',
    sshUser: '',
    sshPassword: '',
    devices: []
})

const deviceForm = reactive({
    name: '',
    ip: ''
})

const rules = {
    required: value => !!(value && value.toString().trim()) || 'Field is required'
}

const canAddDevice = computed(() => {
    return Boolean(deviceForm.name.trim() && deviceForm.ip.trim())
})

const canProceed = computed(() => {
    if (currentStep.value === 1) {
        return [form.name, form.vmIp, form.sshUser, form.sshPassword].every(value => value.trim())
    }
    if (currentStep.value === 2) {
        return form.devices.length > 0
    }
    return true
})

const progress = computed(() => (currentStep.value / steps.length) * 100)

const addDevice = () => {
    if (!canAddDevice.value) return

    form.devices.push({
        id: Date.now(),
        name: deviceForm.name.trim(),
        ip: deviceForm.ip.trim()
    })

    deviceForm.name = ''
    deviceForm.ip = ''
}

const removeDevice = (id) => {
    form.devices = form.devices.filter(device => device.id !== id)
}

const emitClose = () => {
    resetWizard()
    emit('close')
}

const goPrevious = () => {
    if (currentStep.value > 1) {
        currentStep.value -= 1
    }
}

const goNext = () => {
    if (!canProceed.value) return

    if (currentStep.value < steps.length) {
        currentStep.value += 1
        return
    }

    emit('save', {
        name: form.name.trim(),
        vmIp: form.vmIp.trim(),
        sshUser: form.sshUser.trim(),
        sshPassword: form.sshPassword,
        devices: form.devices.map(({ id, ...device }) => device)
    })

    resetWizard()
    emit("close")
    openSuccessMessage()
}

const resetWizard = () => {
    currentStep.value = 1
    form.name = ''
    form.vmIp = ''
    form.sshUser = ''
    form.sshPassword = ''
    form.devices = []
    deviceForm.name = ''
    deviceForm.ip = ''
}
</script>

<style scoped>
.deploy-wizard {
    max-width: 780px;
}

.wizard-steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.wizard-step-header {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s ease;
}

.wizard-step-header--active {
    border-color: rgba(25, 118, 210, 0.6);
    background: rgba(25, 118, 210, 0.12);
}

.wizard-step-header--complete {
    border-color: rgba(76, 175, 80, 0.4);
    background: rgba(76, 175, 80, 0.12);
}

.wizard-step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    margin-right: 12px;
    font-weight: 600;
}

.wizard-step-title {
    font-weight: 600;
}

.wizard-step-subtitle {
    font-size: 0.75rem;
    opacity: 0.7;
}

.wizard-step-content {
    max-height: 340px;
    overflow-y: auto;
    padding-right: 6px;
}

.devices-wrapper {
    max-height: 240px;
    overflow-y: auto;
    padding-right: 6px;
}

.device-list-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.summary-row:last-child {
    border-bottom: none;
}

.device-summary-list {
    max-height: 180px;
    overflow-y: auto;
    padding-right: 6px;
}

.font-family-monospace {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
</style>
