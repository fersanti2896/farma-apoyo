import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';
import { Router } from '@angular/router';

import { ShoppingService } from '../../services/shopping.service';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { SupplierDTO } from '../../../interfaces/supplier.interface';
import { CreateWarehouseRequest, ProductView } from '../../../interfaces/entrey-sumarry.interface';
import { ProductDialogComponent } from '../../components/product-dialog/product-dialog.component';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'modules-shopping-create-page',
  standalone: false,
  templateUrl: './create-page.component.html'
})
export class CreatePageComponent {
  public form!: FormGroup;
  public suppliers: SupplierDTO[] = [];
  public products: ProductView[] = [];
  public productDisplayedColumns: string[] = ['productName', 'quantity', 'unitPrice', 'lot', 'expirationDate', 'subtotal', 'actions'];
  public isLoading: boolean = false;
  public supplierControl = new FormControl<SupplierDTO | null>(null);
  public filteredSuppliers!: Observable<SupplierDTO[]>;

  constructor(
    private fb: FormBuilder,
    private shoppingService: ShoppingService,
    private proveedoresService: ProveedoresService,
    private dialog: MatDialog,
    private location: Location,
    private snackBar: MatSnackBar,
    private router: Router,
    private validatorsService: ValidatorsService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      supplierId: ['', [ Validators.required ] ],
      invoiceNumber: ['', [ Validators.required ] ],
      expectedPaymentDate: [null],
      observations: ['']
    });

    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.proveedoresService.listSupliers().subscribe(res => {
      this.suppliers = res.result ?? [];

      this.filteredSuppliers = this.supplierControl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const searchValue = typeof value === 'string' ? value.toLowerCase() : value?.businessName?.toLowerCase() ?? '';
          return this.suppliers.filter(s =>
            s.businessName.toLowerCase().includes(searchValue)
          );
        })
      );
    });
  }

  displayFn(supplier: SupplierDTO): string {
    return supplier?.businessName ?? '';
  }

  onSupplierSelected(supplier: SupplierDTO): void {
    this.form.get('supplierId')?.setValue(supplier?.supplierId);
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.form, field );
  }

  openProductDialog(): void {
    const supplierId = this.form.get('supplierId')?.value;
    if (!supplierId) return;

    this.shoppingService.getProducts({ supplierId }).subscribe({
      next: (response) => {
        const productList = response.result;

        const dialogRef = this.dialog.open(ProductDialogComponent, {
          width: '500px',
          data: productList
        });

        dialogRef.afterClosed().subscribe((result: ProductView) => {
          if (result) {
            const alreadyExists = this.products.some(p => p.productId === result.productId);

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
    this.products = [...this.products];
    this.snackBar.open('Producto eliminado.', 'Cerrar', { duration: 2000, panelClass: 'snack-warn' });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }
    if (this.products.length === 0) {
      this.snackBar.open('Debe agregar al menos un producto.', 'Cerrar', {
        duration: 3000,
        panelClass: 'snack-warn'
      });

      return;
    }

    const { supplierId, invoiceNumber, expectedPaymentDate, observations, price } = this.form.value;
    const totalAmount = this.products.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    const payload: CreateWarehouseRequest = {
      supplierId,
      invoiceNumber,
      expectedPaymentDate,
      observations,
      totalAmount: totalAmount,
      products: this.products.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        lot: p.lot,
        expirationDate: p.expirationDate
      }))
    };

    this.isLoading = true;

    this.shoppingService.createWarehouse(payload).subscribe({
      next: () => {
        this.snackBar.open('Nota registrada correctamente.', 'Cerrar', {
          duration: 3000,
          panelClass: 'snack-success'
        });
        this.onCancel();
        this.isLoading = false;

        setTimeout(() => {
          this.router.navigate(['/sic/inicio/compras'])
        }, 100);
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
