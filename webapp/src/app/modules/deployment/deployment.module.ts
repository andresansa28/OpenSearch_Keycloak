import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {NgxPermissionsModule} from 'ngx-permissions';
import { DeploymentRoutingModule } from './deployment-routing.module';
import { DeploymentComponent } from './page/page.component';

import { FormsModule } from '@angular/forms';

import { MatSnackBarModule } from '@angular/material/snack-bar'
import { ReactiveFormsModule } from '@angular/forms';
import {MatInputModule} from '@angular/material/input';


import { MaterialModule } from 'src/app/shared/material-module';

@NgModule({
  declarations: [DeploymentComponent],
  imports: [
    CommonModule,
    DeploymentRoutingModule,
    ReactiveFormsModule,
    MaterialModule,
    FormsModule,
    MatSnackBarModule,
    MatInputModule,
    NgxPermissionsModule.forChild()
  ],
})
export class DeploymentModule {

}
