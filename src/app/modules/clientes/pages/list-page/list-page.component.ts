import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClientDTO } from '../../../interfaces/client.interface';
import { ClientesService } from '../../services/clientes.service';

@Component({
  selector: 'modules-clientes-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = ['clientId', 'businessName', 'contactName', 'address', 'phoneNumber', 'creditLimit', 'actions'];
  public dataSource = new MatTableDataSource<ClientDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clientsService: ClientesService,
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

    this.clientsService.listClients().subscribe({
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
}
