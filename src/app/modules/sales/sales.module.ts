import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ListSalesPersonComponent } from './pages/list-sales-person/list-sales-person.component';
import { PackagingModule } from '../packaging/packaging.module';
import { PosPageComponent } from './pages/pos-page/pos-page.component';
import { ProductDialogComponent } from './components/product-dialog/product-dialog.component';
import { SalesAlertDialogComponent } from './components/sales-alert-dialog/sales-alert-dialog.component';
import { SalesRoutingModule } from './sales-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ListSalesPersonComponent,
    PosPageComponent,
    ProductDialogComponent,
    SalesAlertDialogComponent,
  ],
  imports: [
    CommonModule,
    PackagingModule,
    ReactiveFormsModule,
    SalesRoutingModule,
    SharedModule,
  ]
})
export class SalesModule { }
