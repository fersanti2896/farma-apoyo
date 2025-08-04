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

@NgModule({
  declarations: [
    ListPageComponent,
    HistoricalCollectionComponent,
    PaidCollectionComponent,
    CreditNotesCollectionComponent
  ],
  imports: [
    CommonModule,
    CollectionRoutingModule,
    DeliveriesModule,
    PackagingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class CollectionModule { }
