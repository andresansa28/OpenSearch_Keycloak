// Esporta tutti i servizi per un facile utilizzo
import analyticsService from './analytics.service'
import analyzerService from './analyzer.service'
import authService from './auth.service'
import configService from './config.service'
import keycloakService from './keycloak'
import userManagementService from './userManagement.service'
import usersService from './users.service'

export {
    analyticsService,
    analyzerService,
    authService,
    configService,
    keycloakService, userManagementService, usersService
}

export default {
    auth: authService,
    analytics: analyticsService,
    users: usersService,
    analyzer: analyzerService,
    config: configService,
    keycloak: keycloakService,
    userManagement: userManagementService
}