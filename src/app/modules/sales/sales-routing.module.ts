import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListSalesPersonComponent } from './pages/list-sales-person/list-sales-person.component';
import { PosPageComponent } from './pages/pos-page/pos-page.component';

const routes: Routes = [
  { path: '', component: PosPageComponent },
  { path: 'list', component: ListSalesPersonComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesRoutingModule { }
