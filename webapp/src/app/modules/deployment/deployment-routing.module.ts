import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DeploymentComponent } from './page/deploy.component';

@NgModule({
  imports: [RouterModule.forChild([
    {
      path: '',
      children: [
        {
          path: '',
          component: DeploymentComponent,
        },
      ],

    }
  ])],
  exports: [RouterModule]
})
export class DeploymentRoutingModule {
}
