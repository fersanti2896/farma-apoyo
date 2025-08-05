import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ListPageComponent } from './pages/list-page/list-page.component';
import { ReturnsRoutingModule } from './returns-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ConfirmDevolutionDialogComponent } from './components/confirm-devolution-dialog/confirm-devolution-dialog.component';

@NgModule({
  declarations: [
    ListPageComponent,
    ConfirmDevolutionDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ReturnsRoutingModule, 
    SharedModule, 
  ]
})
export class ReturnsModule { }
