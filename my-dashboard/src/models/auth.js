// Modelli per l'autenticazione
export class User {
    constructor(data = {}) {
        this.id = data.id || null
        this.username = data.username || ''
        this.email = data.email || ''
        this.firstName = data.firstName || ''
        this.lastName = data.lastName || ''
        this.role = data.role || 'user'
        this.isActive = data.isActive !== undefined ? data.isActive : true
        this.createdAt = data.createdAt || null
        this.updatedAt = data.updatedAt || null
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim()
    }

    get isAdmin() {
        return this.role === 'admin'
    }
}

export class AuthToken {
    constructor(data = {}) {
        this.accessToken = data.accessToken || ''
        this.refreshToken = data.refreshToken || ''
        this.expiresIn = data.expiresIn || 0
        this.tokenType = data.tokenType || 'Bearer'
    }

    get isExpired() {
        if (!this.expiresIn) return true
        return Date.now() >= this.expiresIn * 1000
    }
}

export class LoginCredentials {
    constructor(username = '', password = '') {
        this.username = username
        this.password = password
    }
}