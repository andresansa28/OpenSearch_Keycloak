import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/shared/guards/auth.guard';
import { ThreatComponent } from './page/threat.component';

const routes: Routes = [
  {
    path: '',
    component: ThreatComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ThreatComponent
      }
    ],
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ThreatRoutingModule { }
