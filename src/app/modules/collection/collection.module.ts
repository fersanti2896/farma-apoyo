import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CollectionRoutingModule } from './collection-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { SharedModule } from '../../shared/shared.module';
import { PackagingModule } from '../packaging/packaging.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';

@NgModule({
  declarations: [
    ListPageComponent
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
