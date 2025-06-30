import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [
    ListPageComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule, 
    SharedModule
  ]
})
export class InventoryModule { }
