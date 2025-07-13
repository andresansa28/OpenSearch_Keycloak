import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KeycloakAngularModule, KeycloakBearerInterceptor, KeycloakService } from "keycloak-angular";
import { NgxPermissionsModule } from 'ngx-permissions';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppLayoutModule } from "./shared/layout/app.layout.module";
import { MaterialModule } from './shared/material-module';
import { AuthService } from "./shared/services/authService";

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        realm: "ICSConsole",
        url: "https://172.17.0.1:8443/auth",
        clientId: "webapp"
      },

      initOptions: {
        pkceMethod: 'S256',
        // must match to the configured value in keycloak
        redirectUri: 'http://localhost:5002',
        // this will solved the error
        checkLoginIframe: false
      }
    });
}
@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    KeycloakAngularModule,
    AppLayoutModule,
    AppRoutingModule,
    MaterialModule,
    NgxPermissionsModule.forRoot(),
    BrowserAnimationsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true
    },
    AuthService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
