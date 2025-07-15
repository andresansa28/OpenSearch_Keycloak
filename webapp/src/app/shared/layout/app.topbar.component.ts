import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { KeycloakService } from "keycloak-angular";
import { KeycloakTokenParsed } from 'keycloak-js';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AnalyzerStatusService } from 'src/app/services/analyzer-status.service';
import { AuthService } from '../services/authService';
import { LayoutService } from "./service/app.layout.service";


@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html',
  styleUrls: ['./app.topbar.component.css']
})
export class AppTopBarComponent implements OnInit, OnDestroy {

  analyzerRunning: boolean = false;

  items!: MenuItem[];
  
  name! : string;

  private statusSubscription: Subscription | null = null;

  @ViewChild('menubutton') menuButton!: ElementRef;

  @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

  @ViewChild('topbarmenu') menu!: ElementRef;

  constructor(public layoutService: LayoutService,
    private keycloakService: KeycloakService,
    private authService: AuthService,
    private analyzerStatusService: AnalyzerStatusService
  
    ) {
  }
  
  ngOnInit(): void {
    const token : KeycloakTokenParsed = this.authService.getLoggedUser()!;
    this.name = token['preferred_username'];
    console.log(token);
    
    // Inizia il monitoraggio dello stato dell'analyzer
    this.analyzerStatusService.startMonitoring();
    
    // Sottoscrivi agli aggiornamenti dello stato
    this.statusSubscription = this.analyzerStatusService.isRunning$.subscribe(
      (isRunning: boolean) => {
        this.analyzerRunning = isRunning;
      }
    );
  }
  
  ngOnDestroy(): void {
    // Ferma il monitoraggio
    this.analyzerStatusService.stopMonitoring();
    
    // Pulisci la subscription
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
  
  logout() {
    this.authService.logout()
  }
  
  
 
}
