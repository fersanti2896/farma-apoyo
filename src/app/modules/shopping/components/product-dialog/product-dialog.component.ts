import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductBySupplierDTO } from '../../../interfaces/product.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-product-dialog',
  standalone: false,
  templateUrl: './product-dialog.component.html'
})
export class ProductDialogComponent {
  public form!: FormGroup;
  public products: ProductBySupplierDTO[];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductBySupplierDTO[]
  ) {
    this.products = data;
    this.form = this.fb.group({
      productProviderId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  onSave(): void {
    const selected = this.products.find(p => p.productProviderId === this.form.value.productProviderId);
    const result = {
      ...this.form.value,
      productName: selected?.productName || ''
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
