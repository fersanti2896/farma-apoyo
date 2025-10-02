import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { GlobalStateService } from '../../../../shared/services';
import { ProductDTO, StatusProductRequest } from '../../../interfaces/product.interface';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'modules-products-list-page',
  standalone: false,
  templateUrl: './list-page.component.html',
})
export class ListPageComponent {
  public displayedColumns: string[] = [];
  public dataSource = new MatTableDataSource<ProductDTO>();
  public isLoading: boolean = false;
  public rol: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productsService: ProductService,
    private globalStateService: GlobalStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGetProducts();

    const { roleId } = this.globalStateService.getUser();
    this.rol = roleId;

    this.displayedColumns = [
      'productId',
      'productName',
      'price',
      'barcode',
      'unit',
      ...(this.rol !== 5 && this.rol !== 6 ? ['actions'] : [])
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

  loadGetProducts(): void {
    this.isLoading = true;

    this.productsService.listProducts().subscribe({
      next: (response) => {
        if (response.result) 
          this.dataSource.data = response.result;
        
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  editProduct(product: ProductDTO) {
    this.router.navigate(['/sic/inicio/productos/editar'], {
      state: { product }
    });
  }

  openConfirmDialog(product: ProductDTO): void {
    const newStatus = product.status === 1 ? 0 : 1;
    const action = newStatus === 0 ? 'bloquear' : 'desbloquear';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `¿Estás seguro de que deseas ${action} al producto ${product.productName}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.toggleProductStatus(product.productId, newStatus);
      }
    });
  }

  toggleProductStatus(productId: number, status: number): void {
    const request: StatusProductRequest = { productId, status };

    this.productsService.activeProduct( request ).subscribe({
      next: () => {
        this.snackBar.open(`Producto ${status === 1 ? 'activado' : 'desactivado'} correctamente.`, 'Cerrar', {
          duration: 3000,
        });
        this.loadGetProducts();
      },
      error: () => {
        this.snackBar.open('Error al actualizar el estado del producto.', 'Cerrar', { duration: 3000 });
      }
    });
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
      doc.text('Productos', pageWidth / 2, 28, { align: 'center' });


      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${date}`, pageWidth - 14, 28, { align: 'right' });

      const columns = ['ID', 'Nombre', 'Precio', 'Código de Barras', 'Unidad'];
      const rows = this.dataSource.data.map(entry => [
        entry.productId,
        entry.productName,
        formatter.format(entry.price),
        entry.barcode,
        entry.unit
      ]);

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 45,
        margin: { bottom: 30 },
        styles: { fontSize: 10 },
        headStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center' }
        },
        didDrawPage: (data) => {
          const str = `Página ${doc.getNumberOfPages()}`;

          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          });
        }
      });

      doc.save(`Productos_${date}.pdf`);
    };
  }

  exportToExcel(): void {
    const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    const dataToExport = this.dataSource.data.map(entry => ({
      ID: entry.productId,
      Nombre: entry.productName,
      Precio: entry.price,
      CodigoBarras: entry.barcode,
      Unidad: entry.unit
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true });
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    
    for (let R = 1; R <= range.e.r; ++R) {
      const montoCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 2 })];

      if (montoCell) {
        montoCell.t = 'n';
        montoCell.z = '"$"#,##0.00';
      }
    }

    const sheetName = 'Productos';
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    FileSaver.saveAs(blobData, `Productos_${date}.xlsx`);
  }
}
