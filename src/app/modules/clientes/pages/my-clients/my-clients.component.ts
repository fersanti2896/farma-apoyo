import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ClientByUserDTO, ClientDTO } from '../../../interfaces/client.interface';
import { ClientesService } from '../../services/clientes.service';

@Component({
  selector: 'app-my-clients',
  standalone: false,
  templateUrl: './my-clients.component.html'
})
export class MyClientsComponent {
  public displayedColumns: string[] = ['clientId', 'businessName', 'contactName', 'address', 'creditLimit', 'availableCredit', 'descriptionStatus'];
  public dataSource = new MatTableDataSource<ClientByUserDTO>();
  public isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clientsService: ClientesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClientsByUser();
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

  loadClientsByUser(): void {
    this.isLoading = true;

    this.clientsService.getClientsByUser().subscribe({
      next: (response) => {
        console.log(response)
        if (response.result) {
          this.dataSource.data = response.result;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  getStatusDescription(isBlocked: number): string {
    return isBlocked === 0 ? 'Activo' : 'Inactivo';
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2} );

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
      doc.text('Listado de Clientes', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = ['ID', 'Cliente', 'Contacto', 'Dirección', 'Crédito', 'Crédito Disponible'];
      const rows = this.dataSource.data.map(entry => [
        entry.clientId,
        entry.businessName,
        entry.contactName,
        entry.address,
        formatter.format(entry.creditLimit), 
        formatter.format(entry.availableCredit)
      ]);

      const totalRecords = this.dataSource.data.length;
      rows.push(['Total de registros:', totalRecords.toString(), '', '', '', '' ]);

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
        },
        didDrawPage: (data) => {
          const str = `Página ${doc.getNumberOfPages()}`;

          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          });
        }
      });

      doc.save(`Clientes_${date}.pdf`);
    };
  }
}
