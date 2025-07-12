# OpenSearch Keycloak WebApp - AI Coding Instructions

## Architecture Overview
This is an Angular 16 application with Keycloak authentication, designed for managing OpenSearch data and deployments. The app uses a modular architecture with lazy-loaded feature modules.

## Key Architectural Patterns

### Module Structure
- **Feature modules**: Each module (home, datamanager, usermanager, deployment) follows the pattern:
  - `module.ts` - NgModule with CommonModule, feature routing, and PrimeNG components
  - `routing.module.ts` - Lazy-loaded routes with empty path redirects
  - `page/page.component.*` - Main component for the module
- **Shared layout**: `AppLayoutComponent` wraps all authenticated routes
- **Guards**: All routes protected by `AuthGuard` + `NgxPermissionsGuard` with "admin" role requirement

### Authentication & Authorization
- **Keycloak integration**: Configured for realm "ICSConsole" at `https://172.17.0.1:8443/auth`
- **AuthService**: Wrapper around KeycloakService with permission loading via `NgxPermissionsService`
- **Token handling**: Uses PKCE S256 method, redirects to `http://localhost:5002`
- **Role-based access**: All routes require "admin" role, enforced at router and component level

### API Integration
- **Backend proxy**: API calls to `/api` proxied to `http://localhost:5000` (see `proxy.conf.json`)
- **FastAPIserviceService**: Main service for OpenSearch operations (uploadData, removeIndex, getPosts)
- **Data models**: TypeScript interfaces in `models/` folders (e.g., `DeployModel`, `Container`)

## Development Workflow

### Local Development
- Run `ng serve` for dev server (auto-reloads on changes)
- Backend expected at `http://localhost:5000`
- Keycloak at `https://172.17.0.1:8443/auth`
- App serves on `http://localhost:4200` but redirects to port 5002

### Build & Deployment
- **Docker**: Multi-stage build with Node.js 18 Alpine → nginx
- **Production**: Serves from nginx with gzip compression and SPA routing
- **Build artifacts**: Generated in `dist/test` directory

## UI Framework Stack
- **PrimeNG**: Primary UI component library (`primeng`, `primeicons`, `primeflex`)
- **Angular Material**: Secondary UI components (full module import in `shared/material-module.ts`)
- **Styling**: SCSS with layout system in `assets/layout/styles/`

## Project-Specific Conventions

### Service Patterns
- Services injected at component level, not root when possible
- HTTP calls use `HttpParams` for query parameters
- All API services follow `getFunctionName()` naming pattern

### Component Structure
- Components implement `OnInit` lifecycle hook
- Keycloak user data accessed via `AuthService.getLoggedUser()`
- Permission checks using `NgxPermissionsService` with "admin" role

### Routing Configuration
- Hash-based routing (`useHash: true`)
- Nested routes under `AppLayoutComponent`
- Route guards combined: `[AuthGuard, NgxPermissionsGuard]`

## Critical Files
- `src/app/app.module.ts` - Keycloak initialization and main module setup
- `src/app/shared/services/authService.ts` - Authentication wrapper and permissions
- `src/app/shared/guards/auth.guard.ts` - Route protection logic
- `src/proxy.conf.json` - API proxy configuration for development
- `Dockerfile` - Multi-stage build with nginx deployment
