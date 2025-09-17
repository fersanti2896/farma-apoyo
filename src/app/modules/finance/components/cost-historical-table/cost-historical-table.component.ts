import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { NotesSuppliersDTO } from '../../../interfaces/finance.interface';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

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
    'totalAmount', 'entryDate', 'expectedPaymentDate', 'statusName'
  ];

  dataSource = new MatTableDataSource<NotesSuppliersDTO>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
}
