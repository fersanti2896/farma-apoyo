import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CollectionService } from '../../../collection/services/collection.service';
import { GlobalStateService } from '../../../../shared/services';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { PaymentsHistoryDialogComponent } from '../../../collection/components/payments-history-dialog/payments-history-dialog.component';
import { PaymentStatusDTO } from '../../../interfaces/collection.interface';
import { SaleDTO, SalesByUserDTO, SalesByUserRequest, SalesStatusDTO } from '../../../interfaces/sale.interface';
import { SalesService } from '../../services/sales.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';

@Component({
  selector: 'app-list-sales-person',
  standalone: false,
  templateUrl: './list-sales-person.component.html'
})
export class ListSalesPersonComponent {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<SalesByUserDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;
  public startDate!: Date;
  public endDate!: Date;
  public selectedStatusId: number | null = null;
  public salesStatuses: SalesStatusDTO[] = [];
  public paymentStatuses: PaymentStatusDTO[] = [];
  public filterForm!: FormGroup;
  public fullName: string = '';

  @ViewChild(MatPaginatorIntl) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private salesService: SalesService,
    private packingService: PackagingService,
    private collectionService: CollectionService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initFilters();
    this.loadSalesStatus();
    this.loadPaymentStatus();
    this.loadSalesByUser();

    const { roleId, fullName } = this.globalStateService.getUser();
    this.rol = roleId;
    this.fullName = fullName;

    this.displayedColumns = ['saleId', 'businessName', 'totalAmount', 'statusName', 'namePayment', 'saleDate', 'actions'];
  }

  initFilters(): void {
    const today = new Date();
    const startDate = today.getDate() <= 15
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 16);
    const endDate = today.getDate() <= 15
      ? new Date(today.getFullYear(), today.getMonth(), 15)
      : new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm = this.fb.group({
      startDate: [startDate],
      endDate: [endDate],
      saleStatusId: [null],
      paymentStatusId: [null]
    });
  }

  loadSalesStatus(): void {
    this.salesService.listSalesStatus().subscribe({
      next: (res) => {
        if (res.result) this.salesStatuses = res.result;
      }
    });
  }

  loadPaymentStatus(): void {
    this.collectionService.listStatusPayment().subscribe({
      next: (res) => {
        if (res.result) this.paymentStatuses = res.result;
      }
    });
  }

  filterSales(): void {
    this.loadSalesByUser();
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

  loadSalesByUser(): void {
    this.isLoading = true;
    const { startDate, endDate, saleStatusId, paymentStatusId } = this.filterForm.value;

    const data: SalesByUserRequest = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      saleStatusId: saleStatusId || 20,
      PaymentStatusId: paymentStatusId || 20
    }

    this.salesService.listSalesByUser(data).subscribe({
      next: (response) => {
        if (response.result) {
          let filteredStock = response.result ?? [];
          this.dataSource.data = filteredStock;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openDetailsTicket(sale: SalesByUserDTO): void {
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

  openPaymentsHistory(sale: SaleDTO): void {
    const request = { saleId: sale.saleId };

    this.collectionService.getPaymentsHistorySaleById(request).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(PaymentsHistoryDialogComponent, {
            width: '800px',
            data: response.result
          });
        } else {
          this.snackBar.open('No se encontraron pagos para este ticket.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener el histórico de pagos de la venta.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getChipStyle(statusId: number): { [klass: string]: any } {
    switch (statusId) {
      case 1: // Sin Pago
        return { backgroundColor: '#F2E550', color: '#1e293b', border: 'none' };
      case 2: // Pago Parcial
        return { backgroundColor: '#87D5E8', color: '#92400e', border: 'none' };
      case 3: // Pagado
        return { backgroundColor: '#78E876', color: '#065f46', border: 'none' };
      case 4: // Vencido
        return { backgroundColor: '#F2AD50', color: '#991b1b', border: 'none' };
      case 5: // Cancelado
        return { backgroundColor: '#FF8166', color: '#4c1d95', border: 'none' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151', border: 'none' };
    }
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      // Fechas (del filtro) y fecha de generación
      const start = new Date(this.filterForm.value.startDate);
      const end   = new Date(this.filterForm.value.endDate);

      const fechaInicio     = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin        = end.toLocaleDateString('es-MX',   { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaGeneracion = new Date().toLocaleString('es-MX');

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mis Ventas - Vendedor: ${this.fullName}`, pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 38, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 42, { align: 'center' });

      // Columnas según los datos de la tabla de este componente
      const columns = [
        'No. Ticket',
        'Cliente',
        'Estatus Ticket',
        'Estatus Cobranza',
        'Monto Ticket',
        'Fecha de Venta'
      ];

      // Filas
      const rows = this.dataSource.data.map(entry => ([
        entry.saleId,
        entry.businessName,
        entry.statusName,
        entry.namePayment,
        formatter.format(entry.totalAmount),
        new Date(entry.saleDate).toLocaleString('es-MX')
      ]));

      // Totales
      const totalRecords = this.dataSource.data.length;
      const totalAmount  = this.dataSource.data.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

      rows.push([
        'Total de registros:', totalRecords.toString(), '', 'Subtotal',
        formatter.format(totalAmount), ''
      ]);

      // Tabla
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 9 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' }, // No. Ticket
          4: { halign: 'right' },  // Monto Ticket
          5: { halign: 'center' }, // Fecha
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      const nombreArchivo = `MisVentas_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };
  }
}
