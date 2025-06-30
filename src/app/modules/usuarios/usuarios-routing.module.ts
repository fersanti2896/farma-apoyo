import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';

const routes: Routes = [
  {
    path: '',
    component: ListPageComponent,
    // canActivate: [RoleGuard],
    // data: { roles: ['Administrador', 'Administrativo', 'Almacén'] }
  },
  {
    path: 'crear',
    component: CreatePageComponent,
    // canActivate: [RoleGuard],
    // data: { roles: ['Administrador', 'Administrativo', 'Almacén'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsuariosRoutingModule { }
