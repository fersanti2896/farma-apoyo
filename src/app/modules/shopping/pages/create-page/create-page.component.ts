import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';

import { ShoppingService } from '../../services/shopping.service';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { SupplierDTO } from '../../../interfaces/supplier.interface';
import { CreateWarehouseRequest, ProductView, UpdateEntryPricesRequest } from '../../../interfaces/entrey-sumarry.interface';
import { ProductDialogComponent } from '../../components/product-dialog/product-dialog.component';
import { ValidatorsService } from '../../../../shared/services';
import { ProductService } from '../../../products/services/product.service';

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

  public isEditMode = false;
  public entryIdToUpdate: number | null = null;

  constructor(
    private fb: FormBuilder,
    private shoppingService: ShoppingService,
    private proveedoresService: ProveedoresService,
    private productsService: ProductService,
    private dialog: MatDialog,
    private location: Location,
    private snackBar: MatSnackBar,
    private router: Router,
    private validatorsService: ValidatorsService,
    private route: ActivatedRoute 
  ) { }

  ngOnInit(): void {
    const entryId = this.route.snapshot.paramMap.get('entryId');
    if (entryId) {
      this.isEditMode = true;
      this.entryIdToUpdate = +entryId;
    }

    this.form = this.fb.group({
      supplierId: this.isEditMode 
        ? [{ value: '', disabled: true }, Validators.required]
        : ['', Validators.required],
        
      invoiceNumber: this.isEditMode 
        ? [{ value: '', disabled: true }, Validators.required]
        : ['', Validators.required],

      expectedPaymentDate: [null],
      observations: ['']
    });

    this.loadSuppliers();

    if (this.isEditMode && this.entryIdToUpdate) {
      this.loadDataForEdit(this.entryIdToUpdate);
    }

    this.productDisplayedColumns = ['productName', 'quantity'];

    if (this.isEditMode) {
      this.productDisplayedColumns.push('unitPrice');
    }

    this.productDisplayedColumns.push('lot', 'expirationDate');

    if (this.isEditMode) {
      this.productDisplayedColumns.push('subtotal');
    } else {
      this.productDisplayedColumns.push('actions');
    }
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

  loadDataForEdit(entryId: number): void {
    this.isEditMode = true;
    this.entryIdToUpdate = entryId;
    this.isLoading = true;

    this.shoppingService.detailsFullEntryById({ entryId }).subscribe({
      next: (response) => {
        console.log(response)
        const result = response.result;
        if (result) {
          this.form.patchValue({
            supplierId: result.supplierId,
            invoiceNumber: result.invoiceNumber,
            expectedPaymentDate: result.expectedPaymentDate,
            observations: result.observations,
          });

          const supplier = this.suppliers.find(s => s.supplierId === result.supplierId);
          if (supplier) this.supplierControl.setValue(supplier);

          // Mapear a ProductView extendido con entryDetailId
          this.products = result.productsDetails.map(p => ({
            productId: p.productId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            expirationDate: p.expirationDate,
            lot: p.lot,
            productName: p.productName,
            entryDetailId: p.entryDetailId,
          }));

          this.isLoading = false;
        }
      },
      error: () => {
        this.snackBar.open('Error al cargar la nota para edición.', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
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
    this.productsService.listProducts().subscribe({
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
    if (this.form.invalid || this.products.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const { expectedPaymentDate, observations } = this.form.value;

    this.isLoading = true;

    if (this.isEditMode && this.entryIdToUpdate) {
      const updatePayload: UpdateEntryPricesRequest = {
        entryId: this.entryIdToUpdate,
        expectedPaymentDate,
        observations,
        products: this.products.map(p => ({
          entryDetailId: p.entryDetailId!,
          unitPrice: p.unitPrice
        }))
      };

      this.shoppingService.updateWarehouse(updatePayload).subscribe({
        next: () => {
          this.snackBar.open('Nota actualizada correctamente.', 'Cerrar', {
            duration: 3000,
            panelClass: 'snack-success'
          });
          this.router.navigate(['/sic/inicio/compras']);
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Error al actualizar la nota.', 'Cerrar', {
            duration: 3000,
            panelClass: 'snack-error'
          });
          this.isLoading = false;
        }
      });

      return;
    }

    // flujo de creación
    const { supplierId, invoiceNumber } = this.form.value;
    // const totalAmount = this.getTotalAmount();

    const createPayload: CreateWarehouseRequest = {
      supplierId,
      invoiceNumber,
      expectedPaymentDate,
      observations,
      totalAmount: 0,
      products: this.products.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: 0,
        lot: p.lot,
        expirationDate: p.expirationDate
      }))
    };

    this.shoppingService.createWarehouse(createPayload).subscribe({
      next: () => {
        this.snackBar.open('Nota registrada correctamente.', 'Cerrar', {
          duration: 3000,
          panelClass: 'snack-success'
        });
        this.router.navigate(['/sic/inicio/compras']);
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

  onPriceChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);

    if (!isNaN(value) && value >= 0) {
      this.products[index].unitPrice = value;
      this.recalculateTotal();
    }
  }

  recalculateTotal(): void {
    this.products = [...this.products];
  }

  onCancel(): void {
    this.form.reset();
    this.products = [];
  }

  goBack() {
    this.location.back();
  }
}
