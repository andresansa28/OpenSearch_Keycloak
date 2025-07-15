import {Injectable} from "@angular/core";
import {KeycloakService} from "keycloak-angular";
import {KeycloakProfile, KeycloakTokenParsed} from "keycloak-js";
import { NgxPermissionsService } from "ngx-permissions";
import { HttpClient } from "@angular/common/http";


@Injectable()
export class AuthService {
  constructor(
    private keycloakService: KeycloakService,
    private permissionsService: NgxPermissionsService,
    private http: HttpClient
    ) {
  }

  public getLoggedUser(): KeycloakTokenParsed | undefined {
    try {
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      this.permissionsService.loadPermissions(this.getRoles())
      return keycloakInstance.idTokenParsed;
    } catch (e) {
      console.error("exception", e)
      return undefined;
    }
  }

  public isLoggedIn(): Promise<boolean> {
    return this.keycloakService.isLoggedIn();
  }

  public loadUserProfile(): Promise<KeycloakProfile> {
    return this.keycloakService.loadUserProfile();
  }

  public login(): void{
    this.keycloakService.login({
      redirectUri: window.location.origin
    });
  }
  

  // src/app/services/auth.service.ts
logout(): void {
  const realm = 'ICSConsole';
  const keycloakInstance = this.keycloakService.getKeycloakInstance();

  if (!keycloakInstance) {
    console.error('Keycloak instance non disponibile');
    return;
  }

  const idToken = keycloakInstance.idToken;
  if (!idToken) {
    console.error('ID Token non trovato, impossibile completare logout federato');
    return;
  }

  // // 1. Apri nuova finestra per logout OpenSearch
  // const osLogoutWindow = window.open('https://172.17.0.1:5601/auth/openid/logout', '_blank', 'width=500,height=500');

  // 3. Logout Keycloak (logout federato con redirect)
  const logoutURL = `https://172.17.0.1:8443/auth/realms/${realm}/protocol/openid-connect/logout` +
    `?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}` +
    `&id_token_hint=${idToken}`;

  // 4. Pulisci lo stato locale
  this.keycloakService.clearToken();
  
  // 5. Reindirizza al logout completo
  window.location.href = logoutURL;
}





  public redirectToProfile(): void{
    this.keycloakService.getKeycloakInstance().accountManagement();
  }
  public getRoles(): string[]{
    return this.keycloakService.getUserRoles();
  }
  public getName(): string{
    return this.keycloakService.getUsername() 
  }
}
