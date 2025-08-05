import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BuildPageComponent } from './pages/build-page/build-page.component';

const routes: Routes = [
  { path: '', component: BuildPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule { }
