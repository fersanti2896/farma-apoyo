import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { EntrySummaryDTO, FullEntryByIdRequest } from '../../../interfaces/entrey-sumarry.interface';
import { ShoppingService } from '../../services/shopping.service';
import { EntryDialogsComponent } from '../../components/entry-dialogs/entry-dialogs.component';
import { GlobalStateService } from '../../../../shared/services';

@Component({
  selector: 'modules-shopping-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<EntrySummaryDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;
  public showPrices: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private globalStateService: GlobalStateService,
    private shoppingService: ShoppingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEntrySummary();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;
    this.showPrices = roleId === 1 || roleId === 2;

    this.displayedColumns = [
      'entryId', 'businessName', 'invoiceNumber', 'entryDate', 'expectedPaymentDate', 
      ...( this.showPrices ? ['totalAmount'] : [] ), 
      'actions'
    ];
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadEntrySummary(): void {
    this.isLoading = true;

    this.shoppingService.listWarehouse().subscribe({
      next: (response) => {
        if (response.result)
          this.dataSource.data = response.result;
        
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openConfirmDialog(client: EntrySummaryDTO): void {
    const data: FullEntryByIdRequest = {
      entryId: client.entryId
    }

    this.shoppingService.detailsFullEntryById( data ).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(EntryDialogsComponent, {
            width: '80vw',
            data: response.result
          });
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener detalles de la nota de pedido', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editEntry(entry: EntrySummaryDTO): void {
    this.router.navigate(['/sic/inicio/compras/editar', entry.entryId]);
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2} );

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Compras a Proveedores', pageWidth / 2, 28, { align: 'center' });


      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = this.showPrices
        ? ['ID', 'Proveedor', '# Pedido', 'Fecha de Registro', 'Fecha de Pago', 'Monto']
        : ['ID', 'Proveedor', '# Pedido', 'Fecha de Registro', 'Fecha de Pago'];

      const rows = this.dataSource.data.map(entry => {
        const base = [
          entry.entryId,
          entry.businessName,
          entry.invoiceNumber,
          new Date(entry.entryDate).toLocaleDateString(),
          new Date(entry.expectedPaymentDate).toLocaleDateString()
        ];

        return this.showPrices ? [...base, formatter.format(entry.totalAmount)] : base;
      });

      const totalRecords = this.dataSource.data.length;
      if (this.showPrices) {
        const totalAmount = this.dataSource.data
          .reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);

        // Fila de totales cuando hay columna Monto
        rows.push([
          'Total de registros:', totalRecords.toString(), '', '', 'Subtotal', formatter.format(totalAmount)
        ]);
      } else {
        // Solo total de registros (sin monto)
        rows.push(['Total de registros:', totalRecords.toString(), '', '', '']);
      }

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 10 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' }, // ID
          3: { halign: 'center' }, // Fecha de Registro
          4: { halign: 'center' }, // Fecha de Pago
        },
        didDrawPage: (data) => {
          const str = `Página ${doc.getNumberOfPages()}`;

          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          });
        }
      });

      doc.save(`ComprasProveedores_${date}.pdf`);
    };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Construir datos dinámicamente según showPrices
    const dataToExport = this.dataSource.data.map(entry => {
      const base: any = {
        ID: entry.entryId,
        Proveedor: entry.businessName,
        Pedido: entry.invoiceNumber,
        FechaRegistro: new Date(entry.entryDate),
        FechaPago: new Date(entry.expectedPaymentDate),
      };

      if (this.showPrices) {
        base.Monto = entry.totalAmount;
      }

      return base;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      const fechaRegCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 3 })]; // Columna D (FechaRegistro)
      const fechaPagCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })]; // Columna E (FechaPago)

      if (fechaRegCell) fechaRegCell.z = 'dd/mm/yyyy';
      if (fechaPagCell) fechaPagCell.z = 'dd/mm/yyyy';

      if (this.showPrices) {
        const montoCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 5 })]; // Columna F (Monto)
        if (montoCell) {
          montoCell.t = 'n';
          montoCell.z = '"$"#,##0.00';
        }
      }
    }

    const sheetName = 'Compras';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `ComprasProveedores_${date}.xlsx`);
  }
}
