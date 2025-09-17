import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { CollectionService } from '../../services/collection.service';
import { MultiplePaymentDialogData } from '../../../interfaces/collection.interface';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { SupplierDTO } from '../../../interfaces/supplier.interface';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-multiple-payment-dialog',
  standalone: false,
  templateUrl: './multiple-payment-dialog.component.html'
})
export class MultiplePaymentDialogComponent {
  public loading = false;
  public form!: FormGroup;
  public suppliers: SupplierDTO[] = [];
  private readonly THIRD_PARTY_METHOD = 'Pago Cuenta de Tercero';

  get totalSeleccionado(): number {
    return this.data.selected.reduce((a, b) => a + (b.amount || 0), 0);
  }

  get isThirdParty(): boolean {
    return this.form.get('method')?.value === this.THIRD_PARTY_METHOD;
  }

  constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    private validatorsService: ValidatorsService,
    private proveedoresService: ProveedoresService,
    private dialogRef: MatDialogRef<MultiplePaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MultiplePaymentDialogData & {
      singleMode?: boolean; 
      lockedMethod?: string;
    }
  ) {
    console.log(this.data.singleMode)
    console.log(this.data.lockedMethod)
    this.form = this.fb.group({
      method: [  { value: this.data.lockedMethod ?? null, disabled: !!this.data.lockedMethod } , Validators.required ],
      thirdPartySupplierId: [ null ],
      comments: [ '', Validators.required ]
    });
  }

  ngOnInit(): void {
    this.proveedoresService.listSupliers().subscribe({
      next: (res) => { if (res.result) this.suppliers = res.result; }
    });

    // Hacer requerido el proveedor SOLO si se elige "Pago Cuenta de Tercero"
    this.form.get('method')!.valueChanges.subscribe(value => {
      const ctrl = this.form.get('thirdPartySupplierId')!;
      if (value === this.THIRD_PARTY_METHOD) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });

    // Si el método viene bloqueado y es PCT, marca proveedor como requerido
    const current = this.form.get('method')!.value;
    if (current === this.THIRD_PARTY_METHOD) {
      this.form.get('thirdPartySupplierId')!.setValidators([Validators.required]);
      this.form.get('thirdPartySupplierId')!.updateValueAndValidity();
    }
  }

  cancelar(): void {
    this.dialogRef.close({ applied: false });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.form, field );
  }

  aplicar(): void {
    if (this.form.invalid || (this.isThirdParty && !this.form.value.thirdPartySupplierId)) {
      this.form.markAllAsTouched();
      return;
    }
    const { method, comments, thirdPartySupplierId } = this.form.value;

    // Construimos el request con el total de cada ticket (saldo pendiente)
    const request = {
      sales: this.data.selected.map(s => ({ saleId: s.saleId, amount: s.amount })),
      method: this.data.singleMode ? this.THIRD_PARTY_METHOD : method,
      comments: comments,
      paymentDate: new Date(this.data.paymentDate).toISOString(),
      thirdPartySupplierId: this.isThirdParty ? thirdPartySupplierId : null
    };

    console.log(request)

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
