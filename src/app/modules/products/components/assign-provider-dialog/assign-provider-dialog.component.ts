import { Component, Inject } from '@angular/core';
import { SupplierDTO } from '../../../interfaces/supplier.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../../services/product.service';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { CreateProductProviderRequest } from '../../../interfaces/product.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from '../../../../shared/services';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-assign-provider-dialog',
  standalone: false,
  templateUrl: './assign-provider-dialog.component.html'
})
export class AssignProviderDialogComponent {
  public suppliers: SupplierDTO[] = [];
  public relationForm!: FormGroup;
  public isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AssignProviderDialogComponent>,
    private productService: ProductService,
    private supplierService: ProveedoresService,
    private fb: FormBuilder,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: { productId: number },
    private snackBar: MatSnackBar,
  ) {
    this.loadSuppliers();
  }

  ngOnInit(): void {
    this.relationForm = this.fb.group({
      supplierId: ['', Validators.required],
      unitPrice: ['', Validators.required],
    });
  }

  loadSuppliers() {
    this.supplierService.listSupliers().subscribe({
      next: (response) => {
        if (response.result) {
          this.suppliers = response.result;
          console.log(response.result)
        }
      },
      error: () => console.log('Error al cargar el catalogo de proveedores'),
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.relationForm, field );
  }

  onSubmit() {
    if (this.relationForm.invalid) {
      this.relationForm.markAllAsTouched();

      return;
    }

    const { supplierId, unitPrice } = this.relationForm.value;
    this.isLoading = true;

    const body: CreateProductProviderRequest = {
      productId: this.data.productId,
      supplierId,
      unitPrice
    };

    this.productService.createProductProvider( body ).subscribe({
      next: (response) => {
        if(response.result) {
          this.snackBar.open(`Producto agregado correctamente`, 'Cerrar', { duration: 300, });
          this.isLoading = false;
          
          this.dialogRef.close(true);
        }
        
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(`${err.error.error.message}`, 'Cerrar', { duration: 3000 });
      }      
    });
  }
}
