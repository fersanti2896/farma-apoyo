import { Component } from '@angular/core';

@Component({
  selector: 'app-expenses-page',
  standalone: false,
  templateUrl: './expenses-page.component.html'
})
export class ExpensesPageComponent {
  public selectedIndex = 0; // 0 = Costos, 1 = Gastos

  onTabChange(index: number): void {
    this.selectedIndex = index;
  }
}
