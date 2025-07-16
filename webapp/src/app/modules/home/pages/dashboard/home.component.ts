import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ProvaOggetto} from "./models/dataChart.dto";
import {KeycloakService} from "keycloak-angular";
import {AuthService} from "../../../../shared/services/authService";
import {KeycloakProfile, KeycloakTokenParsed} from "keycloak-js";



@Component({
  selector: 'app-dashboard',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  qualcosa!: string;
  provaOggetto: ProvaOggetto[] = [];
  user!: KeycloakTokenParsed | undefined;
  roles!: string;
  name! : string;

  constructor(
    private _router: Router,
    private keycloakService: AuthService,
    private keycloaskS: KeycloakService
  ) {
  }

  async ngOnInit() {
  try {
    const token = await this.keycloaskS.getToken();  // ← parentesi () e await
    console.log('Access Token:', token);
  } catch (error) {
    console.error('Errore nel recupero del token:', error);
  }
}


}
