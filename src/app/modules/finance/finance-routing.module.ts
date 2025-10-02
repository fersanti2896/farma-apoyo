import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BuildPageComponent } from './pages/build-page/build-page.component';
import { ExpensesPageComponent } from './pages/expenses-page/expenses-page.component';
import { ReportsPageComponent } from './pages/reports-page/reports-page.component';

const routes: Routes = [
  { path: 'ingresos', component: BuildPageComponent },
  { path: 'egresos', component: ExpensesPageComponent },
  { path: 'reportes', component: ReportsPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule { }
