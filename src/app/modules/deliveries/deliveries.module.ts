import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeliveriesRoutingModule } from './deliveries-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { SharedModule } from '../../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { PackagingModule } from '../packaging/packaging.module';
import { AssignmentDeliveryComponent } from './components/assignment-delivery/assignment-delivery.component';


@NgModule({
  declarations: [
    ListPageComponent,
    AssignmentDeliveryComponent
  ],
  imports: [
    CommonModule,
    DeliveriesRoutingModule, 
    SharedModule,
    PackagingModule,
    ReactiveFormsModule
  ]
})
export class DeliveriesModule { }
