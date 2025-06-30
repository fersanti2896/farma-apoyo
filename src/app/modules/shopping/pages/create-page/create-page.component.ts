import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ShoppingService } from '../../services/shopping.service';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { SupplierDTO } from '../../../interfaces/supplier.interface';
import { CreateWarehouseRequest, ProductsDetailsDTO, ProductView } from '../../../interfaces/entrey-sumarry.interface';
import { ProductDialogComponent } from '../../components/product-dialog/product-dialog.component';

@Component({
  selector: 'modules-shopping-create-page',
  standalone: false,
  templateUrl: './create-page.component.html'
})
export class CreatePageComponent {
  public form!: FormGroup;
  public suppliers: SupplierDTO[] = [];
  public products: ProductView[] = [];
  public productDisplayedColumns: string[] = ['productName', 'quantity', 'unitPrice', 'subtotal', 'actions'];
  public isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private shoppingService: ShoppingService,
    private proveedoresService: ProveedoresService,
    private dialog: MatDialog,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      supplierId: [null],
      invoiceNumber: [''],
      expectedPaymentDate: [null],
      observations: ['']
    });

    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.proveedoresService.listSupliers().subscribe(res => {
      this.suppliers = res.result ?? [];
    });
  }

  onSupplierSelected(supplierId: number): void {
    // Actualizar productos disponibles si se quiere usar en el modal
  }

  openProductDialog(): void {
    const supplierId = this.form.get('supplierId')?.value;
    if (!supplierId) return;

    this.shoppingService.getProductsBySupplierId({ supplierId }).subscribe({
      next: (response) => {
        const productList = response.result;

        const dialogRef = this.dialog.open(ProductDialogComponent, {
          width: '500px',
          data: productList
        });

        dialogRef.afterClosed().subscribe((result: ProductView) => {
          if (result) {
            const alreadyExists = this.products.some(p => p.productProviderId === result.productProviderId);
            
            if (alreadyExists) {
              this.snackBar.open('Este producto ya fue agregado.', 'Cerrar', {
                duration: 3000,
                panelClass: 'snack-warn'
              });
            } else {
              this.products = [...this.products, result];
              this.snackBar.open('Producto agregado correctamente.', 'Cerrar', {
                duration: 2000,
                panelClass: 'snack-success'
              });
            }
          }
        });
        
      },
      error: () => {
        this.snackBar.open('Error al cargar productos.', 'Cerrar', { duration: 3000, panelClass: 'snack-error' });
      }     
    });
  }

  getTotalAmount(): number {
    return this.products.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }

  removeProduct(index: number): void {
    this.products.splice(index, 1);
    this.products = [...this.products]; // Refresca la tabla
    this.snackBar.open('Producto eliminado.', 'Cerrar', { duration: 2000, panelClass: 'snack-warn' });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }
    console.log('Estoy aqui 1')
    const { supplierId, invoiceNumber, expectedPaymentDate, observations, price } = this.form.value;

    const totalAmount = this.products.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    const payload: CreateWarehouseRequest = {
      supplierId,
      invoiceNumber,
      expectedPaymentDate,
      observations,
      totalAmount: totalAmount,
      products: this.products.map(p => ({
        productProviderId: p.productProviderId,
        quantity: p.quantity,
        unitPrice: p.unitPrice
      }))
    };

    console.log('Payload', payload)
    
    this.isLoading = true;
    
    this.shoppingService.createWarehouse(payload).subscribe({
      next: () => {
        this.snackBar.open('Nota registrada correctamente.', 'Cerrar', {
          duration: 3000,
          panelClass: 'snack-success'
        });
        this.onCancel();
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Error al registrar la nota.', 'Cerrar', {
          duration: 3000,
          panelClass: 'snack-error'
        });
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.form.reset();
    this.products = [];
  }

  goBack() {
    this.location.back();
  }
}
