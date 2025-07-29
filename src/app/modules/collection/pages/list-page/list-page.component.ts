import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { CollectionService } from '../../services/collection.service';
import { GlobalStateService } from '../../../../shared/services';
import { SaleDTO, SalesPendingPaymentDTO } from '../../../interfaces/sale.interface';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { SalesService } from '../../../sales/services/sales.service';
import { MovementsDialogComponent } from '../../../deliveries/components/movements-dialog/movements-dialog.component';

@Component({
  selector: 'app-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<SalesPendingPaymentDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;
  public paymentForm!: FormGroup;

  public paymentMethods = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Tarjeta', label: 'Tarjeta' }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private collectionService: CollectionService,
    private packingService: PackagingService,
    private salesService: SalesService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      payments: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadSalesPayments();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = [
      'saleId',
      'businessName',
      'saleStatus',
      'paymentStatus',
      'totalAmount',
      'amountPending',
      'saleDate',
      'paymentAmount',
      'paymentMethod',
      'actions'
    ];
  }

  get payments(): FormArray {
    return this.paymentForm.get('payments') as FormArray;
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

  loadSalesPayments(): void {
    this.isLoading = true;


    this.collectionService.listSalesPayments().subscribe({
      next: (response) => {
        console.log(response)
        if (response.result) {
          let filteredStock = response.result;


          this.dataSource.data = filteredStock;
          this.payments.clear();
          
          this.dataSource.data.forEach(sale => {
            this.payments.push(this.fb.group({
              saleId: [sale.saleId],
              paymentAmount: [
                null,
                [
                  Validators.required,
                  Validators.min(0),
                  Validators.max(sale.totalAmount)
                ]
              ],
              paymentMethod: [null, Validators.required]
            }));
          });

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

  getPaymentAmountControl(index: number): FormControl {
    return this.payments.at(index).get('paymentAmount') as FormControl;
  }

  getPaymentMethodControl(index: number): FormControl {
    return this.payments.at(index).get('paymentMethod') as FormControl;
  }

  applyPayment(i: number): void {
    const control = this.payments.at(i);

    if (control.invalid) {
      this.snackBar.open('No se puede aplicar el pago debido a que el monto a pagar supera al monto del ticket.', 'Cerrar', { duration: 3000 });
      control.markAllAsTouched();
      return;
    }

    const paymentData = this.payments.at(i).value;

    if (!paymentData.paymentAmount || !paymentData.paymentMethod) {
      this.snackBar.open('Monto y método de pago son obligatorios.', 'Cerrar', { duration: 3000 });
      return;
    }

    const request = {
      saleId: paymentData.saleId,
      amount: paymentData.paymentAmount,
      method: paymentData.paymentMethod,
      comments: ''
    };

    console.log(request)

    this.collectionService.applicationPayment(request).subscribe({
      next: (response) => {
        this.snackBar.open('Pago registrado exitosamente.', 'Cerrar', { duration: 3000 });
        this.loadSalesPayments();
      },
      error: () => {
        this.snackBar.open('Error al registrar el pago.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
