import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CollectionService } from '../../services/collection.service';
import { MultiplePaymentDialogData } from '../../../interfaces/collection.interface';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-multiple-payment-dialog',
  standalone: false,
  templateUrl: './multiple-payment-dialog.component.html'
})
export class MultiplePaymentDialogComponent {
  public loading = false;
  public form!: FormGroup;

  get totalSeleccionado(): number {
    return this.data.selected.reduce((a, b) => a + (b.amount || 0), 0);
  }

  constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    private validatorsService: ValidatorsService,
    private dialogRef: MatDialogRef<MultiplePaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MultiplePaymentDialogData
  ) {
    this.form = this.fb.group({
      method: [ null, Validators.required ],
      comments: [ '', Validators.required ]
    });
  }

  cancelar(): void {
    this.dialogRef.close({ applied: false });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.form, field );
  }

  aplicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { method, comments } = this.form.value;

    // Construimos el request con el total de cada ticket (saldo pendiente)
    const request = {
      sales: this.data.selected.map(s => ({ saleId: s.saleId, amount: s.amount })),
      method,
      comments: comments,
      paymentDate: new Date(this.data.paymentDate).toISOString()
    };

    this.loading = true;
    this.collectionService.applicationMultiplePayment(request).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ applied: true });
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
