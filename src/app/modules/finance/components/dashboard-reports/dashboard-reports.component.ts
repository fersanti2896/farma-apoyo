import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Chart } from 'chart.js/auto';

import { FinanceBuildRequest } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'finace-dashboard-reports',
  standalone: false,
  templateUrl: './dashboard-reports.component.html'
})
export class DashboardReportsComponent {
  public isLoading: boolean = false;
  public filterForm!: FormGroup;

  // Para reporte Ingresos vs Gastos-Costos
  public displayedColumns: string[] = [
    'metodoPago', 'totalIngresos', 'totalCostos', 'totalGastos', 'utilidadBruta', 'utilidadNeta'
  ];
  public dataSource = new MatTableDataSource<any>([]);
  private chart: Chart | null = null;

  // Para reporte de Ventas por vendedor
  public displayedColumnsVendedores: string[] = [
    'vendedor', 'totalVentas', 'totalMontoVendido', 'totalCostoProveedor', 'utilidad'
  ];
  public dataSourceVendedores = new MatTableDataSource<any>([]);
  private chartVendedores: Chart | null = null;

  // Para el reporte de Productos vendidos
  public displayedColumnsProductos: string[] = [
    'productName', 'totalUnidadesVendidas'
  ];
  public dataSourceProductos = new MatTableDataSource<any>([]);
  private chartProductos: Chart | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private financeService: FinanceService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.initFilters();
    this.loadReports();
  }

  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm = this.fb.group({
      startDate: [twoMonthsAgo],
      endDate: [today],
    });
  }

  loadReports(): void {
    const formValue = this.filterForm.value;
    const data: FinanceBuildRequest = {
      startDate: formValue.startDate,
      endDate: formValue.endDate
    };

    this.isLoading = true;

    this.financeService.reportFinanceHistorical( data ).subscribe({
      next: (res) => {
        const rows = res.result || [];

        // Excluir TOTAL GENERAL de la gráfica, pero dejarlo en tabla
        this.dataSource.data = rows;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.renderChart(rows.filter(r => r.metodoPago !== 'TOTAL GENERAL'));
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });

    // Este es reporte de Ventas por Vendedor Compilado
    this.financeService.reporteSalesVendedorHistorical(data).subscribe({
      next: (res) => {
        const rows = res.result || [];
        this.dataSourceVendedores.data = rows;

        setTimeout(() => {
          if (this.paginator) this.dataSourceVendedores.paginator = this.paginator;
          if (this.sort) this.dataSourceVendedores.sort = this.sort;
        });

        this.renderChartVendedores(rows);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });

    // Este es reporte de Productos Vendidos
    this.financeService.reportProductHistorical(data).subscribe({
      next: (res) => {
        const rows = res.result || [];
        this.dataSourceProductos.data = rows;

        setTimeout(() => {
          if (this.paginator) this.dataSourceProductos.paginator = this.paginator;
          if (this.sort) this.dataSourceProductos.sort = this.sort;
        });

        this.renderChartProductos(rows);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });

  }

  filterReports(): void {
    this.loadReports();
  }

  clearFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm.patchValue({
      startDate: twoMonthsAgo,
      endDate: today
    });

    this.loadReports();
  }

  renderChart(data: any[]): void {
    const ctx = document.getElementById('reportChart') as HTMLCanvasElement;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(r => r.metodoPago),
        datasets: [
          {
            label: 'Ingresos',
            data: data.map(r => r.totalIngresos),
            backgroundColor: '#34d399'
          },
          {
            label: 'Costos',
            data: data.map(r => r.totalCostos),
            backgroundColor: '#60a5fa'
          },
          {
            label: 'Gastos',
            data: data.map(r => r.totalGastos),
            backgroundColor: '#f87171'
          },
          {
            label: 'Utilidad Neta',
            data: data.map(r => r.utilidadNeta),
            backgroundColor: '#fbbf24'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y}` } }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  renderChartVendedores(data: any[]): void {
    const ctx = document.getElementById('reportChartVendedores') as HTMLCanvasElement;

    if (this.chartVendedores) {
      this.chartVendedores.destroy();
    }

    this.chartVendedores = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(r => r.vendedor),
        datasets: [
          {
            label: 'Total Ventas (tickets)',
            data: data.map(r => r.totalVentas),
            backgroundColor: '#60a5fa'
          },
          {
            label: 'Monto Vendido',
            data: data.map(r => r.totalMontoVendido),
            backgroundColor: '#34d399'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}` } }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  renderChartProductos(data: any[]): void {
    const ctx = document.getElementById('reportChartProductos') as HTMLCanvasElement;

    if (this.chartProductos) {
      this.chartProductos.destroy();
    }

    this.chartProductos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(r => r.productName),
        datasets: [
          {
            label: 'Unidades Vendidas',
            data: data.map(r => r.totalUnidadesVendidas),
            backgroundColor: '#60a5fa'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}` } }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}
