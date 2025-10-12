<template>
    <div class="pa-6">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between mb-6">
            <div>
                <h1 class="text-h4 font-weight-bold mb-2">User Management</h1>
                <p class="text-subtitle-1 text-medium-emphasis">
                    Manage users, roles and tenant access permissions
                </p>
            </div>

            <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openCreateDialog">
                Add New User
            </v-btn>
        </div>

        <!-- Statistiche utenti -->
        <v-row class="mb-6">
            <v-col cols="12" sm="4">
                <v-card class="pa-4" elevation="2">
                    <div class="d-flex align-center">
                        <v-icon color="primary" size="40" class="mr-3">mdi-account-multiple</v-icon>
                        <div>
                            <p class="text-subtitle-2 text-medium-emphasis mb-1">Total Users</p>
                            <h3 class="text-h5 font-weight-bold">{{ users.length }}</h3>
                        </div>
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" sm="4">
                <v-card class="pa-4" elevation="2">
                    <div class="d-flex align-center">
                        <v-icon color="success" size="40" class="mr-3">mdi-account-check</v-icon>
                        <div>
                            <p class="text-subtitle-2 text-medium-emphasis mb-1">Active Users</p>
                            <h3 class="text-h5 font-weight-bold">{{users.filter(u => u.status === 'active').length}}
                            </h3>
                        </div>
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" sm="4">
                <v-card class="pa-4" elevation="2">
                    <div class="d-flex align-center">
                        <v-icon color="info" size="40" class="mr-3">mdi-shield-account</v-icon>
                        <div>
                            <p class="text-subtitle-2 text-medium-emphasis mb-1">Admin Users</p>
                            <h3 class="text-h5 font-weight-bold">{{users.filter(u => u.role === 'admin').length}}</h3>
                        </div>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Filtri e ricerca -->
        <v-card class="mb-6" elevation="2">
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="4">
                        <v-text-field v-model="searchQuery" prepend-icon="mdi-magnify" label="Search users..."
                            variant="outlined" density="compact" clearable></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-select v-model="filterRole" :items="roles" label="Filter by Role" variant="outlined"
                            density="compact" clearable></v-select>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-select v-model="filterStatus" :items="statusOptions" label="Filter by Status"
                            variant="outlined" density="compact" clearable></v-select>
                    </v-col>
                    <v-col cols="12" md="2">
                        <v-btn color="primary" variant="outlined" block @click="clearFilters">
                            Clear Filters
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Tabella utenti -->
        <v-card elevation="2">
            <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-h6">Users ({{ filteredUsers.length }})</span>
                <v-btn color="primary" variant="outlined" size="small" @click="refreshUsers">
                    <v-icon start>mdi-refresh</v-icon>
                    Refresh
                </v-btn>
            </v-card-title>

            <v-card-text>
                <v-data-table :headers="headers" :items="filteredUsers" :items-per-page="10" class="elevation-1">
                    <template v-slot:item.avatar="{ item }">
                        <v-avatar size="40" :color="getAvatarColor(item.name)">
                            <span class="text-white font-weight-bold">
                                {{ getInitials(item.name) }}
                            </span>
                        </v-avatar>
                    </template>

                    <template v-slot:item.status="{ item }">
                        <v-chip :color="getStatusColor(item.status)" size="small">
                            {{ item.status }}
                        </v-chip>
                    </template>

                    <template v-slot:item.tenants="{ item }">
                        <v-chip-group>
                            <v-chip v-for="tenant in item.tenants" :key="tenant" size="small" variant="outlined">
                                {{ tenant }}
                            </v-chip>
                        </v-chip-group>
                    </template>

                    <template v-slot:item.lastLogin="{ item }">
                        <span class="text-body-2">
                            {{ formatDate(item.lastLogin) }}
                        </span>
                    </template>

                    <template v-slot:item.actions="{ item }">
                        <v-btn icon="mdi-pencil" size="small" variant="text" @click="editUser(item)"></v-btn>
                        <v-btn icon="mdi-delete" size="small" variant="text" color="error"
                            @click="deleteUser(item)"></v-btn>
                        <v-btn icon="mdi-key" size="small" variant="text" color="warning"
                            @click="resetPassword(item)"></v-btn>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>

        <!-- Dialog per creazione/modifica utente -->
        <v-dialog v-model="userDialog" max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">{{ editingUser ? 'Edit User' : 'Create New User' }}</span>
                </v-card-title>

                <v-card-text>
                    <v-form ref="userForm" v-model="formValid">
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="currentUser.name" label="Full Name"
                                    :rules="[v => !!v || 'Name is required']" variant="outlined"
                                    required></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="currentUser.email" label="Email" :rules="emailRules"
                                    variant="outlined" required></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-select v-model="currentUser.role" :items="roles" label="Role"
                                    :rules="[v => !!v || 'Role is required']" variant="outlined" required></v-select>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-select v-model="currentUser.status" :items="statusOptions" label="Status"
                                    :rules="[v => !!v || 'Status is required']" variant="outlined" required></v-select>
                            </v-col>
                            <v-col cols="12">
                                <v-select v-model="currentUser.tenants" :items="availableTenants"
                                    label="Assigned Tenants" multiple chips variant="outlined"></v-select>
                            </v-col>
                            <v-col cols="12" v-if="!editingUser">
                                <v-text-field v-model="currentUser.password" label="Password" type="password"
                                    :rules="passwordRules" variant="outlined" required></v-text-field>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="closeDialog">
                        Cancel
                    </v-btn>
                    <v-btn color="primary" :disabled="!formValid" @click="saveUser">
                        {{ editingUser ? 'Update' : 'Create' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Dialog di conferma eliminazione -->
        <v-dialog v-model="deleteDialog" max-width="400px">
            <v-card>
                <v-card-title class="text-h6">
                    Confirm Delete
                </v-card-title>
                <v-card-text>
                    Are you sure you want to delete user "{{ userToDelete?.name }}"?
                    This action cannot be undone.
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="deleteDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="error" @click="confirmDelete">
                        Delete
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const userDialog = ref(false)
const deleteDialog = ref(false)
const formValid = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)
const searchQuery = ref('')
const filterRole = ref(null)
const filterStatus = ref(null)

const currentUser = ref({
    name: '',
    email: '',
    role: '',
    status: 'active',
    tenants: [],
    password: ''
})

const users = ref([
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'admin',
        status: 'active',
        tenants: ['Production', 'Staging'],
        lastLogin: '2024-01-25T10:30:00'
    },
    {
        id: 2,
        name: 'Maria Rodriguez',
        email: 'maria.rodriguez@company.com',
        role: 'analyst',
        status: 'active',
        tenants: ['Production'],
        lastLogin: '2024-01-24T15:45:00'
    },
    {
        id: 3,
        name: 'David Chen',
        email: 'david.chen@company.com',
        role: 'viewer',
        status: 'inactive',
        tenants: ['Development'],
        lastLogin: '2024-01-20T09:15:00'
    },
    {
        id: 4,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: 'analyst',
        status: 'active',
        tenants: ['Staging', 'Testing'],
        lastLogin: '2024-01-25T14:20:00'
    }
])

const headers = [
    { title: '', key: 'avatar', sortable: false, width: '60px' },
    { title: 'Name', key: 'name', align: 'start' },
    { title: 'Email', key: 'email' },
    { title: 'Role', key: 'role' },
    { title: 'Status', key: 'status' },
    { title: 'Tenants', key: 'tenants', sortable: false },
    { title: 'Last Login', key: 'lastLogin' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

const roles = ['admin', 'analyst', 'viewer']
const statusOptions = ['active', 'inactive']
const availableTenants = ['Production', 'Staging', 'Development', 'Testing']

const emailRules = [
    v => !!v || 'Email is required',
    v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
    v => !!v || 'Password is required',
    v => v.length >= 8 || 'Password must be at least 8 characters'
]

const filteredUsers = computed(() => {
    let filtered = users.value

    if (searchQuery.value) {
        filtered = filtered.filter(user =>
            user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    }

    if (filterRole.value) {
        filtered = filtered.filter(user => user.role === filterRole.value)
    }

    if (filterStatus.value) {
        filtered = filtered.filter(user => user.status === filterStatus.value)
    }

    return filtered
})

const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error'
}

const getAvatarColor = (name) => {
    const colors = ['primary', 'secondary', 'accent', 'info', 'warning']
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
}

const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
}

const openCreateDialog = () => {
    editingUser.value = null
    currentUser.value = {
        name: '',
        email: '',
        role: '',
        status: 'active',
        tenants: [],
        password: ''
    }
    userDialog.value = true
}

const editUser = (user) => {
    editingUser.value = user
    currentUser.value = { ...user }
    userDialog.value = true
}

const deleteUser = (user) => {
    userToDelete.value = user
    deleteDialog.value = true
}

const resetPassword = (user) => {
    console.log('Reset password for:', user.name)
    // Implementazione reset password
}

const closeDialog = () => {
    userDialog.value = false
    editingUser.value = null
}

const saveUser = () => {
    if (editingUser.value) {
        // Update existing user
        const index = users.value.findIndex(u => u.id === editingUser.value.id)
        if (index !== -1) {
            users.value[index] = { ...currentUser.value, id: editingUser.value.id }
        }
    } else {
        // Create new user
        const newUser = {
            ...currentUser.value,
            id: Math.max(...users.value.map(u => u.id)) + 1,
            lastLogin: new Date().toISOString()
        }
        users.value.push(newUser)
    }
    closeDialog()
}

const confirmDelete = () => {
    if (userToDelete.value) {
        const index = users.value.findIndex(u => u.id === userToDelete.value.id)
        if (index !== -1) {
            users.value.splice(index, 1)
        }
    }
    deleteDialog.value = false
    userToDelete.value = null
}

const clearFilters = () => {
    searchQuery.value = ''
    filterRole.value = null
    filterStatus.value = null
}

const refreshUsers = () => {
    console.log('Refreshing users...')
    // Implementazione refresh
}
</script>

<style scoped>
.v-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>