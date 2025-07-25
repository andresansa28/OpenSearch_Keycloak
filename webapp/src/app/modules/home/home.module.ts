import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { CardModule } from "primeng/card";
import { MaterialModule } from 'src/app/shared/material-module';
import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./pages/dashboard/dashboard.component";

@NgModule({
  declarations: [HomeComponent],
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
