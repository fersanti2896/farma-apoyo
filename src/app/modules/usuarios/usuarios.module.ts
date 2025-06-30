import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { UsuariosRoutingModule } from './usuarios-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ListPageComponent,
    CreatePageComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    UsuariosRoutingModule,
    ReactiveFormsModule,
  ]
})
export class UsuariosModule { }
