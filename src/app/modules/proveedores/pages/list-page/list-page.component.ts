import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SupplierDTO } from '../../../interfaces/supplier.interface';
import { ProveedoresService } from '../../services/proveedores.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StatusRequest } from '../../../interfaces/reply.interface';


@Component({
  selector: 'proveedores-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = ['businessName', 'contactName', 'phone', 'address', 'descriptionStatus', 'actions'];
  public dataSource = new MatTableDataSource<SupplierDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private supplierService: ProveedoresService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadGetSuppliers();
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

  loadGetSuppliers(): void {
    this.isLoading = true;

    this.supplierService.listSupliers().subscribe({
      next: (response) => {
        if (response.result) {
          this.dataSource.data = response.result;
          console.log(response.result)
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openConfirmDialog(supplier: SupplierDTO): void {
    const newStatus = supplier.status === 1 ? 0 : 1;
    const action = newStatus === 0 ? 'bloquear' : 'desbloquear';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `¿Estás seguro de que deseas ${action} al proveedor ${ supplier.businessName }?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.toggleUserStatus(supplier.supplierId, newStatus);
      }
    });
  }

  toggleUserStatus(id: number, status: number): void {
    const request: StatusRequest = { id, status };

    this.supplierService.activeSupplier( request ).subscribe({
      next: () => {
        this.snackBar.open(`Proveedor ${status === 1 ? 'activado' : 'desactivado'} correctamente.`, 'Cerrar', {
          duration: 3000,
        });
        this.loadGetSuppliers();
      },
      error: () => {
        this.snackBar.open('Error al actualizar el estado del proveedor.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
