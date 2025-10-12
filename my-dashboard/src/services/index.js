// Esporta tutti i servizi per un facile utilizzo
import analyticsService from './analytics.service'
import analyzerService from './analyzer.service'
import authService from './auth.service'
import configService from './config.service'
import usersService from './users.service'

export {
    analyticsService,
    analyzerService,
    authService,
    configService,
    usersService
}

export default {
    auth: authService,
    analytics: analyticsService,
    users: usersService,
    analyzer: analyzerService,
    config: configService
}