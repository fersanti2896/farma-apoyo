import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { NotesSuppliersDTO } from '../../../interfaces/finance.interface';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'finance-costs-paid-table',
  standalone: false,
  templateUrl: './cost-paid-table.component.html'
})
export class CostPaidTableComponent {
  @Input() data: NotesSuppliersDTO[] = [];
  @Input() title = 'Pagado';
  @Input() isLoading = false;

  displayedColumns: string[] = ['entryId', 'businessName', 'invoiceNumber', 'totalAmount', 'entryDate', 'expectedPaymentDate', 'statusName'];
  dataSource = new MatTableDataSource<NotesSuppliersDTO>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
}
