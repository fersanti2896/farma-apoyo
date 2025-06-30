import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductsRoutingModule } from './products-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';
import { SharedModule } from '../../shared/shared.module';
import { AssignProviderDialogComponent } from './components/assign-provider-dialog/assign-provider-dialog.component';

@NgModule({
  declarations: [
    ListPageComponent,
    CreatePageComponent,
    AssignProviderDialogComponent
  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class ProductsModule { }
