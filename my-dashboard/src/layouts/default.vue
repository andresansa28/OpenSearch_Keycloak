<template>
    <v-app>
        <!-- Navbar superiore -->
        <v-app-bar :elevation="2" color="surface" height="70" app>
            <v-toolbar-title class="text-h5 font-weight-bold">
                <v-icon icon="mdi-chart-line" class="mr-2"></v-icon>
                Network Traffic Dashboard
            </v-toolbar-title>

            <v-spacer></v-spacer>

            <!-- Indicatore status analyzer centrato e più elegante -->
            <div class="analyzer-status-container">
                <v-card :color="analyzerStats ? 'success' : 'error'" variant="tonal"
                    class="analyzer-status-card px-4 py-2" elevation="3">
                    <div class="d-flex align-center">
                        <v-avatar :color="analyzerStats ? 'success' : 'error'" size="32" class="mr-3">
                            <v-icon :icon="analyzerStats ? 'mdi-play-circle' : 'mdi-stop-circle'" color="white"
                                size="20"></v-icon>
                        </v-avatar>
                        <div>
                            <div class="text-subtitle-1 font-weight-bold">
                                Analyzer
                            </div>
                            <div class="text-caption" style="line-height: 1;">
                                {{ analyzerStats ? 'Active' : 'Inactive' }}
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>

            <v-spacer></v-spacer>

            <!-- Menu utente moderno -->
            <div v-if="auth.isAuthenticated" class="d-flex align-center">
                <!-- Avatar e info utente -->
                <v-chip :prepend-avatar="userAvatar" variant="outlined" class="mr-3">
                    {{ userDisplayName }}
                </v-chip>

                <!-- Menu dropdown -->
                <v-menu>
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-account-circle" variant="text" size="large">
                        </v-btn>
                    </template>

                    <v-list min-width="200">
                        <v-list-item :prepend-avatar="userAvatar" :subtitle="auth.profile?.email || 'Utente'"
                            :title="userDisplayName">
                            <template #append>
                                <v-chip color="success" size="x-small" variant="dot">Online</v-chip>
                            </template>
                        </v-list-item>

                        <v-divider></v-divider>

                        <v-list-item prepend-icon="mdi-account-edit" title="Profilo" subtitle="Gestisci il tuo account">
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-cog" title="Impostazioni" subtitle="Preferenze applicazione">
                        </v-list-item>

                        <v-divider></v-divider>

                        <v-list-item prepend-icon="mdi-logout" title="Logout" subtitle="Disconnetti dall'account"
                            @click="doLogout" class="text-error">
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
        </v-app-bar>

        <!-- Navigazione laterale -->
        <v-navigation-drawer expand-on-hover permanent rail>
            <v-list>
                <v-list-item :prepend-avatar="userAvatar"
                    :subtitle="auth.profile?.email || (auth.isReady ? 'Utente' : 'Caricamento...')"
                    :title="userDisplayName">
                    <!-- Badge per indicare lo stato online/offline -->
                    <template #append>
                        <v-chip v-if="auth.isAuthenticated" color="success" size="x-small" variant="dot">
                            Online
                        </v-chip>
                    </template>
                </v-list-item>
            </v-list>

            <v-divider></v-divider>
            <v-list density="compact" nav>
                <v-list-item v-for="item in navigationItems" :key="item.to" :prepend-icon="item.icon"
                    :title="item.title" :to="item.to" :value="item.to"></v-list-item>
            </v-list>

        </v-navigation-drawer>

        <!-- Contenuto principale -->
        <v-main>
            <router-view />
        </v-main>
    </v-app>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { computed, ref } from 'vue'

const auth = useAuthStore()

const doLogout = async () => {
    await auth.logout()
}

const analyzerStats = ref(true) // Per futuro uso

// Computed per il nome dell'utente
const userDisplayName = computed(() => {
    if (!auth.profile) return 'Utente'

    // Priorità: firstName + lastName, poi username, poi email
    if (auth.profile.firstName || auth.profile.lastName) {
        return `${auth.profile.firstName || ''} ${auth.profile.lastName || ''}`.trim()
    }

    if (auth.profile.username) {
        return auth.profile.username
    }

    if (auth.profile.email) {
        return auth.profile.email.split('@')[0]
    }

    return 'Utente'
})

// Computed per l'avatar personalizzato
const userAvatar = computed(() => {
    const seed = auth.profile?.username || auth.profile?.email || 'default'
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
})



const navigationItems = [
    {
        title: 'Dashboard',
        icon: 'mdi-monitor-dashboard',
        to: '/'
    },
    {
        title: 'Deployments',
        icon: 'mdi-chart-line',
        to: '/analyzer'
    },
    {
        title: 'Users',
        icon: 'mdi-account-multiple',
        to: '/users'
    }
]
</script>

<style scoped>
.v-application {
    background-color: #121212 !important;
}

.analyzer-status-container {
    margin-left: 23px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 220px;

}

.analyzer-status-card {
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    min-width: 140px;
    display: flex;
    justify-content: center;
}

.analyzer-status-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.v-avatar {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.7);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(var(--v-theme-success), 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0);
    }
}
</style>