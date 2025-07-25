import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreatRoutingModule } from './threat-routing.module';
import { ThreatComponent } from './page/threat.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MaterialModule } from 'src/app/shared/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ThreatComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ThreatRoutingModule,
    NgxPermissionsModule.forChild(),
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ThreatModule {}
