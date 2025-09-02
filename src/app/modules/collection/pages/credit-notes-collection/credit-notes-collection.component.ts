import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatTableDataSource } from '@angular/material/table';

import { jsPDF } from 'jspdf';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

import { ApproveCreditNoteRequest, CreditNoteListDTO, CreditNoteListRequest } from '../../../interfaces/collection.interface';
import { ClientDTO } from '../../../interfaces/client.interface';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { CollectionService } from '../../services/collection.service';
import { ConfirmNoteCreditComponent } from '../../components/confirm-note-credit/confirm-note-credit.component';
import { DetailsCreditNoteComponent } from '../../components/details-credit-note/details-credit-note.component';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { SaleDTO } from '../../../interfaces/sale.interface';
import { SalesService } from '../../../sales/services/sales.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { UserService } from '../../../usuarios/services/user.service';

@Component({
  selector: 'app-credit-notes-collection',
  standalone: false,
  templateUrl: './credit-notes-collection.component.html'
})
export class CreditNotesCollectionComponent {
  public isLoading = false;
  public dataSource = new MatTableDataSource<CreditNoteListDTO>([]);
  public displayedColumns: string[] = [
    'noteCreditId',
    'saleId',
    'clientName',
    'vendedor',
    'finalCreditAmount',
    'comments',
    'createDate',
    'createdBy',
    'actions',
  ];

  public filterForm!: FormGroup;
  public selectedTabIndex = 0; // 0: Pendientes (11), 1: Confirmadas (13)
  public users: UsersDTO[] = [];
  public clients: ClientDTO[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    private userService: UserService,
    private clientService: ClientesService,
    private packingService: PackagingService,
    private salesService: SalesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
    this.initFilters();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadClients();
    this.loadCreditNotes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ---------- Filtros ----------
  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 1);

    this.filterForm = this.fb.group({
      startDate: [twoMonthsAgo],
      endDate: [today],
      clientId: [null],
      salesPersonId: [null],
    });
  }

  loadUsers(): void {
    this.userService.listUsers().subscribe({
      next: (res) => { if (res.result) this.users = res.result; }
    });
  }

  loadClients(): void {
    this.clientService.listClients().subscribe({
      next: (res) => { if (res.result) this.clients = res.result; }
    });
  }

  // ---------- Tabs ----------
  onTabChange(ev: MatTabChangeEvent): void {
    this.selectedTabIndex = ev.index;
    this.loadCreditNotes();
  }

  // ---------- Buscar / Limpiar ----------
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value || '';
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  filterSales(): void {
    this.loadCreditNotes();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      clientId: null,
      salesPersonId: null,
    });
    this.loadCreditNotes();
  }

  // ---------- Carga de notas ----------
  private currentStatusId(): number {
    return this.selectedTabIndex === 0 ? 11 : 13;
  }

  private buildRequest(): CreditNoteListRequest {
    const { startDate, endDate, clientId, salesPersonId } = this.filterForm.value;
    return {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      clientId: clientId || 20000,
      salesPersonId: salesPersonId || 20000,
      saleStatusId: this.currentStatusId(),
    };
  }

  loadCreditNotes(): void {
    this.isLoading = true;
    const req = this.buildRequest();

    this.collectionService.getCreditNotesByStatus(req).subscribe({
      next: (res) => {
        this.dataSource.data = res.result ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar notas de crédito.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // ---------- Acciones (opcional) ----------
  openDetailsTicket(sale: CreditNoteListDTO): void {
    const request = { saleId: sale.saleId };

    this.packingService.postDetailSaleById(request).subscribe({
      next: (response) => {
        if (response.result) {
          const totalAmount = response.result.reduce((acc, item) => acc + item.subTotal, 0);

          const newSale: SaleDTO = {
            saleId: sale.saleId,
            clientId: 0,
            businessName: sale.clientName,
            saleStatusId: 0,
            statusName: '',
            totalAmount: totalAmount,
            saleDate: sale.createDate,
            vendedor: sale.vendedor,
            repartidor: ''
          }
          this.dialog.open(TicketDialogComponent, {
            width: '200px',
            height: '70%',
            data: {
              sale: newSale,             // Info general del ticket
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

  openDetailsNoteCredit(sale: CreditNoteListDTO): void {
    const request = { noteCreditId: sale.noteCreditId };

    this.salesService.detailsNoteCreditById(request).subscribe({
      next: (response) => {
        if (response.result) {
          this.dialog.open(DetailsCreditNoteComponent, {
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

  openStatusDialog(note: CreditNoteListDTO): void {
    const dialogRef = this.dialog.open(ConfirmNoteCreditComponent, {
      width: '400px',
      data: { noteCreditId: note.noteCreditId, saleId: note.saleId, isWarehouse: false }
    });

    dialogRef.afterClosed().subscribe((comment: string | undefined) => {
      if (comment !== undefined) {
        const request: ApproveCreditNoteRequest = {
          noteCreditId: note.noteCreditId,
          commentsCollection: comment
        }

        this.isLoading = true;
        
        this.collectionService.approveCreditNoteByCollection(request).subscribe({
          next: (response) => {
            if (response.result) {
              this.snackBar.open('Nota de Crédito Aprobada, se turna a Almacén', 'Cerrar', { duration: 3000 });
              this.loadCreditNotes();
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

  tabTitle(): string {
    return this.selectedTabIndex === 0 ? 'Pendientes' : 'Confirmadas';
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

    const logoImg = new Image();
    logoImg.src = 'assets/logos/inventory.png';

    logoImg.onload = () => {
      const start = new Date(this.filterForm.value.startDate);
      const end   = new Date(this.filterForm.value.endDate);

      const fechaInicio = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin    = end.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaGeneracion = new Date().toLocaleString('es-MX');

      // Encabezado
      doc.addImage(logoImg, 'PNG', 10, 7, 36, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FARMA APOYO', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cobranza - Notas de Crédito (${this.tabTitle()})`, pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Del ${fechaInicio} al ${fechaFin}`, pageWidth / 2, 38, { align: 'center' });
      doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, 42, { align: 'center' });

      // Columnas (de tu displayedColumns para notas)
      const columns = [
        'No. Nota',          // noteCreditId
        'No. Ticket',        // saleId
        'Cliente',           // clientName
        'Vendedor',          // vendedor
        'Monto Nota',        // finalCreditAmount
        'Comentarios',       // comments
        'Fecha',             // createDate
        'Creado por'         // createdBy
      ];

      // Filas
      const rows = this.dataSource.data.map(n => ([
        n.noteCreditId,
        n.saleId,
        n.clientName,
        n.vendedor,
        formatter.format(n.finalCreditAmount),
        n.comments ?? '',
        new Date(n.createDate).toLocaleString('es-MX'),
        n.createdBy
      ]));

      // Subtotales
      const totalNotas = this.dataSource.data.length;
      const totalMonto = this.dataSource.data.reduce((acc, n) => acc + (n.finalCreditAmount || 0), 0);

      rows.push([
        'Total de registros:',
        totalNotas.toString(),
        '',
        'Subtotal',
        formatter.format(totalMonto),
        '',
        '',
        ''
      ]);

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 9 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' }, // No. Nota
          1: { halign: 'center' }, // No. Ticket
          4: { halign: 'right' },  // Monto Nota
          6: { halign: 'center' }, // Fecha
        },
        didDrawPage: () => {
          const str = `Página ${doc.getNumberOfPages()}`;
          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
      });

      const nombreArchivo = `NotasCredito_${this.tabTitle()}_${new Date().toLocaleDateString('es-MX')}.pdf`;
      doc.save(nombreArchivo);
    };
  }

  // ---------- Excel ----------
  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // Mapea datos
    const dataToExport = this.dataSource.data.map(n => ({
      'No. Nota': n.noteCreditId,
      'No. Ticket': n.saleId,
      'Cliente': n.clientName,
      'Vendedor': n.vendedor,
      'Monto Nota': n.finalCreditAmount,   // numérico
      'Comentarios': n.comments ?? '',
      'Fecha': new Date(n.createDate),     // date
      'Creado por': n.createdBy
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });

    // Formatos de columnas: E = Monto Nota (índice 4), G = Fecha (índice 6)
    const range = XLSX.utils.decode_range(ws['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      const montoCell = ws[XLSX.utils.encode_cell({ r: R, c: 4 })];
      const fechaCell = ws[XLSX.utils.encode_cell({ r: R, c: 6 })];

      if (montoCell) {
        montoCell.t = 'n';
        montoCell.z = '"$"#,##0.00';
      }
      if (fechaCell) {
        fechaCell.z = 'dd/mm/yyyy hh:mm';
      }
    }

    // Fila de totales al final
    const totalReg = this.dataSource.data.length;
    const totalMonto = this.dataSource.data.reduce((acc, n) => acc + (n.finalCreditAmount || 0), 0);

    const lastRow = (range.e.r ?? 0) + 2; // +1 por 1-based +1 para siguiente fila
    XLSX.utils.sheet_add_aoa(ws, [[
      'Total de registros:', totalReg, '', 'Subtotal', totalMonto, '', '', ''
    ]], { origin: `A${lastRow}` });

    // Formatea la celda del total de monto (col E) de la fila de totales
    const totalMontoCell = XLSX.utils.encode_cell({ r: lastRow - 1, c: 4 });
    if (ws[totalMontoCell]) {
      ws[totalMontoCell].t = 'n';
      ws[totalMontoCell].z = '"$"#,##0.00';
    }

    const sheetName = `Notas (${this.tabTitle()})`;
    const wb: XLSX.WorkBook = { Sheets: { [sheetName]: ws }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blob, `NotasCredito_${this.tabTitle()}_${date}.xlsx`);
  }
}
