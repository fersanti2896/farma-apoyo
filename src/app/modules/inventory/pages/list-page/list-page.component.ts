import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { GlobalStateService } from '../../../../shared/services';
import { InventoryService } from '../../services/inventory.service';
import { StockDTO } from '../../../interfaces/stock.interface';

@Component({
  selector: 'modules-inventory-list-page',
  standalone: false,
  templateUrl: './list-page.component.html'
})
export class ListPageComponent {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<StockDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private inventoryService: InventoryService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStock();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = [
      'inventoryId',
      'productName',
      'description',
      ...(this.rol !== 5 && this.rol !== 6 ? ['currentStock', 'apartado'] : []),
      'stockReal',
      'lastUpdateDate'
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

  loadStock(): void {
    this.isLoading = true;

    this.inventoryService.listStock().subscribe({
      next: (response) => {
        if (response.result) {
          let filteredStock = response.result;

          if (this.rol === 5) {
            filteredStock = filteredStock.filter(item => item.stockReal > 0);
          }

          this.dataSource.data = filteredStock;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
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
      doc.text('Stock Disponible', pageWidth / 2, 28, { align: 'center' });


      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = ['ID', 'Producto', 'Descripción', 'Stock', 'Última Entrada'];
      const rows = this.dataSource.data.map(entry => [
        entry.inventoryId,
        entry.productName,
        entry.description,
        `${entry.currentStock} piezas`,
        new Date(entry.lastUpdateDate).toLocaleDateString()
      ]);

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 10 },
        didDrawPage: (data) => {
          const str = `Página ${doc.getNumberOfPages()}`;

          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          });
        }
      });

      doc.save(`StockDisponible_${date}.pdf`);
    };
  }
}
