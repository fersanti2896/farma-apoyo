import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, map, startWith } from 'rxjs';
import { ProductBySupplierDTO } from '../../../interfaces/product.interface';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-product-dialog',
  standalone: false,
  templateUrl: './product-dialog.component.html'
})
export class ProductDialogComponent {
  public form!: FormGroup;
  public products: ProductBySupplierDTO[];
  public productControl = new FormControl<ProductBySupplierDTO | null>(null, Validators.required);
  public filteredProducts!: Observable<ProductBySupplierDTO[]>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: ProductBySupplierDTO[]
  ) {
    this.products = data;
    this.form = this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      lot: ['', [ Validators.required ]],
      expirationDate: [null, [ Validators.required ]]
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.form, field );
  }

  ngOnInit(): void {
    this.filteredProducts = this.productControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const filterValue = typeof value === 'string'
          ? value.toLowerCase()
          : value?.productName?.toLowerCase() ?? '';

        return this.products.filter(product =>
          product.productName.toLowerCase().includes(filterValue)
        );
      })
    );

    this.productControl.valueChanges.subscribe((product) => {
      if (typeof product !== 'string' && product) {
        this.form.patchValue({
          productId: product.productId
        });
      }
    });
  }

  displayProductFn(product: ProductBySupplierDTO): string {
    return product?.productName ?? '';
  }

  onSave(): void {
    if (this.form.invalid || !this.productControl.value) {
      this.form.markAllAsTouched();

      return;
    };

    const selected = this.productControl.value;
    const result = {
      ...this.form.value,
      productName: selected.productName
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
