import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { FinanceSalesDTO, FinanceSalesRequest } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../services/finance.service';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { UserService } from '../../../usuarios/services/user.service';

@Component({
  selector: 'finance-report-sales',
  standalone: false,
  templateUrl: './report-sales.component.html'
})
export class ReportSalesComponent implements OnInit {
  public isLoading: boolean = false;
  public filterForm!: FormGroup;
  public users: UsersDTO[] = [];
  public dataSource = new MatTableDataSource<FinanceSalesDTO>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public displayedColumns: string[] = [
    'folio',
    'fecha',
    'statusName',
    'cliente',
    'vendedor',
    'totalVenta',
    'totalCompra',
    'utilidad',
    'totalNotaCredito',
    'totalNotaCreditoCompra',
    'utilidadFinal'
  ];

  constructor(
    private financeService: FinanceService,
    private userService: UserService,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.initFilters();
    this.loadUser();
    this.loadSalesVendedor();
  }

  loadUser(): void {
    this.userService.listUsers().subscribe({
      next: (res) => {
        if (res.result) this.users = res.result;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator)
      this.dataSource.paginator.firstPage();
  }

  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm = this.fb.group({
      startDate: [twoMonthsAgo],
      endDate: [today],
      salesPersonId: [null],
    });
  }

  filterSales(): void {
    this.loadSalesVendedor();
  }

  loadSalesVendedor(): void {
    this.isLoading = true;
    const { startDate, endDate, salesPersonId } = this.filterForm.value;

    const data: FinanceSalesRequest = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      vendedorId: salesPersonId || null,
    }

    this.financeService.reportSalesHistorical(data).subscribe({
      next: (response) => {
        if (response.result) {
          this.dataSource.data = response.result;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }


  clearFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm.patchValue({
      startDate: twoMonthsAgo,
      endDate: today,
      salesPersonId: null
    });

    this.loadSalesVendedor();
  }

  exportToPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const data: FinanceSalesDTO[] = this.dataSource.data ?? [];

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
      const salesPersonId = this.filterForm.value.salesPersonId;

      // Nombre del vendedor
      let vendedorName = "Todos los Vendedores";
      if (salesPersonId) {
        const vendedor = this.users.find(u => u.userId === salesPersonId);
        if (vendedor) {
          vendedorName = `${vendedor.firstName} ${vendedor.lastName}`;
        }
      }

      const fechaInicio = new Date(start).toLocaleDateString('es-MX');
      const fechaFin = new Date(end).toLocaleDateString('es-MX');
      const fechaGeneracion = new Date().toLocaleString('es-MX');

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      doc.text('Reporte de Ventas', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 34, { align: 'center' });
      doc.text(`Vendedor: ${vendedorName}`, pageWidth / 2, 40, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 46, { align: 'center' });

      // Columnas
      const columns = [
        'Folio', 'Fecha', 'Estatus', 'Cliente', 'Vendedor',
        'Total Venta', 'Total Compra', 'Utilidad',
        'Nota Crédito', 'Nota Crédito Compra', 'Utilidad Final'
      ];

      // Rows
      const rows = data.map(r => ([
        r.folio,
        r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX') : '-',
        r.statusName,
        r.cliente,
        r.vendedor,
        currency.format(r.totalVenta ?? 0),
        currency.format(r.totalCompra ?? 0),
        currency.format(r.utilidad ?? 0),
        currency.format(r.totalNotaCredito ?? 0),
        currency.format(r.totalNotaCreditoCompra ?? 0),
        currency.format(r.utilidadFinal ?? 0),
      ]));

      // Totales por columna
      const totalRegistros = data.length;
      const totalVenta = data.reduce((a, b) => a + (b.totalVenta ?? 0), 0);
      const totalCompra = data.reduce((a, b) => a + (b.totalCompra ?? 0), 0);
      const totalUtilidad = data.reduce((a, b) => a + (b.utilidad ?? 0), 0);
      const totalNC = data.reduce((a, b) => a + (b.totalNotaCredito ?? 0), 0);
      const totalNCCompra = data.reduce((a, b) => a + (b.totalNotaCreditoCompra ?? 0), 0);
      const totalUtilidadFinal = data.reduce((a, b) => a + (b.utilidadFinal ?? 0), 0);

      rows.push([
        'Totales:',
        `${totalRegistros} ventas`,
        '', '', '',
        currency.format(totalVenta),
        currency.format(totalCompra),
        currency.format(totalUtilidad),
        currency.format(totalNC),
        currency.format(totalNCCompra),
        currency.format(totalUtilidadFinal),
      ]);

      // 👉 Render tabla principal
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 55,
        margin: { bottom: 20 },
        styles: { fontSize: 8 },
        headStyles: { halign: 'center', fillColor: [41, 128, 185] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16 },
          1: { halign: 'center', cellWidth: 22 },
          2: { halign: 'center', cellWidth: 28 },
          3: { cellWidth: 40 },
          4: { cellWidth: 32 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'right', cellWidth: 22 },
          7: { halign: 'right', cellWidth: 22 },
          8: { halign: 'right', cellWidth: 22 },
          9: { halign: 'right', cellWidth: 22 },
          10: { halign: 'right', cellWidth: 22 },
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(9);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      const utilidadVentas = totalUtilidad;
      const utilidadNotas = totalNC - totalNCCompra;
      const utilidadFinalResumen = utilidadVentas + utilidadNotas;

      autoTable(doc, {
        head: [['Utilidad por Ventas', 'Notas de Crédito (NC - NC Compra)', 'Utilidad Final']],
        body: [[
          currency.format(utilidadVentas),
          currency.format(utilidadNotas),
          currency.format(utilidadFinalResumen)
        ]],
        startY: (doc as any).lastAutoTable.finalY + 5, // pegadito debajo
        theme: 'grid',
        tableWidth: 'wrap',
        styles: { fontSize: 10, halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'right', cellWidth: 60 },
          1: { halign: 'right', cellWidth: 80 },
          2: { halign: 'right', cellWidth: 60 },
        },
        margin: { left: pageWidth - (33 + 100 + 70 + 10) }
      });

      const nombreArchivo = `ReporteVentas_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };

    logoImg.onerror = () => { (logoImg.onload as any)(); };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const data: FinanceSalesDTO[] = this.dataSource.data ?? [];

    // Mapea los datos
    const dataToExport = data.map(entry => ({
      'Folio': entry.folio,
      'Fecha': entry.fecha ? new Date(entry.fecha).toLocaleDateString('es-MX') : '-',
      'Estatus': entry.statusName,
      'Cliente': entry.cliente,
      'Vendedor': entry.vendedor,
      'Total Venta': entry.totalVenta ?? 0,
      'Total Compra': entry.totalCompra ?? 0,
      'Utilidad': entry.utilidad ?? 0,
      'Nota Crédito': entry.totalNotaCredito ?? 0,
      'Nota Crédito Compra': entry.totalNotaCreditoCompra ?? 0,
      'Utilidad Final': entry.utilidadFinal ?? 0,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

    // Formatos a columnas numéricas
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = 5; C <= 10; C++) { // columnas de dinero
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) { cell.t = 'n'; cell.z = '"$"#,##0.00'; }
      }
    }

    // Totales
    const totalVenta = data.reduce((a, b) => a + (b.totalVenta ?? 0), 0);
    const totalCompra = data.reduce((a, b) => a + (b.totalCompra ?? 0), 0);
    const totalUtilidad = data.reduce((a, b) => a + (b.utilidad ?? 0), 0);
    const totalNC = data.reduce((a, b) => a + (b.totalNotaCredito ?? 0), 0);
    const totalNCCompra = data.reduce((a, b) => a + (b.totalNotaCreditoCompra ?? 0), 0);
    const totalUtilidadFinal = data.reduce((a, b) => a + (b.utilidadFinal ?? 0), 0);

    XLSX.utils.sheet_add_aoa(worksheet, [[
      'Totales',
      `${data.length} ventas`,
      '',
      '',
      '',
      totalVenta,
      totalCompra,
      totalUtilidad,
      totalNC,
      totalNCCompra,
      totalUtilidadFinal
    ]], { origin: -1 });

    // Resumen
    const utilidadNotas = totalNC - totalNCCompra;
    const utilidadFinalResumen = totalUtilidad + utilidadNotas;

    XLSX.utils.sheet_add_aoa(worksheet, [
      [],
      ['Utilidad por Ventas', 'Notas de Crédito (NC - NC Compra)', 'Utilidad Final'],
      [totalUtilidad, utilidadNotas, totalUtilidadFinal]
    ], { origin: -1 });

    // Crear y descargar archivo
    const sheetName = 'ReporteVentas';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `ReporteVentas_${date}.xlsx`);
  }
}
