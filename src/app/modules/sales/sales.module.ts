import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalesRoutingModule } from './sales-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { PosPageComponent } from './pages/pos-page/pos-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductDialogComponent } from './components/product-dialog/product-dialog.component';
import { SalesAlertDialogComponent } from './components/sales-alert-dialog/sales-alert-dialog.component';


@NgModule({
  declarations: [
    PosPageComponent,
    ProductDialogComponent,
    SalesAlertDialogComponent
  ],
  imports: [
    CommonModule,
    SalesRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class SalesModule { }
