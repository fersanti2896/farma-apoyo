import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutPageComponent } from './pages/layout-page/layout-page.component';

const routes: Routes = [
  { path: 'inicio', 
    component: LayoutPageComponent, 
    children: [
      { path: 'usuarios', loadChildren: () => import('../modules/usuarios/usuarios.module').then(m => m.UsuariosModule) },
      { path: 'proveedores', loadChildren: () => import('../modules/proveedores/proveedores.module').then(m => m.ProveedoresModule) },
      { path: '**', redirectTo: 'list' },
    ] 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
