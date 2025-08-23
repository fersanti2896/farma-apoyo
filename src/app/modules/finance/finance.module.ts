import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FinanceRoutingModule } from './finance-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { BuildPageComponent } from './pages/build-page/build-page.component';
import { ExpensesPageComponent } from './pages/expenses-page/expenses-page.component';

@NgModule({
  declarations: [
    BuildPageComponent,
    ExpensesPageComponent
  ],
  imports: [
    CommonModule,
    FinanceRoutingModule, 
    ReactiveFormsModule,
    SharedModule, 
  ]
})
export class FinanceModule { }
