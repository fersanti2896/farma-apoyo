import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginPageComponent } from './pages/login-page/login-page.component';
import { AuthGuestGuard } from './guards/auth-guest.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'login', component: LoginPageComponent, canActivate: [ AuthGuestGuard ] },
      { path: '**', redirectTo: 'login' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
