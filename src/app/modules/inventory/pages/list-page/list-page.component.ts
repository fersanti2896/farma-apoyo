import { Component, ViewChild } from '@angular/core';
import { StockDTO } from '../../../interfaces/stock.interface';
import { MatTableDataSource } from '@angular/material/table';
import { InventoryService } from '../../services/inventory.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'modules-inventory-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = ['inventoryId', 'productName', 'description', 'currentStock', 'lastUpdateDate'];
  public dataSource = new MatTableDataSource<StockDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStock();
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

  loadStock(): void {
    this.isLoading = true;

    this.inventoryService.listStock().subscribe({
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
