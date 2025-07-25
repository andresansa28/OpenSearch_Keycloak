import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/shared/guards/auth.guard';
import { PageComponent } from './page/usermanager.component';

const routes: Routes = [
  {
    path: '',
    component: PageComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['admin'],
      permissions: {
        only: "admin"
      }
    },
    children: [
      {
        path: '',
        component: PageComponent
      }
    ],
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsermanagerRoutingModule { }
