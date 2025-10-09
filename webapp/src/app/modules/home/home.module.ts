import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { CardModule } from "primeng/card";
import { MaterialModule } from 'src/app/shared/material-module';
import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./pages/dashboard/dashboard.component";
import { Top10Component } from './pages/tables/top10/top10.component';
import { UniqueIpContainerComponent } from './pages/tables/unique-ip-container/unique-ip-container.component';



@NgModule({
  declarations: [
    HomeComponent,
    UniqueIpContainerComponent,
    Top10Component,
    // Qui verranno aggiunti i nuovi componenti tabella man mano che vengono creati
    // Esempio: NmapScansComponent, ThreatIntelligenceComponent, etc.
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HomeRoutingModule,
    CardModule,
    NgxPermissionsModule.forChild(),
    MaterialModule
  ],
})
export class HomeModule {
}
