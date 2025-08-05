import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Chart } from 'chart.js/auto';

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
  public filterForm: FormGroup;
  private chart: Chart | null = null;

  constructor(
    private financeService: FinanceService,
    private fb: FormBuilder
  ) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm = this.fb.group({
      startDate: [firstDay],
      endDate: [lastDay]
    });
  }

  ngOnInit(): void {
    this.loadBuild();
  }

  loadBuild(): void {
    const formValue = this.filterForm.value;
    const data: FinanceBuildRequest = {
      startDate: formValue.startDate,
      endDate: formValue.endDate
    };

    this.isLoading = true;
    this.financeService.buildFinance(data).subscribe({
      next: (res) => {
        this.summaryData = res.result || [];
        this.isLoading = false;

        setTimeout(() => this.renderChart(), 0);
      },
      error: () => this.isLoading = false
    });
  }

  filterSales(): void {
    this.loadBuild();
  }

  renderChart(): void {
    const ctx = document.getElementById('financeChart') as HTMLCanvasElement;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
      ctx.getContext('2d')?.clearRect(0, 0, ctx.width, ctx.height);
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.summaryData.map(item => item.paymentMethod),
        datasets: [{
          label: 'Monto por método de pago',
          data: this.summaryData.map(item => item.totalAmount),
          backgroundColor: ['#34d399', '#60a5fa', '#f87171', '#fbbf24'],
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `$ ${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$ ${value}`
            }
          }
        }
      }
    });
  }

}

