import { Component, OnInit } from '@angular/core';
import { FinanceService } from '../../services/finance.service';
import { FinanceBuildRequest } from '../../../interfaces/finance.interface';

@Component({
  selector: 'app-build-page',
  standalone: false,
  templateUrl: './build-page.component.html'
})
export class BuildPageComponent implements OnInit {
  public isLoading: boolean = false;
  public summaryData: { paymentMethod: string, totalAmount: number }[] = [];

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadBuild();
  }

  loadBuild(): void {
    const data: FinanceBuildRequest = {
      startDate: '2025-08-01',
      endDate: '2025-08-31'
    };

    this.isLoading = true;
    this.financeService.buildFinance(data).subscribe({
      next: (res) => {
        this.summaryData = res.result || [];
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}

