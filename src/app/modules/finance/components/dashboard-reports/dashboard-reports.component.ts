import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Chart } from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

import { FinanceBuildRequest, ReportFinanceDTO, ReportProductDTO, ReportSalesVendedorDTO } from '../../../interfaces/finance.interface';
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

    this.financeService.reportFinanceHistorical(data).subscribe({
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
        console.log(res)
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

  exportToPDFFinance(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const data: ReportFinanceDTO[] = this.dataSource.data ?? [];

    const currency = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const start: Date = this.filterForm.value.startDate;
      const end: Date = this.filterForm.value.endDate;

      const fechaInicio = new Date(start).toLocaleDateString('es-MX');
      const fechaFin = new Date(end).toLocaleDateString('es-MX');
      const fechaGeneracion = new Date().toLocaleString('es-MX');

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Reporte de Ingresos vs Costos - Gastos', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 34, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 40, { align: 'center' });

      // Columnas y filas
      const columns = [
        'Método de Pago',
        'Ingresos',
        'Costos',
        'Gastos',
        'Utilidad Bruta',
        'Utilidad Neta'
      ];

      const rows = data.map(r => ([
        r.metodoPago,
        currency.format(r.totalIngresos ?? 0),
        currency.format(r.totalCostos ?? 0),
        currency.format(r.totalGastos ?? 0),
        currency.format(r.utilidadBruta ?? 0),
        currency.format(r.utilidadNeta ?? 0),
      ]));

      // Tabla principal
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 50,
        margin: { bottom: 20 },
        styles: { fontSize: 9 },
        headStyles: { halign: 'center', fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { halign: 'right', cellWidth: 35 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 35 },
          4: { halign: 'right', cellWidth: 35 },
          5: { halign: 'right', cellWidth: 40 },
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      try {
        const chartCanvas = document.getElementById('reportChart') as HTMLCanvasElement;

        if (chartCanvas) {
          const chartImage = chartCanvas.toDataURL('image/png', 1.0);
          const chartWidth = pageWidth - 40;
          const chartHeight = 80;

          const startY = (doc as any).lastAutoTable.finalY + 10;
          doc.addImage(chartImage, 'PNG', 20, startY, chartWidth, chartHeight);
        } else {
          console.warn('No se encontró el canvas con id="reportChart".');
        }
      } catch (err) {
        console.error('Error al agregar gráfico al PDF:', err);
      }

      const nombreArchivo = `Reporte_Finanzas_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };

    logoImg.onerror = () => { (logoImg.onload as any)(); };
  }

  exportToExcelFinance(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const data: ReportFinanceDTO[] = this.dataSource.data ?? [];

    if (!data.length) return;

    // Mapeo de filas
    const dataToExport = data.map(r => ({
      'Método de Pago': r.metodoPago,
      'Ingresos': r.totalIngresos,
      'Costos': r.totalCostos,
      'Gastos': r.totalGastos,
      'Utilidad Bruta': r.utilidadBruta,
      'Utilidad Neta': r.utilidadNeta
    }));

    // Crear hoja Excel
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

    // 🔢 Formato de moneda MXN
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = 1; C <= 5; ++C) { // Columnas numéricas
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) {
          cell.t = 'n'; // tipo numérico
          cell.z = '"MX$"#,##0.00'; // formato moneda
        }
      }
    }

    // Encabezado adicional (Fechas)
    const start: Date = this.filterForm.value.startDate;
    const end: Date = this.filterForm.value.endDate;

    // Ajuste de anchos de columnas
    worksheet['!cols'] = [
      { wch: 25 }, // Método de pago
      { wch: 15 }, // Ingresos
      { wch: 15 }, // Costos
      { wch: 15 }, // Gastos
      { wch: 18 }, // Utilidad Bruta
      { wch: 18 }  // Utilidad Neta
    ];

    // 🗂️ Crear libro y guardar
    const sheetName = 'Finanzas';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Reporte_Finanzas_${date}.xlsx`);
  }

  exportToPDFVendedores(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const data: ReportSalesVendedorDTO[] = this.dataSourceVendedores.data ?? [];

    const currency = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const start: Date = this.filterForm.value.startDate;
      const end: Date = this.filterForm.value.endDate;

      const fechaInicio = new Date(start).toLocaleDateString('es-MX');
      const fechaFin = new Date(end).toLocaleDateString('es-MX');
      const fechaGeneracion = new Date().toLocaleString('es-MX');

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Reporte de Ventas por Vendedor', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 34, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 40, { align: 'center' });

      // Columnas y filas
      const columns = [
        'Vendedor',
        'Total Ventas (tickets)',
        'Monto Vendido',
        'Costo Proveedor',
        'Utilidad'
      ];

      const rows = data.map(r => ([
        r.vendedor,
        r.totalVentas,
        currency.format(r.totalMontoVendido ?? 0),
        currency.format(r.totalCostoProveedor ?? 0),
        currency.format(r.utilidad ?? 0)
      ]));

      // Totales
      const totalVentas = data.reduce((a, b) => a + (b.totalVentas ?? 0), 0);
      const totalMonto = data.reduce((a, b) => a + (b.totalMontoVendido ?? 0), 0);
      const totalCosto = data.reduce((a, b) => a + (b.totalCostoProveedor ?? 0), 0);
      const totalUtilidad = data.reduce((a, b) => a + (b.utilidad ?? 0), 0);

      rows.push([
        'TOTAL GENERAL',
        totalVentas,
        currency.format(totalMonto),
        currency.format(totalCosto),
        currency.format(totalUtilidad)
      ]);

      // Tabla principal
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 50,
        margin: { bottom: 20 },
        styles: { fontSize: 9 },
        headStyles: { halign: 'center', fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { halign: 'right', cellWidth: 35 },
          2: { halign: 'right', cellWidth: 45 },
          3: { halign: 'right', cellWidth: 45 },
          4: { halign: 'right', cellWidth: 45 }
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      // Agregar gráfico debajo
      try {
        const chartCanvas = document.getElementById('reportChartVendedores') as HTMLCanvasElement;

        if (chartCanvas) {
          const chartImage = chartCanvas.toDataURL('image/png', 1.0);
          const chartWidth = pageWidth - 40;
          const chartHeight = 80;

          const startY = (doc as any).lastAutoTable.finalY + 10;
          doc.addImage(chartImage, 'PNG', 20, startY, chartWidth, chartHeight);
        } else {
          console.warn('No se encontró el canvas con id="reportChartVendedores".');
        }
      } catch (err) {
        console.error('Error al agregar gráfico al PDF:', err);
      }

      const nombreArchivo = `Reporte_Ventas_Vendedores_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };

    logoImg.onerror = () => { (logoImg.onload as any)(); };
  }

  exportToExcelVendedores(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const data: ReportSalesVendedorDTO[] = this.dataSourceVendedores.data ?? [];

    if (!data.length) {
      console.warn('⚠️ No hay datos para exportar.');
      return;
    }

    // Calcular totales
    const totalVentas = data.reduce((a, b) => a + (b.totalVentas ?? 0), 0);
    const totalMonto = data.reduce((a, b) => a + (b.totalMontoVendido ?? 0), 0);
    const totalCosto = data.reduce((a, b) => a + (b.totalCostoProveedor ?? 0), 0);
    const totalUtilidad = data.reduce((a, b) => a + (b.utilidad ?? 0), 0);

    // Mapeo de filas
    const dataToExport = data.map(r => ({
      'Vendedor': r.vendedor,
      'Total Ventas (Tickets)': r.totalVentas,
      'Monto Vendido': r.totalMontoVendido,
      'Costo Proveedor': r.totalCostoProveedor,
      'Utilidad': r.utilidad
    }));

    // Agregar fila de totales
    dataToExport.push({
      'Vendedor': 'TOTAL GENERAL',
      'Total Ventas (Tickets)': totalVentas,
      'Monto Vendido': totalMonto,
      'Costo Proveedor': totalCosto,
      'Utilidad': totalUtilidad
    });

    // Crear hoja Excel
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    // 🔢 Formatear las columnas de moneda
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = 2; C <= 4; ++C) { // columnas de monto
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) {
          cell.t = 'n';
          cell.z = '"MX$"#,##0.00';
        }
      }
    }

    const start: Date = this.filterForm.value.startDate;
    const end: Date = this.filterForm.value.endDate;

    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 30 }, // Vendedor
      { wch: 20 }, // Total Ventas
      { wch: 20 }, // Monto Vendido
      { wch: 20 }, // Costo Proveedor
      { wch: 20 }  // Utilidad
    ];

    const sheetName = 'VentasVendedores';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Reporte_Ventas_Vendedores_${date}.xlsx`);
  }

  exportToPDFProductos(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const data: ReportProductDTO[] = this.dataSourceProductos.data ?? [];

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const start: Date = this.filterForm.value.startDate;
      const end: Date = this.filterForm.value.endDate;

      const fechaInicio = new Date(start).toLocaleDateString('es-MX');
      const fechaFin = new Date(end).toLocaleDateString('es-MX');
      const fechaGeneracion = new Date().toLocaleString('es-MX');

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Reporte de Productos Vendidos', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 34, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 40, { align: 'center' });

      // Columnas
      const columns = ['Producto', 'Unidades Vendidas'];

      // Filas
      const rows = data.map(r => ([r.productName, r.totalUnidadesVendidas.toLocaleString('es-MX')]));

      // Total General
      const totalUnidades = data.reduce((a, b) => a + (b.totalUnidadesVendidas ?? 0), 0);
      rows.push(['TOTAL GENERAL', totalUnidades.toLocaleString('es-MX')]);

      // Tabla principal
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 50,
        margin: { bottom: 20 },
        styles: { fontSize: 9 },
        headStyles: { halign: 'center', fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { halign: 'right', cellWidth: 40 },
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        },
      });

      // Agregar gráfico de productos debajo de la tabla
      try {
        const chartCanvas = document.getElementById('reportChartProductos') as HTMLCanvasElement;
        if (chartCanvas) {
          const chartImage = chartCanvas.toDataURL('image/png', 1.0);
          const chartWidth = pageWidth - 40;
          const chartHeight = 80;
          const startY = (doc as any).lastAutoTable.finalY + 10;

          doc.addImage(chartImage, 'PNG', 20, startY, chartWidth, chartHeight);
        } else {
          console.warn('No se encontró el canvas con id="reportChartProductos".');
        }
      } catch (err) {
        console.error('Error al agregar gráfico al PDF:', err);
      }

      const nombreArchivo = `Reporte_Productos_Vendidos_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };

    logoImg.onerror = () => { (logoImg.onload as any)(); };
  }

  exportToExcelProductos(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const data: ReportProductDTO[] = this.dataSourceProductos.data ?? [];

    if (!data.length) {
      console.warn('No hay datos para exportar.');
      return;
    }

    // Calcular total general
    const totalUnidades = data.reduce((a, b) => a + (b.totalUnidadesVendidas ?? 0), 0);

    // Mapeo de datos para Excel
    const dataToExport = data.map(r => ({
      'Producto': r.productName,
      'Unidades Vendidas': r.totalUnidadesVendidas
    }));

    // Agregar fila de totales
    dataToExport.push({
      'Producto': 'TOTAL GENERAL',
      'Unidades Vendidas': totalUnidades
    });

    // Crear hoja
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    // Formatear columnas
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: 1 })]; // columna B (Unidades)
      if (cell) {
        cell.t = 'n';
        cell.z = '#,##0'; // formato numérico sin decimales
      }
    }

    // Encabezado superior
    const start: Date = this.filterForm.value.startDate;
    const end: Date = this.filterForm.value.endDate;

    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 40 }, // Producto
      { wch: 20 }  // Unidades Vendidas
    ];

    const sheetName = 'ProductosVendidos';
    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Reporte_Productos_Vendidos_${date}.xlsx`);
  }
}
