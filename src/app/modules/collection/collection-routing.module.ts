import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreditNotesCollectionComponent } from './pages/credit-notes-collection/credit-notes-collection.component';
import { HistoricalCollectionComponent } from './pages/historical-collection/historical-collection.component';
import { ListPageComponent } from './pages/list-page/list-page.component';
import { PaidCollectionComponent } from './pages/paid-collection/paid-collection.component';

const routes: Routes = [
  { path: 'historico', component: HistoricalCollectionComponent },
  { path: 'cobrar', component: ListPageComponent },
  { path: 'pagado', component: PaidCollectionComponent },
  { path: 'credito', component: CreditNotesCollectionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollectionRoutingModule { }
