import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { map, Observable, startWith } from 'rxjs';

import { ProductStockDTO } from '../../../interfaces/product.interface';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-product-dialog',
  standalone: false,
  templateUrl: './product-dialog.component.html'
})
export class ProductDialogComponent {
  public form!: FormGroup;
  public products: ProductStockDTO[];
  public productControl = new FormControl<ProductStockDTO | null>(null, Validators.required);
  public filteredProducts!: Observable<ProductStockDTO[]>;
  public invalidPrice: boolean = false;
  public invalidStock: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: ProductStockDTO[]
  ) {
    this.products = data;
    this.form = this.fb.group({
      productId: [null, Validators.required],
      productName: ['', [ Validators.required ] ],
      quantity: [null, [Validators.required, Validators.min(1)]],
      customPrice: ['', [ Validators.required, Validators.min(0.01) ]],
      stockReal: [null],
      defaultPrice: [null]
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.form, field );
  }

  ngOnInit(): void {
    this.filteredProducts = this.productControl.valueChanges.pipe(
      startWith(),
      map(value => {
        const filterValue = typeof value === 'string'
          ? value
          : value?.productName?.toLowerCase() ?? '';

        return this.products.filter(product =>
          product.productName.toLowerCase().includes(filterValue)
        );
      })
    );

    this.productControl.valueChanges.subscribe((product) => {
      if (typeof product !== 'string' && product) {
        this.form.patchValue({
          productId: product.productId,
          productName: product.productName,
          stockReal: product.stockReal,
          defaultPrice: product.price
        });
      }
    });
  }

  displayProductFn(product: ProductStockDTO): string {
    return product?.productName ?? '';
  }

  onSave(): void {
    if (this.form.invalid || !this.productControl.value) {
      this.form.markAllAsTouched();
      return;
    }

    const { customPrice, defaultPrice, stockReal, quantity } = this.form.value;

    // Validación de precio mínimo
    if (customPrice < defaultPrice) {
      this.invalidPrice = true;
      return;
    }

    this.invalidPrice = false;

    // Validación de cantidad
    if( quantity > stockReal ) {
      this.invalidStock = true;
      return;
    }

    this.invalidStock = false;

    const result = {
      ...this.form.value
    };

    this.dialogRef.close(result);
  }


  onCancel(): void {
    this.dialogRef.close();
  }
}
