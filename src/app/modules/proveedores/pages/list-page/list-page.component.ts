import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ProveedoresService } from '../../services/proveedores.service';
import { StatusRequest } from '../../../interfaces/reply.interface';
import { SupplierDTO } from '../../../interfaces/supplier.interface';

@Component({
  selector: 'proveedores-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = ['businessName', 'contactName', 'balance', 'thirdPartyBalance', 'phone', 'address', 'descriptionStatus', 'actions'];
  public dataSource = new MatTableDataSource<SupplierDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private supplierService: ProveedoresService,
  ) {}

  ngOnInit(): void {
    this.loadGetSuppliers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) 
      this.dataSource.paginator.firstPage();
  }

  loadGetSuppliers(): void {
    this.isLoading = true;

    this.supplierService.listSupliers().subscribe({
      next: (response) => {
        if (response.result)
          this.dataSource.data = response.result;
        
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openConfirmDialog(supplier: SupplierDTO): void {
    const newStatus = supplier.status === 1 ? 0 : 1;
    const action = newStatus === 0 ? 'bloquear' : 'desbloquear';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `¿Estás seguro de que deseas ${action} al proveedor ${ supplier.businessName }?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.toggleUserStatus(supplier.supplierId, newStatus);
      }
    });
  }

  toggleUserStatus(id: number, status: number): void {
    const request: StatusRequest = { id, status };

    this.supplierService.activeSupplier( request ).subscribe({
      next: () => {
        this.snackBar.open(`Proveedor ${status === 1 ? 'activado' : 'desactivado'} correctamente.`, 'Cerrar', {
          duration: 3000,
        });
        this.loadGetSuppliers();
      },
      error: () => {
        this.snackBar.open('Error al actualizar el estado del proveedor.', 'Cerrar', { duration: 3000 });
      }
    });
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
      doc.text('Listado de Proveedores', pageWidth / 2, 28, { align: 'center' });


      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = ['Nombre', 'Contacto', 'Saldo', 'Saldo Cuenta Tercero', 'Teléfono', 'Dirección'];
      const rows = this.dataSource.data.map(entry => [
        entry.businessName,
        entry.contactName,
        formatter.format(entry.balance),
        formatter.format(entry.thirdPartyBalance),
        entry.phone,
        entry.address
      ]);

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

      doc.save(`Proveedores_${date}.pdf`);
    };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const dataToExport = this.dataSource.data.map(entry => ({
      Nombre: entry.businessName,
      Contacto: entry.contactName,
      Saldo: entry.balance,
      SaldoCuentaTercero: entry.thirdPartyBalance,
      Telefono: entry.phone,
      Dirección: entry.address
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });
    const sheetName = 'Proveedores';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Proveedores_${date}.xlsx`);
  }
}
