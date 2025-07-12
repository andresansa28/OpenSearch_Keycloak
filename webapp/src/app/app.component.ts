import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title: string = 'OpenSearch Keycloak WebApp';
  
  constructor() { }

  ngOnInit() {
    // Angular Material non richiede configurazione globale come PrimeNG
  }
}

