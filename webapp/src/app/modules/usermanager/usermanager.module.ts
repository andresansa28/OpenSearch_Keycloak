import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsermanagerRoutingModule } from './usermanager-routing.module';
import { PageComponent } from './page/page.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MaterialModule } from 'src/app/shared/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


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
export class UsermanagerModule {}
