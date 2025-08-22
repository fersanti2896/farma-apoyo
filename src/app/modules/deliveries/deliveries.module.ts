import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeliveriesRoutingModule } from './deliveries-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { SharedModule } from '../../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { PackagingModule } from '../packaging/packaging.module';
import { AssignmentDeliveryComponent } from './components/assignment-delivery/assignment-delivery.component';
import { MovementsDialogComponent } from './components/movements-dialog/movements-dialog.component';
import { CreditNoteDialogComponent } from './components/credit-note-dialog/credit-note-dialog.component';


@NgModule({
  declarations: [
    ListPageComponent,
    AssignmentDeliveryComponent,
    MovementsDialogComponent,
    CreditNoteDialogComponent
  ],
  imports: [
    CommonModule,
    DeliveriesRoutingModule, 
    SharedModule,
    PackagingModule,
    ReactiveFormsModule
  ], 
  exports: [
    MovementsDialogComponent
  ]
})
export class DeliveriesModule { }
