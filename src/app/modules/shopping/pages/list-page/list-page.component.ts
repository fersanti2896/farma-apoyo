import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EntrySummaryDTO } from '../../../interfaces/entrey-sumarry.interface';
import { ShoppingService } from '../../services/shopping.service';
@Component({
  selector: 'modules-shopping-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = ['entryId', 'businessName', 'invoiceNumber', 'entryDate', 'expectedPaymentDate', 'totalAmount', 'actions'];
  public dataSource = new MatTableDataSource<EntrySummaryDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private shoppingService: ShoppingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEntrySummary();
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

  loadEntrySummary(): void {
    this.isLoading = true;

    this.shoppingService.listWarehouse().subscribe({
      next: (response) => {
        if (response.result) {
          this.dataSource.data = response.result;
          console.log(this.dataSource.data)
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }
}
