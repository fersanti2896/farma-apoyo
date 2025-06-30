import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProveedoresRoutingModule } from './proveedores-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';
import { SharedModule } from '../../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ListPageComponent,
    CreatePageComponent
  ],
  imports: [
    CommonModule,
    ProveedoresRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class ProveedoresModule { }
