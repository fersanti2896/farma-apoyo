import { Component, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { ClientDTO } from '../../../interfaces/client.interface';
import { CollectionService } from '../../services/collection.service';
import { GlobalStateService } from '../../../../shared/services';
import { MovementsDialogComponent } from '../../../deliveries/components/movements-dialog/movements-dialog.component';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { PaymentStatusDTO, SalesPendingPaymentRequest } from '../../../interfaces/collection.interface';
import { SaleDTO, SalesPendingPaymentDTO, SalesStatusDTO } from '../../../interfaces/sale.interface';
import { SalesService } from '../../../sales/services/sales.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { UserService } from '../../../usuarios/services/user.service';
import { ClientesService } from '../../../clientes/services/clientes.service';

@Component({
  selector: 'app-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public dataSource = new MatTableDataSource<SalesPendingPaymentDTO>();
  public displayedColumns: string[] = [];
  public isLoading: boolean = false;
  public paymentForm!: FormGroup;
  public rol: number = 0;
  public filterForm!: FormGroup;
  public salesStatuses: SalesStatusDTO[] = [];
  public paymentStatuses: PaymentStatusDTO[] = [];
  public users: UsersDTO[] = [];
  public clients: ClientDTO[] = [];

  public paymentMethods = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Tarjeta', label: 'Tarjeta' }, 
    { value: 'Pago Cuenta de Tercero', label: 'Pago Cuenta de Tercero' }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private collectionService: CollectionService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private globalStateService: GlobalStateService,
    private packingService: PackagingService,
    private userService: UserService,
    private clientService: ClientesService,
    private salesService: SalesService,
    private snackBar: MatSnackBar,
  ) {
    this.paymentForm = this.fb.group({
      payments: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.initFilters();
    this.loadUser();
    this.loadClients();
    this.loadSalesStatus();
    this.loadPaymentStatus();
    this.loadSalesPayments();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = [ 'saleId', 'businessName', 'salesPerson', 'saleStatus', 'paymentStatus', 'totalAmount', 'amountPending', 'saleDate', 'paymentAmount', 'paymentMethod', 'actions' ];
    
    // Se limpia todos los select si se escoge el select de cliente
    this.filterForm.get('clientId')?.valueChanges.subscribe(val => {
      if (val !== null) {
        this.filterForm.get('salesPersonId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('saleStatusId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('paymentStatusId')?.setValue(null, { emitEvent: false });
      }
    });

    // Se limpia todos los select si se escoge el select de vendedor
    this.filterForm.get('salesPersonId')?.valueChanges.subscribe(val => {
      if (val !== null) {
        this.filterForm.get('clientId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('saleStatusId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('paymentStatusId')?.setValue(null, { emitEvent: false });
      }
    });

    // Se limpia todos los select si se escoge el select de estado del ticket
    this.filterForm.get('saleStatusId')?.valueChanges.subscribe(val => {
      if (val !== null) {
        this.filterForm.get('clientId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('salesPersonId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('paymentStatusId')?.setValue(null, { emitEvent: false });
      }
    });

    // Se limpia todos los select si se escoge pago de cobranza
    this.filterForm.get('paymentStatusId')?.valueChanges.subscribe(val => {
      if (val !== null) {
        this.filterForm.get('clientId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('salesPersonId')?.setValue(null, { emitEvent: false });
        this.filterForm.get('saleStatusId')?.setValue(null, { emitEvent: false });
      }
    });
  }

  get payments(): FormArray {
    return this.paymentForm.get('payments') as FormArray;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) 
      this.dataSource.paginator.firstPage();
  }

  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    this.filterForm = this.fb.group({
      startDate: [ twoMonthsAgo ],
      endDate: [ today ],
      clientId: [ null ],
      salesPersonId: [ null ],
      saleStatusId: [ null ],
      paymentStatusId: [ null ]
    });
  }

  loadUser(): void {
    this.userService.listUsers().subscribe({
      next: (res) => {
        if(res.result) this.users = res.result;
      }
    });
  }

  loadClients(): void {
    this.clientService.listClients().subscribe({
      next: (res) => {
        if( res.result ) this.clients = res.result;
      }
    });
  }

  loadSalesStatus(): void {
    this.salesService.listSalesStatus().subscribe({
      next: (res) => {
        if (res.result) this.salesStatuses = res.result.filter(p => [2, 3, 4, 5, 7].includes(p.saleStatusId));
      }
    });
  }

  loadPaymentStatus(): void {
    this.collectionService.listStatusPayment().subscribe({
      next: (res) => {
        if (res.result) this.paymentStatuses = res.result.filter(p => [1, 2, 4].includes(p.paymentStatusId));
      }
    });
  }

  filterSales(): void {
    this.loadSalesPayments();
  }

  loadSalesPayments(): void {
    this.isLoading = true;
    const { startDate, endDate, clientId, salesPersonId, saleStatusId, paymentStatusId } = this.filterForm.value;

    const data: SalesPendingPaymentRequest = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      clientId: clientId || 20,
      salesPersonId: salesPersonId || 20,
      saleStatusId: saleStatusId || 20,
      paymentStatusId: paymentStatusId || 20,
    }

    this.collectionService.listSalesPayments( data ).subscribe({
      next: (response) => {
        if (response.result) {
          let filteredStock = response.result;

          this.dataSource.data = filteredStock;
          this.payments.clear();
          
          this.dataSource.data.forEach(sale => {
            this.payments.push(this.fb.group({
              saleId: [sale.saleId],
              paymentAmount: [
                null,
                [
                  Validators.required,
                  Validators.min(0),
                  Validators.max(sale.totalAmount)
                ]
              ],
              paymentMethod: [null, Validators.required]
            }));
          });

        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  openDetailsTicket(sale: SalesPendingPaymentDTO): void {
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

  openMovementsDialog(entry: SaleDTO): void {
    const request = { saleId: entry.saleId };

    this.salesService.movementsSaleById(request).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(MovementsDialogComponent, {
            width: '400px',
            data: response.result
          });
        } else {
          this.snackBar.open('No se encontraron movimientos para este ticket.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Error al obtener movimientos de la venta.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getPaymentAmountControl(index: number): FormControl {
    return this.payments.at(index).get('paymentAmount') as FormControl;
  }

  getPaymentMethodControl(index: number): FormControl {
    return this.payments.at(index).get('paymentMethod') as FormControl;
  }

  applyPayment(i: number): void {
    const control = this.payments.at(i);

    if (control.invalid) {
      this.snackBar.open('No se puede aplicar el pago debido a que el monto a pagar supera al monto del ticket.', 'Cerrar', { duration: 3000 });
      control.markAllAsTouched();

      return;
    }

    const paymentData = this.payments.at(i).value;

    if (!paymentData.paymentAmount || !paymentData.paymentMethod) {
      this.snackBar.open('Monto y método de pago son obligatorios.', 'Cerrar', { duration: 3000 });
      return;
    }

    const request = {
      saleId: paymentData.saleId,
      amount: paymentData.paymentAmount,
      method: paymentData.paymentMethod,
      comments: ''
    };

    this.collectionService.applicationPayment(request).subscribe({
      next: (response) => {
        this.snackBar.open('Pago registrado exitosamente.', 'Cerrar', { duration: 3000 });
        this.loadSalesPayments();
      },
      error: () => {
        this.snackBar.open('Error al registrar el pago.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getChipStyle(statusId: number): { [klass: string]: any } {
    switch (statusId) {
      case 1: // Sin Pago
        return { backgroundColor: '#87D5E8', color: '#1e293b', border: 'none' };
      case 2: // Pago Parcial
        return { backgroundColor: '#E8E587', color: '#92400e', border: 'none' };
      case 3: // Pagado
        return { backgroundColor: '#78E876', color: '#065f46', border: 'none' };
      case 4: // Vencido
        return { backgroundColor: '#E8A987', color: '#991b1b', border: 'none' };
      case 5: // Cancelado
        return { backgroundColor: '#FF8166', color: '#4c1d95', border: 'none' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151', border: 'none' };
    }
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const start = new Date(this.filterForm.value.startDate);
      const end = new Date(this.filterForm.value.endDate);

      const fechaInicio = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin = end.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Cobranza - Por Pagar', pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 38, { align: 'center' });

      const columns = ['No. Ticket', 'Cliente', 'Vendedor', 'Estatus Ticket', 'Estatus Cobranza', 'Monto Ticket', 'Monto Pendiente', 'Fecha de Venta'];

      const rows = this.dataSource.data.map(entry => ([
        entry.saleId,
        entry.businessName,
        entry.salesPerson,
        entry.saleStatus,
        entry.paymentStatus,
        formatter.format(entry.totalAmount),
        formatter.format(entry.amountPending),
        new Date(entry.saleDate).toLocaleString('es-MX')
      ]));

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 9 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' }, // No. Ticket
          5: { halign: 'right' },  // Monto Ticket
          6: { halign: 'right' },  // Monto Pendiente
          7: { halign: 'center' }, // Fecha de Venta
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      const nombreArchivo = `CobranzaPorPagar_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Mapea los datos a exportar
    const dataToExport = this.dataSource.data.map(entry => ({
      'No. Ticket': entry.saleId,
      'Cliente': entry.businessName,
      'Vendedor': entry.salesPerson,
      'Estatus Ticket': entry.saleStatus,
      'Estatus Cobranza': entry.paymentStatus,
      'Monto Ticket': entry.totalAmount,
      'Monto Pendiente': entry.amountPending,
      'Fecha de Venta': new Date(entry.saleDate)
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      const montoTicketCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 5 })]; // Columna F: Monto Ticket
      const montoPendienteCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 6 })]; // Columna G: Monto Pendiente
      const fechaVentaCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 7 })]; // Columna H: Fecha de Venta

      if (montoTicketCell) {
        montoTicketCell.t = 'n';
        montoTicketCell.z = '"$"#,##0.00';
      }

      if (montoPendienteCell) {
        montoPendienteCell.t = 'n';
        montoPendienteCell.z = '"$"#,##0.00';
      }

      if (fechaVentaCell) {
        fechaVentaCell.z = 'dd/mm/yyyy hh:mm';
      }
    }

    const sheetName = 'Cobranza';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `CobranzaPorPagar_${date}.xlsx`);
  }
}