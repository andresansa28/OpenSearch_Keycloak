import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MaterialModule } from 'src/app/shared/material-module';
import { PageComponent } from './page/usermanager.component';
import { UsermanagerRoutingModule } from './usermanager-routing.module';


@NgModule({
  declarations: [
    PageComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    UsermanagerRoutingModule,
    NgxPermissionsModule.forChild(),
    FormsModule,
    ReactiveFormsModule
  ]
})
export class UsermanagerModule { }
