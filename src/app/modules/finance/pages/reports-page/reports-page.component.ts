import { Component } from '@angular/core';

@Component({
  selector: 'app-reports-page',
  standalone: false,
  templateUrl: './reports-page.component.html'
})
export class ReportsPageComponent {
  public selectedIndex = 0; // 0 = Costos, 1 = Gastos

  onTabChange(index: number): void {
    this.selectedIndex = index;
  }
}
