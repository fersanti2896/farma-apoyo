import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CollectionRoutingModule } from './collection-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { SharedModule } from '../../shared/shared.module';
import { PackagingModule } from '../packaging/packaging.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { HistoricalCollectionComponent } from './pages/historical-collection/historical-collection.component';
import { PaidCollectionComponent } from './pages/paid-collection/paid-collection.component';
import { CreditNotesCollectionComponent } from './pages/credit-notes-collection/credit-notes-collection.component';
import { CancelSaleDialogComponent } from './components/cancel-sale-dialog/cancel-sale-dialog.component';
import { MultiplePaymentDialogComponent } from './components/multiple-payment-dialog/multiple-payment-dialog.component';
import { PaymentsHistoryDialogComponent } from './components/payments-history-dialog/payments-history-dialog.component';
import { DetailsCreditNoteComponent } from './components/details-credit-note/details-credit-note.component';
import { ConfirmNoteCreditComponent } from './components/confirm-note-credit/confirm-note-credit.component';

@NgModule({
  declarations: [
    ListPageComponent,
    HistoricalCollectionComponent,
    PaidCollectionComponent,
    CreditNotesCollectionComponent,
    CancelSaleDialogComponent,
    MultiplePaymentDialogComponent,
    PaymentsHistoryDialogComponent,
    DetailsCreditNoteComponent,
    ConfirmNoteCreditComponent
  ],
  imports: [
    CommonModule,
    CollectionRoutingModule,
    DeliveriesModule,
    PackagingModule,
    SharedModule,
    ReactiveFormsModule,
  ],
  exports: [
    DetailsCreditNoteComponent,
    ConfirmNoteCreditComponent
  ]
})
export class CollectionModule { }
