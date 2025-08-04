import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { SalesService } from '../../services/sales.service';
import { GlobalStateService } from '../../../../shared/services';
import { SalesByUserDTO, SalesByUserRequest, SalesStatusDTO } from '../../../interfaces/sale.interface';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { CollectionService } from '../../../collection/services/collection.service';
import { PaymentStatusDTO } from '../../../interfaces/collection.interface';

@Component({
  selector: 'app-list-sales-person',
  standalone: false,
  templateUrl: './list-sales-person.component.html'
})
export class ListSalesPersonComponent {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<SalesByUserDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;
  public startDate!: Date;
  public endDate!: Date;
  public selectedStatusId: number | null = null;
  public salesStatuses: SalesStatusDTO[] = [];
  public paymentStatuses: PaymentStatusDTO[] = [];
  public filterForm!: FormGroup;

  @ViewChild(MatPaginatorIntl) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private salesService: SalesService,
    private packingService: PackagingService,
    private collectionService: CollectionService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initFilters();
    this.loadSalesStatus();
    this.loadPaymentStatus();
    this.loadSalesByUser();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = ['saleId', 'businessName', 'totalAmount', 'statusName', 'namePayment', 'saleDate', 'actions'];
  
    // Se limpia el select de pagos de cobranza si se escoge el select de estado del ticket
    this.filterForm.get('saleStatusId')?.valueChanges.subscribe(val => {
      if (val !== null) {
        this.filterForm.get('paymentStatusId')?.setValue(null, { emitEvent: false });
      }
    });

    // Se limpia el select del estado del ticket si se escoge el select de pagos de cobranza
    this.filterForm.get('paymentStatusId')?.valueChanges.subscribe(val => {
      if (val !== null) {
        this.filterForm.get('saleStatusId')?.setValue(null, { emitEvent: false });
      }
    });
  }

  initFilters(): void {
    const today = new Date();
    const startDate = today.getDate() <= 15
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 16);
    const endDate = today.getDate() <= 15
      ? new Date(today.getFullYear(), today.getMonth(), 15)
      : new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm = this.fb.group({
      startDate: [startDate],
      endDate: [endDate],
      saleStatusId: [null],
      paymentStatusId: [null]
    });
  }

  loadSalesStatus(): void {
    this.salesService.listSalesStatus().subscribe({
      next: (res) => {
        if (res.result) this.salesStatuses = res.result;
      }
    });
  }

  loadPaymentStatus(): void {
    this.collectionService.listStatusPayment().subscribe({
      next: (res) => {
        if (res.result) this.paymentStatuses = res.result;
      }
    });
  }

  filterSales(): void {
    this.loadSalesByUser();
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

  loadSalesByUser(): void {
    this.isLoading = true;
    const { startDate, endDate, saleStatusId, paymentStatusId } = this.filterForm.value;

    const data: SalesByUserRequest = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      saleStatusId: saleStatusId || 20,
      PaymentStatusId: paymentStatusId || 20
    }
    
    this.salesService.listSalesByUser( data ).subscribe({
      next: (response) => {
        if (response.result) {
          let filteredStock = response.result ?? [];
          this.dataSource.data = filteredStock;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openDetailsTicket(sale: SalesByUserDTO): void {
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
}
