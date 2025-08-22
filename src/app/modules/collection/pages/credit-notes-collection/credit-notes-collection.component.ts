import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatTableDataSource } from '@angular/material/table';

import { ClientDTO } from '../../../interfaces/client.interface';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { CollectionService } from '../../services/collection.service';
import { ApproveCreditNoteRequest, CreditNoteListDTO, CreditNoteListRequest } from '../../../interfaces/collection.interface';
import { DetailsCreditNoteComponent } from '../../components/details-credit-note/details-credit-note.component';
import { PackagingService } from '../../../packaging/services/packaging.service';
import { SalesService } from '../../../sales/services/sales.service';
import { TicketDialogComponent } from '../../../packaging/components/ticket-dialog/ticket-dialog.component';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { UserService } from '../../../usuarios/services/user.service';
import { ConfirmNoteCreditComponent } from '../../components/confirm-note-credit/confirm-note-credit.component';
import { SaleDTO } from '../../../interfaces/sale.interface';

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
    this.loadCreditNotes(); // carga pestaña inicial = Pendientes
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ---------- Filtros ----------
  initFilters(): void {
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);

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
    // 0 => Pendientes(11); 1 => Confirmadas(13)
    return this.selectedTabIndex === 0 ? 11 : 13;
  }

  private buildRequest(): CreditNoteListRequest {
    const { startDate, endDate, clientId, salesPersonId } = this.filterForm.value;
    return {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      clientId: clientId || 20,
      salesPersonId: salesPersonId || 20,
      saleStatusId: this.currentStatusId(), // <- importante
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
}
