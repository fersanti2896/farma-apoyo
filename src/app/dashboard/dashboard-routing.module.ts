import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutPageComponent } from './pages/layout-page/layout-page.component';

const routes: Routes = [
  { path: 'inicio', 
    component: LayoutPageComponent, 
    children: [
      { path: 'usuarios', loadChildren: () => import('../modules/usuarios/usuarios.module').then(m => m.UsuariosModule) },
      { path: 'proveedores', loadChildren: () => import('../modules/proveedores/proveedores.module').then(m => m.ProveedoresModule) },
      { path: 'productos', loadChildren: () => import('../modules/products/products.module').then(m => m.ProductsModule) },
      { path: 'compras', loadChildren: () => import('../modules/shopping/shopping.module').then(m => m.ShoppingModule) },
      { path: 'stock', loadChildren: () => import('../modules/inventory/inventory.module').then(m => m.InventoryModule) },
      { path: 'clientes', loadChildren: () => import('../modules/clientes/clientes.module').then(m => m.ClientesModule) },
      { path: '**', redirectTo: 'list' },
    ] 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
