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
import { AssignDeliveryUserRequest, SaleDTO, SalesByStatusRequest, UpdateSaleStatusRequest } from '../../../interfaces/sale.interface';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { AssignmentDeliveryComponent } from '../../components/assignment-delivery/assignment-delivery.component';
import { DeliveriesService } from '../../services/deliveries.service';
import { SalesService } from '../../../sales/services/sales.service';
import { MovementsDialogComponent } from '../../components/movements-dialog/movements-dialog.component';
import { UpdateStatusDialogComponent } from '../../../packaging/components/update-status-dialog/update-status-dialog.component';

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
    private salesService: SalesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    const initialTabIndex = (this.rol === 5 || this.rol === 6) ? 2 : 0;
    this.selectedTabIndex = initialTabIndex;
    this.onTabChange({ index: initialTabIndex } as MatTabChangeEvent);
  }

  onTabChange(event: MatTabChangeEvent): void {
    const index = event.index;
    
    if (index === 0) {
      this.displayedColumns = ['saleId', 'businessName', 'vendedor', 'statusName', 'totalAmount', 'saleDate', 'actions'];
      this.loadSales(3);
    }
    else if (index === 1) {
      this.displayedColumns = ['saleId', 'businessName', 'vendedor', 'repartidor', 'statusName', 'totalAmount', 'saleDate', 'actions'];
      this.loadSales(4);
    }
    else if (index === 2) {
      this.displayedColumns = ['saleId', 'businessName', 'vendedor', 'repartidor', 'statusName', 'totalAmount', 'saleDate', 'actions'];
      this.loadSalesDelivery(4);
    }
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

  loadSalesDelivery( statusId: number = 4 ): void {
    this.isLoading = true;

    const data: SalesByStatusRequest = { saleStatusId: statusId };

    this.packingService.listSalesDeliveryByUserId( data ).subscribe({
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
      data: { saleId: entry.saleId, isUpdated: false }
    });

    dialogRef.afterClosed().subscribe((result: { userId: number, comment: string } | undefined) => {
      if (result) {
        const request: AssignDeliveryUserRequest = {
          saleId: entry.saleId,
          deliveryUserId: result.userId,
          commentsDelivery: result.comment,
          isUpdated: false
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

  openReAssigmentDialog(entry: SaleDTO): void {
    const dialogRef = this.dialog.open(AssignmentDeliveryComponent, {
      width: '400px',
      data: { saleId: entry.saleId, isUpdated: true }
    });

    dialogRef.afterClosed().subscribe((result: { userId: number, comment: string } | undefined) => {
      if (result) {
        const request: AssignDeliveryUserRequest = {
          saleId: entry.saleId,
          deliveryUserId: result.userId,
          commentsDelivery: '',
          isUpdated: true
        };

        this.isLoading = true;

        this.deliveriesService.assignDelivery(request).subscribe({
          next: (response) => {
            if (response.result) {
              this.snackBar.open('Ticket re-asignado correctamente.', 'Cerrar', { duration: 3000 });
              this.loadSales(4);
            }

            this.isLoading = false;
          },
          error: () => {
            this.snackBar.open('Error al re-asignar el ticket.', 'Cerrar', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  openMovementsDialog(entry: SaleDTO): void {
    const request = { saleId: entry.saleId };

    this.salesService.movementsSaleById(request).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(MovementsDialogComponent, {
            width: '400px',
            data: response.result
          });
        } else {
          this.snackBar.open('No se encontraron movimientos para este ticket.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener movimientos de la venta.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openStatusDialog(entry: SaleDTO): void {
    const dialogRef = this.dialog.open(UpdateStatusDialogComponent, {
      width: '400px',
      data: { saleId: entry.saleId, isPackaging: false }
    });

    dialogRef.afterClosed().subscribe((comment: string | undefined) => {
      if (comment !== undefined) {
        const request: UpdateSaleStatusRequest = {
          saleId: entry.saleId,
          saleStatusId: 5,
          comments: ''
        };

        this.isLoading = true;
        this.packingService.updateSaleStatus(request).subscribe({
          next: (response) => {
            if (response.result) {
              this.snackBar.open('Estatus actualizado a Completado', 'Cerrar', { duration: 3000 });
              this.loadSales();
            }

            this.isLoading = false;
          },
          error: () => {
            this.snackBar.open('Error al actualizar estatus', 'Cerrar', { duration: 3000 });
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
