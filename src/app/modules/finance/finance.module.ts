import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FinanceRoutingModule } from './finance-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { BuildPageComponent } from './pages/build-page/build-page.component';
import { ExpensesPageComponent } from './pages/expenses-page/expenses-page.component';
import { CostsExpComponent } from './components/costs-exp/costs-exp.component';
import { ExpensesExpComponent } from './components/expenses-exp/expenses-exp.component';
import { CostHistoricalTableComponent } from './components/cost-historical-table/cost-historical-table.component';
import { CostToPayTableComponent } from './components/cost-to-pay-table/cost-to-pay-table.component';
import { CostPaidTableComponent } from './components/cost-paid-table/cost-paid-table.component';
import { ConfirmPaymentEntryDialogComponent } from './components/confirm-payment-entry-dialog/confirm-payment-entry-dialog.component';
import { CollectionModule } from '../collection/collection.module';

@NgModule({
  declarations: [
    BuildPageComponent,
    ExpensesPageComponent,
    CostsExpComponent,
    ExpensesExpComponent,
    CostHistoricalTableComponent,
    CostToPayTableComponent,
    CostPaidTableComponent,
    ConfirmPaymentEntryDialogComponent
  ],
  imports: [
    CommonModule,
    FinanceRoutingModule, 
    ReactiveFormsModule,
    CollectionModule,
    SharedModule, 
  ]
})
export class FinanceModule { }
