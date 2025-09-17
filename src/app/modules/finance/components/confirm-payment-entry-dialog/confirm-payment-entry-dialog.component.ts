import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BalaceTSupplierDTO } from '../../../interfaces/supplier.interface';
import { ConfirmPaymentEntryData } from '../../../interfaces/finance.interface';
import { FinanceService } from '../../services/finance.service';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-confirm-payment-entry-dialog',
  standalone: false,
  templateUrl: './confirm-payment-entry-dialog.component.html',
})
export class ConfirmPaymentEntryDialogComponent implements OnInit {
  public loading: boolean = false;
  public form!: FormGroup;
  public supplierBalance?: BalaceTSupplierDTO;
  public loadingChips = true;

  private readonly THIRD_PARTY_METHOD = 'Pago Cuenta de Tercero';

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private validatorsService: ValidatorsService,
    private proveedoresService: ProveedoresService,
    private dialogRef: MatDialogRef<ConfirmPaymentEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmPaymentEntryData
  ) {
    this.form = this.fb.group({
      amount: [
        this.data.amountPending ?? null,
        [Validators.required, Validators.min(0.01), this.thirdPartyMaxValidator]
      ],
      method: [null, Validators.required],
      comments: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBalacenSupplier();

    this.form.get('method')!.valueChanges.subscribe(() => {
      this.form.get('amount')!.updateValueAndValidity();
    });
  }

  get isThirdParty(): boolean {
    return (this.form?.get('method')?.value ?? '') === this.THIRD_PARTY_METHOD;
  }

  thirdPartyMaxValidator = (ctrl: AbstractControl) => {
    const amount = Number(ctrl.value ?? 0);

    // method desde el mismo form group
    const method = ctrl.parent?.get('method')?.value as string | undefined;
    const isThirdParty = method === this.THIRD_PARTY_METHOD;

    if (!isThirdParty) return null;

    const max = Number(this.supplierBalance?.thirdPartyBalance ?? 0);
    return amount > max ? { exceedThirdParty: { max } } : null;
  };


  loadBalacenSupplier(): void {
    this.loadingChips = true;
    this.proveedoresService.balacesSupplier({ supplierId: this.data.supplierId }).subscribe({
      next: (res) => {
        this.supplierBalance = res.result ?? {
          supplierId: this.data.supplierId,
          businessName: this.data.businessName,
          balance: 0,
          thirdPartyBalance: 0
        };
        this.loadingChips = false;
        // ✅ revalidar con el saldo ya cargado
        this.form.get('amount')?.updateValueAndValidity();
      },
      error: () => {
        this.supplierBalance = {
          supplierId: this.data.supplierId,
          businessName: this.data.businessName,
          balance: 0,
          thirdPartyBalance: 0
        };
        this.loadingChips = false;
        this.form.get('amount')?.updateValueAndValidity();
      }
    });
  }

  isValidField = (field: string) => this.validatorsService.isValidField(this.form, field);

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

    if (this.isThirdParty && amount > (this.supplierBalance?.thirdPartyBalance ?? 0)) {
      this.form.get('amount')?.setErrors({
        exceedThirdParty: { max: this.supplierBalance?.thirdPartyBalance ?? 0 }
      });

      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      entryId: this.data.entryId,
      supplierId: this.data.supplierId,
      amount: Number(amount),
      paymentMethod: method,
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
