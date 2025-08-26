import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreatePageComponent } from './pages/create-page/create-page.component';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { MyClientsComponent } from './pages/my-clients/my-clients.component';

const routes: Routes = [
  { path: 'list', component: ListPageComponent },
  { path: 'list/crear', component: CreatePageComponent },
  { path: 'list/editar', component: CreatePageComponent },
  { path: 'my-list', component: MyClientsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientesRoutingModule { }
