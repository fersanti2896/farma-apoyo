import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../services/user.service';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { StatusUserRequest } from '../../../../dashboard/interfaces/user.interface';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'modules-user-list-page',
  templateUrl: './list-page.component.html',
  standalone: false
})
export class ListPageComponent implements OnInit, AfterViewInit {
  public displayedColumns: string[] = ['id', 'name', 'username', 'role', 'descriptionStatus', 'actions'];
  public dataSource = new MatTableDataSource<UsersDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadGetUsers();
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

  loadGetUsers(): void {
    this.isLoading = true;

    this.userService.listUsers().subscribe({
      next: (response) => {
        if (response.result) {
          this.dataSource.data = response.result;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openConfirmDialog(user: UsersDTO): void {
    const newStatus = user.status === 1 ? 0 : 1;
    const action = newStatus === 0 ? 'bloquear' : 'desbloquear';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `¿Estás seguro de que deseas ${action} al usuario ${user.username}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.toggleUserStatus(user.username, newStatus);
      }
    });
  }

  toggleUserStatus(userName: string, status: number): void {
    const request: StatusUserRequest = { userName, status };

    this.userService.activeUser( request ).subscribe({
      next: () => {
        this.snackBar.open(`Usuario ${status === 1 ? 'activado' : 'desactivado'} correctamente.`, 'Cerrar', {
          duration: 3000,
        });
        this.loadGetUsers();
      },
      error: () => {
        this.snackBar.open('Error al actualizar el estado del usuario.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
