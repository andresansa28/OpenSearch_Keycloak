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
                                {{ analyzerStatus ? 'Active' : 'Inactive' }}
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>

            <v-spacer></v-spacer>

            <!-- Menu utente -->
            <v-btn icon>
                <v-icon>mdi-account-circle</v-icon>
            </v-btn>
        </v-app-bar>

        <!-- Navigazione laterale -->
        <v-navigation-drawer
        expand-on-hover
        permanent
        rail
      >
        <v-list>
          <v-list-item
            prepend-avatar="https://randomuser.me/api/portraits/women/85.jpg"
            subtitle="admin_a88@gmailcom"
            title="Admin Admin"
          ></v-list-item>
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
import { ref } from 'vue'

const analyzerStats = ref(true) // Per futuro uso


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