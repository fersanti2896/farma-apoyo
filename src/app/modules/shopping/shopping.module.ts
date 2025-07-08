import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShoppingRoutingModule } from './shopping-routing.module';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';
import { SharedModule } from '../../shared/shared.module';
import { ProductDialogComponent } from './components/product-dialog/product-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EntryDialogsComponent } from './components/entry-dialogs/entry-dialogs.component';


@NgModule({
  declarations: [
    ListPageComponent,
    CreatePageComponent,
    ProductDialogComponent,
    EntryDialogsComponent
  ],
  imports: [
    CommonModule,
    ShoppingRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class ShoppingModule { }
