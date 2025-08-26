import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ClientesRoutingModule } from './clientes-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { ListPageComponent } from './pages/list-page/list-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';
import { MyClientsComponent } from './pages/my-clients/my-clients.component';

@NgModule({
  declarations: [
    ListPageComponent,
    CreatePageComponent,
    MyClientsComponent
  ],
  imports: [
    CommonModule,
    ClientesRoutingModule, 
    ReactiveFormsModule,
    SharedModule
  ]
})
export class ClientesModule { }
