import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ConfirmPaymentEntryDialogComponent } from '../confirm-payment-entry-dialog/confirm-payment-entry-dialog.component';
import { NotesSuppliersDTO } from '../../../interfaces/finance.interface';

@Component({
  selector: 'finance-costs-to-pay-table',
  standalone: false,
  templateUrl: './cost-to-pay-table.component.html',
})
export class CostToPayTableComponent {
  @Input() data: NotesSuppliersDTO[] = [];
  @Input() title = 'Por Pagar';
  @Input() isLoading = false;

  @Output() refresh = new EventEmitter<void>();

  displayedColumns: string[] = ['entryId', 'businessName', 'invoiceNumber', 'totalAmount', 'amountPending', 'entryDate', 'expectedPaymentDate', 'statusName', 'actions'];
  dataSource = new MatTableDataSource<NotesSuppliersDTO>([]);

  public paymentMethods = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Tarjeta', label: 'Tarjeta' },
    { value: 'Pago Cuenta de Tercero', label: 'Pago Cuenta de Tercero' }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data ?? [];
      this.dataSource.filterPredicate = (item, filter) => (`
        ${item.entryId} ${item.businessName} ${item.invoiceNumber}
        ${item.totalAmount} ${item.amountPending} ${item.entryDate} ${item.expectedPaymentDate} ${item.statusName}
      `).toLowerCase().includes(filter.trim().toLowerCase());
      setTimeout(() => {
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
      });
    }
  }

  applyFilter(e: Event) {
    const v = (e.target as HTMLInputElement).value || ''; this.dataSource.filter = v.trim().toLowerCase();

    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  applyEntry(entry: NotesSuppliersDTO) {
    const dialogRef = this.dialog.open(ConfirmPaymentEntryDialogComponent, {
      width: '520px',
      data: {
        entryId: entry.entryId,
        supplierId: entry.supplierId,
        businessName: entry.businessName,
        invoiceNumber: entry.invoiceNumber,
        totalAmount: entry.totalAmount,
        amountPending: entry.amountPending,
        paymentMethods: this.paymentMethods
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.applied) {
        this.snackBar.open('Pago registrado exitosamente.', 'Cerrar', { duration: 3000 });
        this.refresh.emit(); 
      }
    });
  }
}
