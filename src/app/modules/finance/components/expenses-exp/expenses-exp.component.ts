import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';

import { jsPDF } from 'jspdf';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

import { CreateExpenseDialogComponent } from '../create-expense-dialog/create-expense-dialog.component';
import { ExpenseHistoricalRequest, ExpensePaymentDTO, ExpensesCategoriesDTO } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../services/finance.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'finance-expenses-exp',
  standalone: false,
  templateUrl: './expenses-exp.component.html'
})
export class ExpensesExpComponent {
  public isLoading = false;
  public filterForm!: FormGroup;
  public categories: ExpensesCategoriesDTO[] = [];

  public dataHistorical: ExpensePaymentDTO[] = [];
  public dataToPay: ExpensePaymentDTO[] = [];
  public dataPaid: ExpensePaymentDTO[] = [];

  public paymentMethods = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Tarjeta', label: 'Tarjeta' },
    { value: 'Pago Cuenta de Tercero', label: 'Pago Cuenta de Tercero' }
  ];

  public displayedColumns: string[] = ['expensePaymentId', 'expenseCategory', 'comments', 'amount', 'paymentMethod', 'paymentDate'];
  public dataSource = new MatTableDataSource<ExpensePaymentDTO>([]);

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
    this.loadCategories();
    this.loadExpenses();
  }

  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm = this.fb.group({
      startDate: [twoMonthsAgo],
      endDate: [today],
      expenseCategoryId: [null],
      paymentMethod: [null]
    });
  }

  loadCategories(): void {
    this.financeService.expenseCategories().subscribe({
      next: (res) => { if (res.result) this.categories = res.result; }
    });
  }

  filterExpenses() {
    this.loadExpenses();
  }

  clearFilters() {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm.patchValue({
      startDate: twoMonthsAgo,
      endDate: today,
      expenseCategoryId: null,
      paymentMethod: null
    });

    this.loadExpenses();
  }

  loadExpenses(): void {
    const { startDate, endDate, expenseCategoryId, paymentMethod } = this.filterForm.value;

    const payload: ExpenseHistoricalRequest = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      expenseCategoryId: expenseCategoryId ?? null as any,
      paymentMethod: paymentMethod ?? null as any
    };

    this.isLoading = true;

    this.financeService.expensesPayments(payload).subscribe({
      next: (res) => {
        const data = (res.result ?? []) as ExpensePaymentDTO[];
        this.dataSource.data = data;

        // filtro por texto
        this.dataSource.filterPredicate = (item, filter) => (`
          ${item.expensePaymentId} ${item.expenseCategory} ${item.comments}
          ${item.amount} ${item.paymentMethod} ${item.paymentDate}
        `).toLowerCase().includes(filter.trim().toLowerCase());

        // paginador y sort
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
        });

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar gastos.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  applyFilter(e: Event): void {
    const v = (e.target as HTMLInputElement).value || '';
    this.dataSource.filter = v.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openCreateExpense(): void {
    const dialogRef = this.dialog.open(CreateExpenseDialogComponent, {
      width: '520px',
      data: {
        categories: this.categories,
        paymentMethods: this.paymentMethods
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res?.created) {
        this.snackBar.open('Gasto registrado correctamente.', 'Cerrar', { duration: 3000, panelClass: 'snack-success' });
        this.loadExpenses();
      }
    });
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const currency = new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });

    // Etiquetas legibles para filtros
    const { startDate, endDate, expenseCategoryId, paymentMethod } = this.filterForm.value;

    const catLabel =
      expenseCategoryId != null
        ? (this.categories.find(c => c.expenseCategoryId === expenseCategoryId)?.name ?? 'Categoría')
        : 'Todas las categorías';

    const methodLabel =
      paymentMethod != null
        ? (this.paymentMethods.find(m => m.value === paymentMethod)?.label ?? paymentMethod)
        : 'Todos los métodos';

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      // Fechas
      const start = new Date(startDate);
      const endDt = new Date(endDate);
      const fechaInicio = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin = endDt.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaGeneracion = new Date().toLocaleString('es-MX');
      const filtroStr = `Categoría: ${catLabel} — Método: ${methodLabel}`;

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      doc.text('Finanzas - Gastos', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin} — ${filtroStr}`, pageWidth / 2, 38, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 42, { align: 'center' });

      // Columnas (coinciden con lo que quieres ver en pantalla)
      const columns = ['ID', 'Categoría', 'Monto', 'Método de Pago', 'Fecha de Pago'];

      // Filas desde el datasource de la tabla
      const rows = this.dataSource.data.map((r) => ([
        r.expensePaymentId,
        r.expenseCategory ?? '',
        currency.format(r.amount ?? 0),
        r.paymentMethod ?? '',
        r.paymentDate ? new Date(r.paymentDate).toLocaleString('es-MX') : ''
      ]));

      // Totales
      const totalRegistros = this.dataSource.data.length;
      const totalMonto = this.dataSource.data.reduce((acc, r) => acc + (r.amount || 0), 0);

      rows.push([
        'Total de registros:', totalRegistros.toString(), currency.format(totalMonto), '', ''
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
          0: { halign: 'center', cellWidth: 18 }, // ID
          1: { cellWidth: 60 },                   // Categoría
          2: { halign: 'right', cellWidth: 28 },  // Monto
          3: { cellWidth: 42 },                   // Método
          4: { halign: 'center', cellWidth: 38 }, // Fecha
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      // --- Segunda página con gráfico (opcional) ---
      // Si tienes un canvas con id="expensesChart", lo agregamos como imagen
      const canvas = document.getElementById('expensesChart') as HTMLCanvasElement | null;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png', 1.0);
        doc.addPage();

        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('Gráfico: Monto por método de pago', pageWidth / 2, 20, { align: 'center' });

        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Del ${fechaInicio} al ${fechaFin} — ${filtroStr}`, pageWidth / 2, 28, { align: 'center' });

        const marginX = 15;
        const maxW = pageWidth - marginX * 2;
        const aspect = canvas.height / canvas.width;
        const imgW = maxW;
        const imgH = imgW * aspect;

        doc.addImage(imgData, 'PNG', marginX, 40, imgW, imgH);
      }

      const nombreArchivo =
        `Finanzas_Gastos_${(catLabel || 'Todas')}_${(methodLabel || 'Todos')}_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };

    // fallback en caso de que la imagen falle por caché
    logoImg.onerror = () => {
      (logoImg.onload as any)();
    };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // Etiquetas para filtros (para nombrar la hoja/archivo)
    const { expenseCategoryId, paymentMethod } = this.filterForm.value;
    const catLabel =
      expenseCategoryId != null
        ? (this.categories.find(c => c.expenseCategoryId === expenseCategoryId)?.name ?? 'Categoría')
        : 'Todas';
    const methodLabel =
      paymentMethod != null
        ? (this.paymentMethods.find(m => m.value === paymentMethod)?.label ?? paymentMethod)
        : 'Todos';

    // 1) Mapeo de datos (coincide con columnas visibles)
    const dataToExport = this.dataSource.data.map(r => ({
      'ID': r.expensePaymentId,
      'Categoría': r.expenseCategory,
      'Comentarios': r.comments ?? '',
      'Monto': r.amount,                                // numérico
      'Método de Pago': r.paymentMethod,
      'Fecha de Pago': r.paymentDate ? new Date(r.paymentDate) : null // date
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    // 2) Formatos: Col D = Monto, Col F = Fecha
    const range = XLSX.utils.decode_range(ws['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      const montoCell = ws[XLSX.utils.encode_cell({ r: R, c: 3 })]; // D
      const fechaCell = ws[XLSX.utils.encode_cell({ r: R, c: 5 })]; // F

      if (montoCell) {
        montoCell.t = 'n';
        montoCell.z = '"$"#,##0.00';
      }
      if (fechaCell) {
        fechaCell.z = 'dd/mm/yyyy hh:mm';
      }
    }

    // 3) Fila de totales
    const totalReg = this.dataSource.data.length;
    const totalMonto = this.dataSource.data.reduce((acc, r) => acc + (r.amount || 0), 0);

    const lastRow = (range.e.r ?? 0) + 2; // una fila vacía + totales
    XLSX.utils.sheet_add_aoa(ws, [[
      'Total de registros:', totalReg, '', totalMonto, '', ''
    ]], { origin: `A${lastRow}` });

    // Formato de la celda de total (col D)
    const totalMontoCell = XLSX.utils.encode_cell({ r: lastRow - 1, c: 3 });
    if (ws[totalMontoCell]) {
      ws[totalMontoCell].t = 'n';
      ws[totalMontoCell].z = '"$"#,##0.00';
    }

    // 4) Generar y descargar
    const sheetName = `Gastos_${catLabel}_${methodLabel}`;
    const wb: XLSX.WorkBook = { Sheets: { [sheetName]: ws }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blob, `Finanzas_Gastos_${catLabel}_${methodLabel}_${date}.xlsx`);
  }
}
