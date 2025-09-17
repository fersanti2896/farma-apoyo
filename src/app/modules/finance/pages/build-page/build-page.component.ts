import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Chart } from 'chart.js/auto';

import { jsPDF } from 'jspdf';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

import { FinanceService } from '../../services/finance.service';
import { FinanceBuildRequest, FinanceResumeRequest, FinanceResumeDTO } from '../../../interfaces/finance.interface';

@Component({
  selector: 'app-build-page',
  standalone: false,
  templateUrl: './build-page.component.html'
})
export class BuildPageComponent implements OnInit {
  public isLoading = false;
  public summaryData: { paymentMethod: string, totalAmount: number }[] = [];
  public filterForm: FormGroup;
  private chart: Chart | null = null;

  // Tabla de movimientos
  public resumeDisplayedColumns: string[] = ['saleId', 'paymentMethod', 'amount', 'paymentDate'];
  public resumeDataSource = new MatTableDataSource<FinanceResumeDTO>([]);
  public selectedMethod: string | null = null;
  public isLoadingResume = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
    this.loadResume(); // por defecto paymentMethod = null
  }

  ngAfterViewInit(): void {
    this.resumeDataSource.paginator = this.paginator;
    this.resumeDataSource.sort = this.sort;
  }

  // ---------- Cards / selección de método ----------
  selectMethod(method: string): void {
    this.selectedMethod = method;
    this.loadResume();
  }

  clearMethod(): void {
    this.selectedMethod = null;
    this.loadResume();
  }

  // ---------- Construcción (cards + gráfico) ----------
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

  // ---------- Tabla de movimientos ----------
  private buildResumeRequest(): FinanceResumeRequest {
    const { startDate, endDate } = this.filterForm.value;
    return {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      paymentMethod: this.selectedMethod ?? null as any
    };
  }

  loadResume(): void {
    const req = this.buildResumeRequest();
    this.isLoadingResume = true;

    this.financeService.financeResume(req).subscribe({
      next: (res) => {
        this.resumeDataSource.data = res.result ?? [];
        // Reiniciar paginación al cambiar filtro
        if (this.resumeDataSource.paginator) this.resumeDataSource.paginator.firstPage();
        this.isLoadingResume = false;
      },
      error: () => { this.resumeDataSource.data = []; this.isLoadingResume = false; }
    });
  }

  // ---------- Filtros (botón Filtrar) ----------
  filterSales(): void {
    this.loadBuild();
    this.loadResume();
  }

  // ---------- Gráfico ----------
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
          tooltip: { callbacks: { label: (ctx) => `$ ${ctx.parsed.y.toFixed(2)}` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => `$ ${value}` }
          }
        }
      }
    });
  }

  // ================== Exportar a PDF ==================
  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const start = new Date(this.filterForm.value.startDate);
      const end   = new Date(this.filterForm.value.endDate);

      const fechaInicio = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin    = end.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const filtroStr   = this.selectedMethod ? `Método: ${this.selectedMethod}` : 'Método: Todos';
      const fechaGeneracion = new Date().toLocaleString('es-MX');
      
      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Finanzas - Ingresos', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin} — ${filtroStr}`, pageWidth / 2, 38, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 42, { align: 'center' });

      // Columnas de tabla (coinciden con resumeDisplayedColumns)
      const columns = ['No. Ticket', 'Método', 'Monto', 'Fecha de Pago'];

      // Filas desde la data de la tabla
      const rows = this.resumeDataSource.data.map(r => ([
        r.saleId,
        r.paymentMethod,
        formatter.format(r.amount),
        new Date(r.paymentDate).toLocaleString('es-MX')
      ]));

      // Totales
      const totalRegistros = this.resumeDataSource.data.length;
      const totalMonto = this.resumeDataSource.data.reduce((acc, r) => acc + (r.amount || 0), 0);

      rows.push([
        'Total de registros:', totalRegistros.toString(), formatter.format(totalMonto), ''
      ]);

      // Tabla
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 9 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' }, // No. Ticket
          2: { halign: 'right' },  // Monto
          3: { halign: 'center' }, // Fecha de Pago
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      // --- Nueva página con el GRÁFICO ---
      const canvas = document.getElementById('financeChart') as HTMLCanvasElement | null;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png', 1.0);
        doc.addPage();

        // Encabezado de la hoja del gráfico
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Gráfico: Monto por método de pago', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Del ${fechaInicio} al ${fechaFin} — ${filtroStr}`, pageWidth / 2, 28, { align: 'center' });

        // Ajustar imagen al ancho de página con márgenes
        const marginX = 15;
        const maxW = pageWidth - marginX * 2;
        // Mantiene proporción del canvas
        const aspect = canvas.height / canvas.width;
        const imgW = maxW;
        const imgH = imgW * aspect;

        doc.addImage(imgData, 'PNG', marginX, 40, imgW, imgH);
      }

      const nombreArchivo = `Finanzas_Ingresos_${this.selectedMethod ? this.selectedMethod : 'Todos'}_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };
  }

  // ================== Exportar a Excel ==================
  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    // Datos
    const dataToExport = this.resumeDataSource.data.map(r => ({
      'No. Ticket': r.saleId,
      'Método': r.paymentMethod,
      'Monto': r.amount,                     // numérico
      'Fecha de Pago': new Date(r.paymentDate) // date
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    // Formatos (C = Monto, D = Fecha)
    const range = XLSX.utils.decode_range(ws['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      const montoCell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })];
      const fechaCell = ws[XLSX.utils.encode_cell({ r: R, c: 3 })];

      if (montoCell) {
        montoCell.t = 'n';
        montoCell.z = '"$"#,##0.00';
      }
      if (fechaCell) {
        fechaCell.z = 'dd/mm/yyyy hh:mm';
      }
    }

    // Fila de totales al final
    const totalReg = this.resumeDataSource.data.length;
    const totalMonto = this.resumeDataSource.data.reduce((acc, r) => acc + (r.amount || 0), 0);

    const lastRow = (range.e.r ?? 0) + 2;
    XLSX.utils.sheet_add_aoa(ws, [[
      'Total de registros:', totalReg, totalMonto, ''
    ]], { origin: `A${lastRow}` });

    // Formatear celda del total de monto (col C)
    const totalMontoCell = XLSX.utils.encode_cell({ r: lastRow - 1, c: 2 });
    if (ws[totalMontoCell]) {
      ws[totalMontoCell].t = 'n';
      ws[totalMontoCell].z = '"$"#,##0.00';
    }

    const sheetName = `Ingresos_${this.selectedMethod ? this.selectedMethod : 'Todos'}`;
    const wb: XLSX.WorkBook = { Sheets: { [sheetName]: ws }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blob, `Finanzas_Ingresos_${this.selectedMethod ? this.selectedMethod : 'Todos'}_${date}.xlsx`);
  }

}
