import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, map, startWith } from 'rxjs';
import { ProductDTO } from '../../../interfaces/product.interface';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-product-dialog',
  standalone: false,
  templateUrl: './product-dialog.component.html'
})
export class ProductDialogComponent {
  public form!: FormGroup;
  public products: ProductDTO[];
  public productControl = new FormControl<ProductDTO | null>(null, Validators.required);
  public filteredProducts!: Observable<ProductDTO[]>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: ProductDTO[]
  ) {
    this.products = data;
    this.form = this.fb.group({
      productId: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      // unitPrice: [null, [Validators.required, Validators.min(0.01)]],
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

  displayProductFn(product: ProductDTO): string {
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
