import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListPageComponent } from './pages/list-page/list-page.component';

const routes: Routes = [
  { path: '', component: ListPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollectionRoutingModule { }
