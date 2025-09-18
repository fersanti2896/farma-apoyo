import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { FinanceService } from '../../services/finance.service';
import { NotesSuppliersDTO } from '../../../interfaces/finance.interface';
import { PaymentsHistoryDialogComponent } from '../../../collection/components/payments-history-dialog/payments-history-dialog.component';

@Component({
  selector: 'finance-costs-paid-table',
  standalone: false,
  templateUrl: './cost-paid-table.component.html'
})
export class CostPaidTableComponent {
  @Input() data: NotesSuppliersDTO[] = [];
  @Input() title = 'Pagado';
  @Input() isLoading = false;

  displayedColumns: string[] = ['entryId', 'businessName', 'invoiceNumber', 'totalAmount', 'entryDate', 'expectedPaymentDate', 'statusName', 'actions'];
  dataSource = new MatTableDataSource<NotesSuppliersDTO>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private financeService: FinanceService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data ?? [];
      this.dataSource.filterPredicate = (item, filter) => (`
        ${item.entryId} ${item.businessName} ${item.invoiceNumber}
        ${item.totalAmount} ${item.entryDate} ${item.expectedPaymentDate} ${item.statusName}
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

  openMovementsDialog(entry: NotesSuppliersDTO): void {
    const request = { entryId: entry.entryId };

    this.financeService.movementsByEntryId(request).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(PaymentsHistoryDialogComponent, {
            width: '800px',
            data: response.result
          });
        } else {
          this.snackBar.open('No se encontraron movimientos para esta factura.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener movimientos de la factura.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
