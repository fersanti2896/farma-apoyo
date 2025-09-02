import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { jsPDF } from 'jspdf';

import { ClientDTO } from '../../../interfaces/client.interface';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { DetailsMultipleSalesRequest, SaleDTO, SalesByStatusRequest, UpdateSaleStatusRequest } from '../../../interfaces/sale.interface';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GlobalStateService } from '../../../../shared/services';
import { PackagingService } from '../../services/packaging.service';
import { TicketDialogComponent } from '../../components/ticket-dialog/ticket-dialog.component';
import { UpdateStatusDialogComponent } from '../../components/update-status-dialog/update-status-dialog.component';
import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { UserService } from '../../../usuarios/services/user.service';

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
  public filterForm!: FormGroup;
  public users: UsersDTO[] = [];
  public clients: ClientDTO[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private packingService: PackagingService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private userService: UserService,
    private clientService: ClientesService
  ) { }

  ngOnInit(): void {
    this.initFilters();
    this.loadSales();
    this.loadUser();
    this.loadClients();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = ['saleId', 'businessName', 'vendedor', 'statusName', 'totalAmount', 'saleDate', 'actions'];
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
    this.filterForm = this.fb.group({
      clientId: [null],
      salesPersonId: [null],
    });
  }

  loadUser(): void {
    this.userService.listUsers().subscribe({
      next: (res) => {
        if (res.result) this.users = res.result;
      }
    });
  }

  loadClients(): void {
    this.clientService.listClients().subscribe({
      next: (res) => {
        if (res.result) this.clients = res.result;
      }
    });
  }

  filterSales(): void {
    this.loadSales();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      clientId: null,
      salesPersonId: null
    });

    this.loadSales();
  }

  loadSales(): void {
    this.isLoading = true;

    const { clientId, salesPersonId } = this.filterForm.value;

    const data: SalesByStatusRequest = {
      saleStatusId: 2,
      clientId: clientId || 20000,
      salesPersonId: salesPersonId || 20000,
    }

    this.packingService.listSales(data).subscribe({
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

  visibleRows(): SaleDTO[] {
    const all = this.dataSource.filteredData ?? this.dataSource.data ?? [];

    if (!this.paginator) return all;

    const start = this.paginator.pageIndex * this.paginator.pageSize;
    const end = start + this.paginator.pageSize;
    
    return all.slice(start, end);
  }

  getVisibleSaleIds(): number[] { return this.visibleRows().map(r => r.saleId); }

  fetchVisibleDetails(): void {
    const sales = this.getVisibleSaleIds();

    if (!sales.length) {
      this.snackBar.open('No hay tickets visibles para consultar.', 'Cerrar', { duration: 2500 });
      return;
    }

    const payload: DetailsMultipleSalesRequest = { saleId: sales};
    this.isLoading = true;

    this.packingService.multipleDetailsSales(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        const tickets = res?.result ?? [];

        if (!tickets.length) {
          this.snackBar.open('Sin detalles para los tickets visibles.', 'Cerrar', { duration: 2500 });
          return;
        }

        this.printMultipleTickets(tickets);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al obtener detalles múltiples:', err);
        this.snackBar.open('Error al obtener detalles múltiples.', 'Cerrar', { duration: 3000 });
      }
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
      data: { saleId: entry.saleId, isPackaging: true }
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

  // Carga el logo una sola vez
  preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  // Estima la altura del ticket según sus textos y productos
  estimateTicketHeight(ticket: any): number {
    // base ~130mm + filas de productos (~9mm c/u) + textos variables
    const base = 130;
    const perProduct = 9 * (ticket.products?.length ?? 0);

    // Ajustes por longitud de repartidor y cliente (muy aproximado)
    const extraRepartidor = 6; // unas 1-2 líneas
    const extraCliente = Math.ceil((ticket.bussinessName?.length ?? 0) / 24) * 4 + 6;

    // Total en letras (puede ser varias líneas)
    const letras = (window as any).numeroALetras
      ? (window as any).numeroALetras(ticket.totalAmount)
      : '';
    const extraLetras = Math.max(6, Math.ceil((letras?.length ?? 0) / 24) * 4);

    const total = base + perProduct + extraRepartidor + extraCliente + extraLetras;
    // Mínimo razonable para que no quede muy corto
    return Math.max(total, 150);
  }

  // Convierte un número a letras usando tu helper global numeroALetras
  totalEnLetras(n: number): string {
    return (window as any).numeroALetras ? (window as any).numeroALetras(n) : '';
  }

  // Imprime TODOS los tickets en un solo PDF (cada ticket = 1 página)
  async printMultipleTickets(tickets: any[]): Promise<void> {
    const logo = await this.preloadImage('assets/logos/inventory.png');

    // Creamos el doc con el tamaño de la PRIMERA página (lo ajustaremos por página con addPage)
    const firstHeight = this.estimateTicketHeight(tickets[0]);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [55, firstHeight]  // ancho 55mm, alto dinámico
    });

    // Render de la primera página
    this.renderTicketPage(doc, tickets[0], logo);

    // Render de las siguientes páginas
    for (let i = 1; i < tickets.length; i++) {
      const h = this.estimateTicketHeight(tickets[i]);
      (doc as any).addPage([55, h]);
      this.renderTicketPage(doc, tickets[i], logo);
    }

    // Abrimos el PDF en una pestaña (para impresión directa, usa doc.autoPrint();)
    window.open(doc.output('bloburl'), '_blank');
  }

  renderTicketPage(doc: jsPDF, ticket: any, logo: HTMLImageElement): void {
    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 2
    });

    const date = new Date(ticket.createDate);
    const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('es-MX');

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 6;

    // LOGO
    doc.addImage(logo, 'PNG', pageWidth / 2 - 12, y, 25, 18);
    y += 18;

    // Encabezado
    doc.setFontSize(10);
    (doc as any).setFont('courier', 'bold');
    doc.text('DISTRIBUIDORA', pageWidth / 2, y + 2, { align: 'center' }); y += 4;
    doc.text('FARMACÉUTICA', pageWidth / 2, y + 2, { align: 'center' }); y += 6;

    doc.text('VENDEDOR', pageWidth / 2, y + 2, { align: 'center' }); y += 4;
    doc.text(ticket.vendedor || '—', pageWidth / 2, y + 2, { align: 'center' }); y += 6;

    doc.setDrawColor(150);
    doc.line(5, y, pageWidth - 5, y); y += 4;

    doc.setFontSize(11);
    doc.text(`TICKET: ${ticket.saleId}`, 5, y); y += 5;

    doc.setFontSize(10);
    (doc as any).setFont('courier', 'normal');
    doc.text(`HORA: ${timeStr}`, 5, y); y += 4;
    doc.text(`FECHA: ${dateStr}`, 5, y); y += 4;
    doc.text(`REPARTIDOR:`, 5, y); y += 4;

    // Repartidor (viene en products[0].repartidor en tu response)
    const repartidor = ticket.products?.[0]?.repartidor ?? 'Sin Asignar';
    const repartidorLines = (doc as any).splitTextToSize(repartidor, pageWidth - 10);
    repartidorLines.forEach((line: string) => { doc.text(line, 5, y); y += 4; });

    doc.line(5, y, pageWidth - 5, y); y += 4;

    // Productos
    (ticket.products || []).forEach((p: any) => {
      (doc as any).setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(p.productName, 5, y); y += 4;

      const qtyStr = `${p.quantity} x ${formatter.format(p.unitPrice)}`;
      const totalStr = formatter.format(p.subTotal);
      doc.text(qtyStr, 5, y);
      doc.text(totalStr, pageWidth - 5, y, { align: 'right' });
      y += 5;
    });

    doc.line(5, y, pageWidth - 5, y); y += 5;

    (doc as any).setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 5, y);
    doc.text(formatter.format(ticket.totalAmount), pageWidth - 5, y, { align: 'right' });
    y += 4;

    // Total en letras
    doc.setFontSize(8);
    (doc as any).setFont('courier', 'italic');
    const letrasMonto = (doc as any).splitTextToSize(this.totalEnLetras(ticket.totalAmount), pageWidth - 10);
    doc.text(letrasMonto, pageWidth / 2, y, { align: 'center' });
    y += letrasMonto.length * 4;

    // Cliente
    (doc as any).setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text('CLIENTE:', pageWidth / 2, y, { align: 'center' });
    y += 4;

    const clienteLines = (doc as any).splitTextToSize(ticket.bussinessName ?? '', pageWidth - 10);
    clienteLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 4;
    });

    doc.line(5, y, pageWidth - 5, y); y += 5;

    // Footer
    doc.setFontSize(8);
    (doc as any).setFont('courier', 'bold');
    doc.text('DUDAS O ACLARACIONES', pageWidth / 2, y, { align: 'center' }); y += 4;
    doc.text('farma.apoyo.oficial@gmail.com', pageWidth / 2, y, { align: 'center' }); y += 4;
    doc.text('OFICINA: 55-83-24-81-85', pageWidth / 2, y, { align: 'center' }); y += 6;

    doc.setFontSize(9);
    (doc as any).setFont('courier', 'bold');
    doc.text('GRACIAS POR SU COMPRA', pageWidth / 2, y, { align: 'center' });
  }
}
