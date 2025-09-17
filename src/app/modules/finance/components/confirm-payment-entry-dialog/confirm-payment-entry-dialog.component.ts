import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmPaymentEntryData } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../services/finance.service';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-confirm-payment-entry-dialog',
  standalone: false,
  templateUrl: './confirm-payment-entry-dialog.component.html',
})
export class ConfirmPaymentEntryDialogComponent {
  public loading: boolean = false;
  public form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private validatorsService: ValidatorsService,
    private dialogRef: MatDialogRef<ConfirmPaymentEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmPaymentEntryData
  ) {
    this.form = this.fb.group({
      amount: [
        this.data.amountPending ?? null,
        [Validators.required, Validators.min(0.01)]
      ],
      method: [null, Validators.required],
      comments: ['', Validators.required]
    });
  }

  isValidField = (field: string) =>
    this.validatorsService.isValidField(this.form, field);

  cancelar(): void {
    this.dialogRef.close({ applied: false });
  }

  aplicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { amount, method, comments } = this.form.value;

    // Validación adicional: amount ≤ amountPending
    if (amount > this.data.amountPending) {
      this.form.get('amount')?.setErrors({ exceedPending: true });
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      entryId: this.data.entryId,
      supplierId: this.data.supplierId,
      amount: Number(amount),
      paymentMethod: method,
      // SIN paymentDate (no se requiere)
      comments
    };

    this.loading = true;

    this.financeService.applyPaymentEntry(payload).subscribe({
      next: (response) => {
        console.log(response)
        this.loading = false;
        this.dialogRef.close({ applied: true });
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
