import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { PackagingRoutingModule } from './packaging-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { SharedModule } from '../../shared/shared.module';
import { TicketDialogComponent } from './components/ticket-dialog/ticket-dialog.component';
import { UpdateStatusDialogComponent } from './components/update-status-dialog/update-status-dialog.component';

@NgModule({
  declarations: [
    ListPageComponent,
    TicketDialogComponent,
    UpdateStatusDialogComponent
  ],
  imports: [
    CommonModule,
    PackagingRoutingModule,
    SharedModule, 
    ReactiveFormsModule
  ],
  exports: [
    TicketDialogComponent,
    UpdateStatusDialogComponent
  ]
})
export class PackagingModule { }
