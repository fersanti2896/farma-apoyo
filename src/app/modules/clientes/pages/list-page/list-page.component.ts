import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { ClientDTO } from '../../../interfaces/client.interface';
import { ClientesService } from '../../services/clientes.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StatusRequest } from '../../../interfaces/reply.interface';

@Component({
  selector: 'modules-clientes-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = ['clientId', 'businessName', 'contactName', 'address', 'phoneNumber', 'creditLimit', 'descriptionStatus', 'actions'];
  public dataSource = new MatTableDataSource<ClientDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clientsService: ClientesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
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
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadGetSuppliers(): void {
    this.isLoading = true;

    this.clientsService.listClients().subscribe({
      next: (response) => {
        if (response.result) {
          this.dataSource.data = response.result;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  editClient(client: ClientDTO) {
    this.router.navigate(['/sic/inicio/clientes/list/editar'], {
      state: { client }
    });
  }

  openConfirmDialog(client: ClientDTO): void {
    const newStatus = client.status === 1 ? 0 : 1;
    const action = newStatus === 0 ? 'bloquear' : 'desbloquear';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `¿Estás seguro de que deseas ${action} al cliente ${ client.businessName }?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.toggleUserStatus(client.clientId, newStatus);
      }
    });
  }
  
  toggleUserStatus(id: number, status: number): void {
    const request: StatusRequest = { id, status };

    this.clientsService.activeClient( request ).subscribe({
      next: () => {
        this.snackBar.open(`Cliente ${status === 1 ? 'activado' : 'desactivado'} correctamente.`, 'Cerrar', {
          duration: 3000,
        });
        this.loadGetSuppliers();
      },
      error: () => {
        this.snackBar.open('Error al actualizar el estado del cliente.', 'Cerrar', { duration: 3000 });
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
      const fechaGeneracion = new Date().toLocaleString('es-MX');
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Listado de Clientes', pageWidth / 2, 28, { align: 'center' });


      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = ['ID', 'Cliente', 'Contacto', 'Dirección', 'Teléfono', 'Crédito'];
      const rows = this.dataSource.data.map(entry => [
        entry.clientId,
        entry.businessName,
        entry.contactName,
        entry.address,
        entry.phoneNumber,
        formatter.format(entry.creditLimit)
      ]);

      const totalRecords = this.dataSource.data.length;
      rows.push(['Total de registros:', totalRecords.toString(), '', '', '', '' ]);

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 10 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'center' },
        },
        didDrawPage: (data) => {
          const str = `Página ${doc.getNumberOfPages()}`;

          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          });
        }
      });

      doc.save(`Clientes_${date}.pdf`);
    };
  }

  exportToExcel(): void {
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2} );
    const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    const dataToExport = this.dataSource.data.map(entry => ({
      ID: entry.clientId,
      Cliente: entry.businessName,
      Contacto: entry.contactName,
      Direccion: entry.address,
      Telefono: entry.phoneNumber,
      Credito: entry.creditLimit
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    
    for (let R = 1; R <= range.e.r; ++R) {
      const montoCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 5 })]; // F

      if (montoCell) {
        montoCell.t = 'n';
        montoCell.z = '"$"#,##0.00';
      }
    }

    const sheetName = 'Clientes';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Clientes_${date}.xlsx`);
  }
}
