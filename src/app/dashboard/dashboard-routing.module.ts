import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../auth/guards/auth.guard';
import { LayoutPageComponent } from './pages/layout-page/layout-page.component';

const routes: Routes = [
  { path: 'inicio', 
    component: LayoutPageComponent, 
    children: [
      { path: 'usuarios', 
        loadChildren: () => import('../modules/usuarios/usuarios.module').then(m => m.UsuariosModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1] } 
      },
      { path: 'proveedores', 
        loadChildren: () => import('../modules/proveedores/proveedores.module').then(m => m.ProveedoresModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2] } 
      },
      { path: 'productos', 
        loadChildren: () => import('../modules/products/products.module').then(m => m.ProductsModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2, 5] } 
      },
      { path: 'compras', 
        loadChildren: () => import('../modules/shopping/shopping.module').then(m => m.ShoppingModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2, 4] } 
      },
      { path: 'stock', 
        loadChildren: () => import('../modules/inventory/inventory.module').then(m => m.InventoryModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2, 4, 5] } 
      },
      { path: 'clientes', 
        loadChildren: () => import('../modules/clientes/clientes.module').then(m => m.ClientesModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2] } 
      },
      { path: 'ventas', 
        loadChildren: () => import('../modules/sales/sales.module').then(m => m.SalesModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2, 3, 4, 5] } 
      },
      { path: 'surtido', 
        loadChildren: () => import('../modules/packaging/packaging.module').then(m => m.PackagingModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2, 4] } 
      },
      { path: 'entregas', 
        loadChildren: () => import('../modules/deliveries/deliveries.module').then(m => m.DeliveriesModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2, 3, 4, 5, 6] } 
      },
      { path: 'cobranza', 
        loadChildren: () => import('../modules/collection/collection.module').then(m => m.CollectionModule),
        canActivate: [ AuthGuard ],
        data: { roles: [1, 2] } 
      },
      { path: '**', redirectTo: 'list' },
    ] 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
