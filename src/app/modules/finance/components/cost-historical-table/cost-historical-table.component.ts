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
  selector: 'finance-costs-historical-table',
  standalone: false,
  templateUrl: './cost-historical-table.component.html'
})
export class CostHistoricalTableComponent {
  @Input() data: NotesSuppliersDTO[] = [];
  @Input() isLoading = false;

  displayedColumns: string[] = [
    'entryId', 'businessName', 'invoiceNumber',
    'totalAmount', 'entryDate', 'expectedPaymentDate', 'statusName', 'actions'
  ];

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
      // Filtro por todas las columnas mostradas
      this.dataSource.filterPredicate = (item: NotesSuppliersDTO, filter: string) => {
        const text = (`
          ${item.entryId}
          ${item.businessName}
          ${item.invoiceNumber}
          ${item.totalAmount}
          ${item.entryDate}
          ${item.expectedPaymentDate}
          ${item.statusName}
        `).toLowerCase();
        return text.includes(filter.trim().toLowerCase());
      };
      // Asignar paginator/sort si ya están disponibles
      setTimeout(() => {
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
      });
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = filterValue.trim().toLowerCase();
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
