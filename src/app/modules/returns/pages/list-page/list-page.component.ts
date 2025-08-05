import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ClientDTO } from '../../../interfaces/client.interface';
import { GlobalStateService } from '../../../../shared/services';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { PaymentStatusDTO, SalesPendingPaymentRequest } from '../../../interfaces/collection.interface';
import { CancelSaleRequest, SaleDTO, SalesPendingPaymentDTO, SalesStatusDTO } from '../../../interfaces/sale.interface';
import { SalesService } from '../../../sales/services/sales.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { CollectionService } from '../../../collection/services/collection.service';
import { MovementsDialogComponent } from '../../../deliveries/components/movements-dialog/movements-dialog.component';
import { ConfirmDevolutionDialogComponent } from '../../components/confirm-devolution-dialog/confirm-devolution-dialog.component';

@Component({
  selector: 'app-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public dataSource = new MatTableDataSource<SalesPendingPaymentDTO>();
  public displayedColumns: string[] = [];
  public isLoading: boolean = false;
  public rol: number = 0;
  public filterForm!: FormGroup;
  public salesStatuses: SalesStatusDTO[] = [];
  public paymentStatuses: PaymentStatusDTO[] = [];
  public users: UsersDTO[] = [];
  public clients: ClientDTO[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private collectionService: CollectionService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private globalStateService: GlobalStateService,
    private packingService: PackagingService,
    private salesService: SalesService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.initFilters();
    this.loadSalesPayments();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = [ 'saleId', 'businessName', 'salesPerson', 'saleStatus', 'paymentStatus', 'totalAmount', 'saleDate', 'actions' ];
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

  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm = this.fb.group({
      startDate: [ twoMonthsAgo ],
      endDate: [ today ]
    });
  }

  filterSales(): void {
    this.loadSalesPayments();
  }

  loadSalesPayments(): void {
    this.isLoading = true;
    const { startDate, endDate } = this.filterForm.value;

    const data: SalesPendingPaymentRequest = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      saleStatusId: 6
    };

    this.collectionService.listSalesHistorical( data ).subscribe({
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

  openDetailsTicket(sale: SalesPendingPaymentDTO): void {
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

  openCancellationDialog(saleId: number): void {
    const dialogRef = this.dialog.open(ConfirmDevolutionDialogComponent, {
      width: '400px',
      data: { saleId }
    });

    dialogRef.afterClosed().subscribe((comment: string | undefined) => {
      if (!comment) return;

      const request: CancelSaleRequest = { saleId, comments: comment };

      this.salesService.confirmCancellationSale(request).subscribe({
        next: (res) => {
          if (res.result?.status) {
            this.snackBar.open('Cancelación exitosa.', 'Cerrar', { duration: 3000 });
            this.loadSalesPayments(); // Refrescar la tabla
          } else {
            this.snackBar.open(res.result?.msg ?? 'Error al cancelar.', 'Cerrar', { duration: 3000 });
          }
        },
        error: () => {
          this.snackBar.open('Error al procesar la cancelación.', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }

  getChipStyle(statusId: number): { [klass: string]: any } {
    switch (statusId) {
      case 1: // Sin Pago
        return { backgroundColor: '#87D5E8', color: '#1e293b', border: 'none' };
      case 2: // Pago Parcial
        return { backgroundColor: '#E8E587', color: '#92400e', border: 'none' };
      case 3: // Pagado
        return { backgroundColor: '#78E876', color: '#065f46', border: 'none' };
      case 4: // Vencido
        return { backgroundColor: '#E8A987', color: '#991b1b', border: 'none' };
      case 5: // Cancelado
        return { backgroundColor: '#9B8AE6', color: '#4c1d95', border: 'none' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151', border: 'none' };
    }
  }
}
