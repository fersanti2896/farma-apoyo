import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { CostsHistoricalRequest, NotesSuppliersDTO } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../services/finance.service';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { SupplierDTO } from '../../../interfaces/supplier.interface';

@Component({
  selector: 'finance-costs-exp',
  standalone: false,
  templateUrl: './costs-exp.component.html',
})
export class CostsExpComponent {
  public isLoading = false;
  public filterForm!: FormGroup;
  public suppliers: SupplierDTO[] = [];
  public selectedIndex: number = 0;

  public dataHistorical: NotesSuppliersDTO[] = [];
  public dataToPay: NotesSuppliersDTO[] = [];
  public dataPaid: NotesSuppliersDTO[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private financeService: FinanceService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.initFilters();
    this.loadSuppliers();
    this.loadCostsForActiveTab();
  }

  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm = this.fb.group({
      startDate: [twoMonthsAgo],
      endDate: [today],
      supplierId: [null],
      statusId: [null]
    });
  }

  loadSuppliers(): void {
    this.proveedoresService.listSupliers().subscribe({
      next: (res) => { if (res.result) this.suppliers = res.result; }
    });
  }

  private getStatusByTab(index: number): number | null {
    if (index === 1) return 1; // Por pagar
    if (index === 2) return 2; // Pagado

    return null;               // Histórico
  }

  onTabChange(index: number): void {
    this.selectedIndex = index;
    this.loadCostsForActiveTab();
  }

  filterSales(): void {
    this.loadCostsForActiveTab();
  }

  clearFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm.patchValue({
      startDate: twoMonthsAgo,
      endDate: today,
      supplierId: null,
      statusId: null
    });

    this.loadCostsForActiveTab();
  }

  loadCostsForActiveTab(): void {
    const status = this.getStatusByTab(this.selectedIndex);
    this.loadCosts(status!);
  }

  loadCosts(status: number | undefined): void {
    this.isLoading = true;
    const { startDate, endDate, supplierId } = this.filterForm.value;

    const data: CostsHistoricalRequest = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      supplierId: supplierId || null,
      status: status
    };

    this.financeService.costesSuppliers(data).subscribe({
      next: (response) => {
        const result: NotesSuppliersDTO[] = response?.result ?? [];

        if (this.selectedIndex === 0) {
          this.dataHistorical = result;
        } else if (this.selectedIndex === 1) {
          this.dataToPay = result;
        } else {
          this.dataPaid = result;
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar costos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // dataset según la pestaña
    const datasetMap = [
      { name: 'Histórico', data: this.dataHistorical },
      { name: 'Por Pagar', data: this.dataToPay },
      { name: 'Pagado',    data: this.dataPaid },
    ];
    const { name: tabName, data } = datasetMap[this.selectedIndex] ?? datasetMap[0];

    // formateadores
    const currency = new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });

    // logo
    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      // Fechas del filtro
      const start: Date = this.filterForm.value.startDate;
      const end: Date = this.filterForm.value.endDate;
      const fechaInicio = new Date(start).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin = new Date(end).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaGeneracion = new Date().toLocaleString('es-MX');

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      doc.text(`Costos - ${tabName}`, pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 38, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 42, { align: 'center' });

      // Columnas
      const columns = [
        'ID', 'Proveedor', '# Factura', 'Total', 'Saldo Pendiente',
        'Fecha Creación', 'Fecha Pago', 'Estatus'
      ];

      // Rows
      const rows = (data ?? []).map((r) => ([
        r.entryId,
        r.businessName ?? '',
        r.invoiceNumber ?? '-',
        currency.format(r.totalAmount ?? 0),
        currency.format(r.amountPending ?? 0),
        r.entryDate ? new Date(r.entryDate).toLocaleString('es-MX') : '-',
        r.expectedPaymentDate ? new Date(r.expectedPaymentDate).toLocaleString('es-MX') : '-',
        r.statusName ?? ''
      ]));

      // Subtotales
      const totalAmount = (data ?? []).reduce((acc, cur) => acc + (cur.totalAmount ?? 0), 0);
      const totalPending = (data ?? []).reduce((acc, cur) => acc + (cur.amountPending ?? 0), 0);
      const totalRecords = (data ?? []).length;

      rows.push([
        'Total de registros:', totalRecords.toString(), 'Totales:', currency.format(totalAmount),
        currency.format(totalPending),
        '',  // mostramos saldo pendiente aquí
        '', ''
      ]);
      // Para incluir también el subtotal de "Total", agregamos una fila adicional:
      // rows.push(['', '', '', , '', '', '', '']);

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
          1: { cellWidth: 50 },                   // Proveedor
          2: { cellWidth: 28 },                   // # Factura
          3: { halign: 'right', cellWidth: 28 },  // Total
          4: { halign: 'right', cellWidth: 32 },  // Saldo Pendiente
          5: { cellWidth: 32 },                   // Fecha Creación
          6: { cellWidth: 32 },                   // Fecha Pago
          7: { cellWidth: 28 },                   // Estatus
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      const nombreArchivo = `Costos_${tabName.replace(/\s+/g, '')}_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };

    // Por si el logo falla en cargar por cache, forzamos un fallback sin imagen
    logoImg.onerror = () => {
      // Simula onload sin imagen
      (logoImg.onload as any)();
    };
  }

  exportToExcel(): void {
    const dateLabel = new Date().toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // dataset según la pestaña
    const datasetMap = [
      { name: 'Histórico', data: this.dataHistorical },
      { name: 'Por Pagar', data: this.dataToPay },
      { name: 'Pagado',    data: this.dataPaid },
    ];
    const { name: tabName, data } = datasetMap[this.selectedIndex] ?? datasetMap[0];

    // Orden de columnas
    const headers = [
      'ID', 'Proveedor', '# Factura', 'Total', 'Saldo Pendiente',
      'Fecha Creación', 'Fecha Pago', 'Estatus'
    ];

    // Mapea datos
    const dataToExport = (data ?? []).map(r => ({
      'ID': r.entryId,
      'Proveedor': r.businessName ?? '',
      '# Factura': r.invoiceNumber ?? '-',
      'Total': r.totalAmount ?? 0,
      'Saldo Pendiente': r.amountPending ?? 0,
      'Fecha Creación': r.entryDate ? new Date(r.entryDate) : null,
      'Fecha Pago': r.expectedPaymentDate ? new Date(r.expectedPaymentDate) : null,
      'Estatus': r.statusName ?? '',
    }));

    // Hoja
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      dataToExport,
      { header: headers, cellDates: true }
    );

    // Agregar fila de totales
    const totalAmount = (data ?? []).reduce((acc, cur) => acc + (cur.totalAmount ?? 0), 0);
    const totalPending = (data ?? []).reduce((acc, cur) => acc + (cur.amountPending ?? 0), 0);
    const totalRecords = (data ?? []).length;

    XLSX.utils.sheet_add_aoa(worksheet, [[
      'Total de registros:', totalRecords, 'Totales:',
      totalAmount, totalPending, '', '', ''
    ]], { origin: -1 }); // agrega al final

    // Aplicar formatos (moneda y fecha)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    // Índices de columnas (0-based) con base en headers:
    // 0 ID, 1 Proveedor, 2 # Factura, 3 Total, 4 Saldo Pendiente, 5 Fecha Creación, 6 Fecha Pago, 7 Estatus
    for (let R = 1; R <= range.e.r; ++R) {
      const totalCell           = worksheet[XLSX.utils.encode_cell({ r: R, c: 3 })]; // Total
      const pendingCell         = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })]; // Saldo Pendiente
      const fechaCreacionCell   = worksheet[XLSX.utils.encode_cell({ r: R, c: 5 })]; // Fecha Creación
      const fechaPagoCell       = worksheet[XLSX.utils.encode_cell({ r: R, c: 6 })]; // Fecha Pago

      if (totalCell)   { totalCell.t = 'n';   totalCell.z = '"$"#,##0.00'; }
      if (pendingCell) { pendingCell.t = 'n'; pendingCell.z = '"$"#,##0.00'; }
      if (fechaCreacionCell) { fechaCreacionCell.z = 'dd/mm/yyyy hh:mm'; }
      if (fechaPagoCell)     { fechaPagoCell.z = 'dd/mm/yyyy hh:mm'; }
    }

    // Asegurar formato moneda en la fila de totales (última fila)
    const lastRow = range.e.r; // después de agregar AOA, range ya incluye la fila final
    const totalAmountCell = XLSX.utils.encode_cell({ r: lastRow, c: 3 });
    const totalPendingCell = XLSX.utils.encode_cell({ r: lastRow, c: 4 });
    if (worksheet[totalAmountCell])  { worksheet[totalAmountCell].t = 'n';  worksheet[totalAmountCell].z = '"$"#,##0.00'; }
    if (worksheet[totalPendingCell]) { worksheet[totalPendingCell].t = 'n'; worksheet[totalPendingCell].z = '"$"#,##0.00'; }

    const sheetName = `Costos - ${tabName}`;
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Costos_${tabName.replace(/\s+/g,'')}_${dateLabel}.xlsx`);
  }
}
