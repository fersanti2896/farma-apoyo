import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PosPageComponent } from './pages/pos-page/pos-page.component';

const routes: Routes = [
  { path: '', component: PosPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesRoutingModule { }
