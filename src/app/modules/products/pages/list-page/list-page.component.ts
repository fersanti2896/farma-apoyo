import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductDTO } from '../../../interfaces/product.interface';
import { ProductService } from '../../services/product.service';
import { AssignProviderDialogComponent } from '../../components/assign-provider-dialog/assign-provider-dialog.component';
@Component({
  selector: 'modules-products-list-page',
  standalone: false,
  templateUrl: './list-page.component.html',
})
export class ListPageComponent {
  public displayedColumns: string[] = ['productId', 'productName', 'price', 'barcode', 'unit', 'actions'];
  public dataSource = new MatTableDataSource<ProductDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productsService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadGetProducts();
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

  loadGetProducts(): void {
    this.isLoading = true;

    this.productsService.listProducts().subscribe({
      next: (response) => {
        if (response.result) {
          this.dataSource.data = response.result;
          console.log('Products', response.result)
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openAssignProviderDialog(product: ProductDTO) {
    const dialogRef = this.dialog.open(AssignProviderDialogComponent, {
      width: '400px',
      data: { productId: product.productId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGetProducts();
      }
    });
  }
}
