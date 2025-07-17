import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { PackagingService } from '../../../packaging/services/packaging.service';
import { GlobalStateService } from '../../../../shared/services';
import { AssignDeliveryUserRequest, SaleDTO, SalesByStatusRequest } from '../../../interfaces/sale.interface';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { AssignmentDeliveryComponent } from '../../components/assignment-delivery/assignment-delivery.component';
import { DeliveriesService } from '../../services/deliveries.service';

@Component({
  selector: 'app-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent implements OnInit {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<SaleDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;
  public selectedTabIndex: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private packingService: PackagingService,
    private deliveriesService: DeliveriesService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.onTabChange({ index: 0 } as MatTabChangeEvent);
  }

  onTabChange(event: MatTabChangeEvent): void {
    const index = event.index;
    const status = index === 0 ? 3 : 4;
    this.displayedColumns = index === 0
      ? ['saleId', 'businessName', 'vendedor', 'statusName', 'totalAmount', 'saleDate', 'actions']
      : ['saleId', 'businessName', 'vendedor', 'repartidor', 'statusName', 'totalAmount', 'saleDate', 'actions'];

    this.loadSales(status);
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

  loadSales( statusId: number = 3 ): void {
    this.isLoading = true;

    const data: SalesByStatusRequest = { saleStatusId: statusId };

    this.packingService.listSales( data ).subscribe({
      next: (response) => {
        if (response.result) {
          let filteredStock = response.result;
          
          this.dataSource.data = filteredStock;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openDetailsTicket(sale: SaleDTO): void {
    const request = { saleId: sale.saleId };

    this.packingService.postDetailSaleById(request).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(TicketDialogComponent, {
            width: '200px',
            height: '70%',
            data: {
              sale: sale,             // Info general del ticket
              details: response.result // Lista de productos vendidos
            }
          });
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener detalles del ticket.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openAssigmentDialog(entry: SaleDTO): void {
    const dialogRef = this.dialog.open(AssignmentDeliveryComponent, {
      width: '400px',
      data: { saleId: entry.saleId }
    });

    dialogRef.afterClosed().subscribe((userId: number | undefined) => {
      if (userId !== undefined) {
        const request: AssignDeliveryUserRequest = {
          saleId: entry.saleId,
          deliveryUserId: userId
        };

        this.isLoading = true;

        this.deliveriesService.assignDelivery(request).subscribe({
          next: (response) => {
            if (response.result) {
              this.snackBar.open('Ticket asignado correctamente.', 'Cerrar', { duration: 3000 });
              this.loadSales();
            }

            this.isLoading = false;
          },
          error: () => {
            this.snackBar.open('Error al asignar el ticket.', 'Cerrar', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
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
      doc.text('Tickets - ' + (this.selectedTabIndex === 0 ? 'Empaquetado' : 'En Tránsito'), pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = this.selectedTabIndex === 0
        ? ['No. Ticket', 'Cliente', 'Vendedor', 'Estatus', 'Monto', 'Fecha Creacion']
        : ['No. Ticket', 'Cliente', 'Vendedor', 'Repartidor', 'Estatus', 'Monto', 'Fecha Creacion'];

      const rows = this.dataSource.data.map(entry => {
        const base = [
          entry.saleId,
          entry.businessName,
          entry.vendedor,
          ...(this.selectedTabIndex === 1 ? [entry.repartidor] : []),
          entry.statusName,
          formatter.format(entry.totalAmount),
          new Date(entry.saleDate).toLocaleString('es-MX')
        ];
        return base;
      });

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 10 },
        headStyles: { halign: 'center' },
        columnStyles: { 0: { halign: 'center' } },
        didDrawPage: () => {
          doc.setFontSize(10);
          doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      doc.save(`Tickets_${date}.pdf`);
    };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    const dataToExport = this.dataSource.data.map(entry => {
      const base: any = {
        'No. Ticket': entry.saleId,
        'Cliente': entry.businessName,
        'Vendedor': entry.vendedor,
        'Estatus': entry.statusName,
        'Monto': entry.totalAmount,
        'Fecha Creacion': new Date(entry.saleDate).toLocaleString('es-MX')
      };

      if (this.selectedTabIndex === 1) {
        base['Repartidor'] = entry.repartidor;
      }

      return base;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');

    for (let R = 1; R <= range.e.r; ++R) {
      const montoCell = worksheet[XLSX.utils.encode_cell({ r: R, c: this.selectedTabIndex === 0 ? 4 : 5 })];
      if (montoCell) {
        montoCell.t = 'n';
        montoCell.z = '"$"#,##0.00';
      }
    }

    const sheetName = this.selectedTabIndex === 0 ? 'Empaquetado' : 'EnTransito';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Tickets_${sheetName}_${date}.xlsx`);
  }
}
