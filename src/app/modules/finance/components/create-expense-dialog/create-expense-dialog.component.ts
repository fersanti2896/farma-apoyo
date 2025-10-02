import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpensePaymentRequest, ExpensesCategoriesDTO } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../services/finance.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalStateService } from '../../../../shared/services';

@Component({
  selector: 'app-create-expense-dialog',
  standalone: false,
  templateUrl: './create-expense-dialog.component.html',
})
export class CreateExpenseDialogComponent {
  public RolId: number = 0;
  public loading = false;
  public form: FormGroup;
  public categories: ExpensesCategoriesDTO[] = [];
  public paymentMethods: { value: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private dialogRef: MatDialogRef<CreateExpenseDialogComponent>,
    private globalStateService: GlobalStateService,
    @Inject(MAT_DIALOG_DATA) public data: {
      categories: ExpensesCategoriesDTO[];
      paymentMethods: { value: string; label: string }[];
    }
  ) {
    this.categories = data.categories ?? [];
    this.paymentMethods = data.paymentMethods ?? [];

    this.form = this.fb.group({
      expenseCategoryId: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: [null, Validators.required],
      comments: ['', Validators.required],
    });

    const { roleId } = this.globalStateService.getUser()
    this.RolId = roleId;
  }

  isInvalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  cancelar(): void {
    this.dialogRef.close({ created: false });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: ExpensePaymentRequest = this.form.value;

    this.loading = true;
    this.financeService.createExpense(payload).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ created: true });
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
