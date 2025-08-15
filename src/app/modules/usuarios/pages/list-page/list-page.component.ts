import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { UserService } from '../../services/user.service';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { StatusUserRequest } from '../../../../dashboard/interfaces/user.interface';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Router } from '@angular/router';

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
    private snackBar: MatSnackBar,
    private router: Router
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

  editUser(user: UsersDTO): void {
      this.router.navigate(['/sic/inicio/usuarios/editar', user.userId]);
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Compras a Proveedores', pageWidth / 2, 28, { align: 'center' });


      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = ['ID', 'Nombre', 'Username', 'Rol', 'Estatus'];
      const rows = this.dataSource.data.map(entry => [
        entry.userId,
        `${entry.firstName} ${entry.lastName} ${entry.mLastName}`,
        entry.username,
        entry.role,
        entry.status == 1 ? 'Activo' : 'Inactivo' 
      ]);

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 10 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
        },
        didDrawPage: (data) => {
          const str = `Página ${doc.getNumberOfPages()}`;

          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          });
        }
      });

      doc.save(`Usuarios_${date}.pdf`);
    };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const dataToExport = this.dataSource.data.map(entry => ({
        ID: entry.userId,
        Nombre: `${entry.firstName} ${entry.lastName} ${entry.mLastName}`,
        Username: entry.username,
        Rol: entry.role,
        Estatus: entry.status == 0 ? 'Activo' : 'Inactivo' 
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });
    const sheetName = 'usuarios';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Usuarios_${date}.xlsx`);
  }
}
