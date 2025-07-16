import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SaleDTO, SalesByStatusRequest, UpdateSaleStatusRequest } from '../../../interfaces/sale.interface';
import { PackagingService } from '../../services/packaging.service';
import { GlobalStateService } from '../../../../shared/services';
import { TicketDialogComponent } from '../../components/ticket-dialog/ticket-dialog.component';
import { UpdateStatusDialogComponent } from '../../components/update-status-dialog/update-status-dialog.component';

@Component({
  selector: 'app-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<SaleDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private packingService: PackagingService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSales();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = [
      'saleId',
      'businessName',
      'statusName',
      'totalAmount',
      'saleDate',
      'actions'
    ];
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

  loadSales(): void {
    this.isLoading = true;

    const data: SalesByStatusRequest = {
      saleStatusId: 2
    }

    this.packingService.listSales( data ).subscribe({
      next: (response) => {
        if (response.result) {
          let filteredStock = response.result;


          this.dataSource.data = filteredStock;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openDetailsTicket(sale: SaleDTO): void {
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

  openStatusDialog(entry: SaleDTO): void {
    const dialogRef = this.dialog.open(UpdateStatusDialogComponent, {
      width: '400px',
      data: { saleId: entry.saleId }
    });

    dialogRef.afterClosed().subscribe((comment: string | undefined) => {
      if (comment !== undefined) {
        const request: UpdateSaleStatusRequest = {
          saleId: entry.saleId,
          saleStatusId: 3,
          comments: comment?.trim() || ''
        };

        this.isLoading = true;
        this.packingService.updateSaleStatus(request).subscribe({
          next: (response) => {
            if (response.result) {
              this.snackBar.open('Estatus actualizado a Empaquetado', 'Cerrar', { duration: 3000 });
              this.loadSales();
            }

            this.isLoading = false;
          },
          error: () => {
            this.snackBar.open('Error al actualizar estatus', 'Cerrar', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
  }
}
