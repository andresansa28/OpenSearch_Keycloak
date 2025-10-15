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
              <h3 class="text-h5 font-weight-bold">{{ userStats.total }}</h3>
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
              <h3 class="text-h5 font-weight-bold">{{ userStats.active }}</h3>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center">
            <v-icon color="info" size="40" class="mr-3">mdi-shield-account</v-icon>
            <div>
              <p class="text-subtitle-2 text-medium-emphasis mb-1">Inactive Users</p>
              <h3 class="text-h5 font-weight-bold">{{ userStats.inactive }}</h3>
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
            <v-text-field v-model="searchQuery" prepend-icon="mdi-magnify" label="Search users..." variant="outlined"
              density="compact" clearable></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterStatus" :items="statusOptions" label="Filter by Status" variant="outlined"
              density="compact" clearable></v-select>
          </v-col>
          <v-col cols="12" md="4">
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

          <template v-slot:item.groups="{ item }">
            <v-chip-group>
              <v-chip v-for="group in item.groups" :key="group" size="small" variant="outlined">
                {{ group }}
              </v-chip>
            </v-chip-group>
          </template>

          <template v-slot:item.lastLogin="{ item }">
            <span class="text-body-2">
              {{ formatDate(item.lastLogin) }}
            </span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon="mdi-pencil" size="small" variant="text" :loading="operationLoading.update"
              @click="editUser(item)"></v-btn>
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" :loading="operationLoading.delete"
              @click="deleteUserAction(item)"></v-btn>

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
                <v-text-field v-model="currentUser.firstName" label="First Name"
                  :rules="[v => !!v || 'First name is required']" variant="outlined" required></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="currentUser.lastName" label="Last Name"
                  :rules="[v => !!v || 'Last name is required']" variant="outlined" required></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="currentUser.username" label="Username"
                  :rules="[v => !!v || 'Username is required']" variant="outlined" :disabled="editingUser"
                  required></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="currentUser.email" label="Email" :rules="emailRules" variant="outlined"
                  required></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="currentUser.status" :items="statusOptions" label="Status"
                  :rules="[v => !!v || 'Status is required']" variant="outlined" required></v-select>
              </v-col>
              <v-col cols="12">
                <v-select v-model="currentUser.groups" :items="availableGroups" label="Assigned Groups" multiple chips
                  variant="outlined" item-title="name" item-value="value" return-object></v-select>
              </v-col>
              <v-col cols="12" v-if="!editingUser">
                <v-text-field v-model="currentUser.password" label="Password" type="password" :rules="passwordRules"
                  variant="outlined" required></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="primary" :disabled="!formValid" :loading="operationLoading.create || operationLoading.update"
            @click="saveUser">
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
          <v-btn color="error" :loading="operationLoading.delete" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading overlay -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <!-- Error alert -->
    <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
      {{ error }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="clearError">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { useUserManagement } from '@/composables/useUserManagement'
import { computed, onMounted, ref, watch } from 'vue'

// Usa il composable per la gestione degli utenti
const {
  users,
  groups,
  loading,
  error,
  operationLoading,
  userStats,
  fetchUsers,
  fetchGroups,
  createUser,
  updateUser,
  deleteUser,
  getUserGroups,
  assignUserToGroup,
  removeUserFromGroup,
  createGroup,
  deleteGroup,
  clearError,
  initialize
} = useUserManagement()

const userDialog = ref(false)
const deleteDialog = ref(false)
const passwordDialog = ref(false)
const formValid = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)
const searchQuery = ref('')
const filterStatus = ref(null)

const currentUser = ref({
  name: '',
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  role: '',
  status: 'active',
  tenants: [],
  password: ''
})

const newPassword = ref('')

const headers = [
  { title: '', key: 'avatar', sortable: false, width: '60px' },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Email', key: 'email' },
  { title: 'Username', key: 'username' },
  { title: 'Status', key: 'status' },
  { title: 'Groups', key: 'groups', sortable: false },
  { title: 'Last Login', key: 'lastLogin' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

const statusOptions = ['active', 'inactive']

// Mappiamo i gruppi disponibili
const availableGroups = computed(() => {
  return groups.value.map(group => ({
    name: group.name || group.id,
    value: group.name || group.id
  })) || [
      { name: 'Production', value: 'Production' },
      { name: 'Staging', value: 'Staging' },
      { name: 'Development', value: 'Development' },
      { name: 'Testing', value: 'Testing' }
    ]
})

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 8 || 'Password must be at least 8 characters'
]

const filteredUsers = computed(() => {
  let filtered = users.value || []

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    filtered = filtered.filter(user => user.status === filterStatus.value)
  }

  return filtered
})

const showError = computed({
  get: () => !!error.value,
  set: (value) => {
    if (!value) clearError()
  }
})

const getStatusColor = (status) => {
  return status === 'active' ? 'success' : 'error'
}

const getAvatarColor = (name) => {
  const colors = ['primary', 'secondary', 'accent', 'info', 'warning']
  const index = (name || '').charCodeAt(0) % colors.length
  return colors[index]
}

const getInitials = (name) => {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}

const openCreateDialog = () => {
  editingUser.value = null
  currentUser.value = {
    name: '',
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    status: 'active',
    groups: [], // Gruppi Keycloak
    tenants: [], // Tenant OpenSearch (separati)
    password: ''
  }
  userDialog.value = true
}

const editUser = async (user) => {
  editingUser.value = user

  // Carica i gruppi dell'utente per popolare i tenants
  try {
    const userGroups = await getUserGroups(user.id)

    // Mappa i gruppi nel formato atteso dal v-select
    const userGroupObjects = userGroups.map(g => ({
      name: g.name || g.id,
      value: g.name || g.id
    }))

    currentUser.value = {
      ...user,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      groups: userGroupObjects // Usa oggetti per compatibilità con v-select
    }
  } catch (err) {
    console.warn('Errore nel caricamento dei gruppi utente:', err)
    currentUser.value = {
      ...user,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      groups: []
    }
  }

  userDialog.value = true
}

const deleteUserAction = (user) => {
  userToDelete.value = user
  deleteDialog.value = true
}


const closeDialog = () => {
  userDialog.value = false
  editingUser.value = null
  clearError()
}

const saveUser = async () => {
  try {
    if (editingUser.value) {
      // Update existing user - manteniamo tutti i campi originali e aggiorniamo solo quelli modificabili
      await updateUser({
        id: editingUser.value.id,
        username: editingUser.value.username, // Manteniamo l'username originale
        firstName: currentUser.value.firstName,
        lastName: currentUser.value.lastName,
        email: currentUser.value.email,
        enabled: currentUser.value.status === 'active',

        // Manteniamo tutti i campi originali dell'utente
        emailVerified: editingUser.value.emailVerified || false,
        attributes: editingUser.value.attributes || {},
        createdTimestamp: editingUser.value.createdTimestamp,
        totp: editingUser.value.totp || false,
        disableableCredentialTypes: editingUser.value.disableableCredentialTypes || [],
        requiredActions: editingUser.value.requiredActions || [],
        notBefore: editingUser.value.notBefore || 0
      })

      // 🔥 NUOVA LOGICA: Gestisci i gruppi durante la modifica
      // Ottieni i gruppi attuali dell'utente
      const currentUserGroups = await getUserGroups(editingUser.value.id.toString())
      const currentGroupNames = currentUserGroups.map(g => g.name || g.id)

      // Gruppi selezionati nel form (convertiti in stringhe per confronto)
      const selectedGroupNames = (currentUser.value.groups || []).map(t =>
        typeof t === 'object' ? (t.name || t.value || t) : t
      )

      // Trova gruppi da aggiungere e rimuovere
      const groupsToAdd = selectedGroupNames.filter(g => !currentGroupNames.includes(g))
      const groupsToRemove = currentGroupNames.filter(g => !selectedGroupNames.includes(g))

      // Esegui le operazioni sui gruppi
      const groupOperations = []

      // Aggiungi nuovi gruppi
      groupsToAdd.forEach(groupName => {
        groupOperations.push(
          assignUserToGroup(editingUser.value.id.toString(), groupName)
            .catch(err => console.error(`Errore aggiunta gruppo ${groupName}:`, err))
        )
      })

      // Rimuovi gruppi non più selezionati
      groupsToRemove.forEach(groupName => {
        groupOperations.push(
          removeUserFromGroup(editingUser.value.id.toString(), groupName)
            .catch(err => console.error(`Errore rimozione gruppo ${groupName}:`, err))
        )
      })

      // Attendi il completamento di tutte le operazioni sui gruppi
      if (groupOperations.length > 0) {
        await Promise.allSettled(groupOperations)

        // Aggiorna immediatamente la vista locale senza ricaricare tutto
        const updatedUser = users.value.find(u => u.id === editingUser.value.id)
        if (updatedUser) {
          updatedUser.groups = selectedGroupNames
        }

        console.log(`Gruppi aggiornati per utente ${editingUser.value.username}. Richiesto logout/login per aggiornare JWT.`)
      }

    } else {
      // Create new user - verifica prima che l'utente non esista
      const existingUser = users.value.find(u =>
        u.username === currentUser.value.username ||
        u.email === currentUser.value.email
      )

      if (existingUser) {
        console.error('Utente già esistente:', currentUser.value.username)
        return
      }

      const createdUser = await createUser({
        username: currentUser.value.username,
        firstname: currentUser.value.firstName,
        lastname: currentUser.value.lastName,
        email: currentUser.value.email,
        password: currentUser.value.password
      })

      // Ricarica la lista utenti per ottenere l'ID del nuovo utente
      await fetchUsers()

      // Trova l'utente appena creato nella lista
      const newUser = users.value.find(u => u.username === currentUser.value.username)

      if (newUser && currentUser.value.groups && currentUser.value.groups.length > 0) {
        // Replica il flusso Angular: assegna tutti i gruppi selezionati in parallelo
        const groupAssignments = currentUser.value.groups.map(group => {
          const groupName = typeof group === 'object' ? (group.name || group.value) : group
          return assignUserToGroup(newUser.id.toString(), groupName)
        })

        try {
          await Promise.all(groupAssignments)

          // Aggiorna immediatamente la vista locale per il nuovo utente
          const userInList = users.value.find(u => u.id === newUser.id)
          if (userInList) {
            const groupNames = currentUser.value.groups.map(group =>
              typeof group === 'object' ? (group.name || group.value) : group
            )
            userInList.groups = groupNames
          }

          console.log(`Utente ${currentUser.value.username} creato con ${currentUser.value.groups.length} gruppi. Richiesto logout/login per vedere gruppi nel JWT.`)
        } catch (groupError) {
          console.error('Errore nell\'assegnazione di alcuni gruppi:', groupError)
        }
      } else if (!newUser) {
        console.error('Impossibile trovare l\'utente appena creato nella lista')
      }
    }

    closeDialog()
  } catch (err) {
    console.error('Errore nel salvataggio dell\'utente:', err)

    // Gestione errore specifico per conflitto utente esistente
    if (err.message?.includes('già registrato') || err.message?.includes('409')) {
      console.error('Errore duplicazione utente:', err.message)
      return
    }
  }
}

const confirmDelete = async () => {
  try {
    if (userToDelete.value) {
      await deleteUser(userToDelete.value.id)
    }
    deleteDialog.value = false
    userToDelete.value = null
  } catch (err) {
    console.error('Errore nell\'eliminazione dell\'utente:', err)
  }
}


const clearFilters = () => {
  searchQuery.value = ''
  filterStatus.value = null
}

const refreshUsers = async () => {
  try {
    await fetchUsers()
  } catch (err) {
    console.error('Errore nel refresh degli utenti:', err)
  }
}

// Inizializza il composable al mount del componente
onMounted(async () => {
  // Attendi un momento per assicurarti che l'auth sia pronto
  await new Promise(resolve => setTimeout(resolve, 500))

  try {
    await initialize()
  } catch (err) {
    console.error('Errore nell\'inizializzazione della pagina users:', err)
  }
})

// Watch per errori e mostra notifiche
watch(error, (newError) => {
  if (newError) {
    console.error('Errore gestione utenti:', newError)
    // Qui potresti aggiungere una notifica toast
  }
})
</script>

<style scoped>
.v-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>