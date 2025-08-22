import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SalesService } from '../../../sales/services/sales.service';
import { ValidatorsService } from '../../../../shared/services';

export interface CreditNoteDialogData {
  sale: { saleId: number; businessName?: string; totalAmount?: number };
  // details viene de postDetailSaleById: debe contener al menos productId, productName, quantity, unitPrice, subTotal
  details: Array<{
    productId: number;
    productName: string;
    quantity: number;     // cantidad vendida
    unitPrice: number;
    subTotal?: number;
    lot?: string | null;  // otros campos son ignorados por el form
  }>;
}

@Component({
  selector: 'app-credit-note-dialog',
  standalone: false,
  templateUrl: './credit-note-dialog.component.html'
})
export class CreditNoteDialogComponent {
  public loading = false;
  public form!: FormGroup;
  public submitted = false;

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreditNoteDialogData,
    private dialogRef: MatDialogRef<CreditNoteDialogComponent>,
    private fb: FormBuilder,
    private salesService: SalesService,
    private validatorsService: ValidatorsService,
  ) {
    this.form = this.fb.group({
      items: this.fb.array([]),
      comments: ['', [ Validators.required ]]
    });

    // Crea un control por producto con selección 0..quantityVendida
    data.details.forEach(p => {
      this.items.push(
        this.fb.group({
          productId: [p.productId, Validators.required],
          productName: [p.productName],
          maxQty: [p.quantity],
          unitPrice: [p.unitPrice],
          qty: [0, [Validators.min(0), Validators.max(p.quantity)]]
        })
      );
    });
  }

  isValidField = (field: string) => this.validatorsService.isValidField(this.form, field);

  // ¿hay al menos un producto seleccionado?
  private hasSelection(): boolean {
    return this.items.controls.some(g => Number(g.get('qty')?.value || 0) > 0);
  }

  // Total calculado de lo seleccionado
  get totalSelected(): number {
    return this.items.controls.reduce((acc, g) => {
      const qty = Number(g.get('qty')?.value || 0);
      const price = Number(g.get('unitPrice')?.value || 0);
      return acc + qty * price;
    }, 0);
  }

  // Dentro de CreditNoteDialogComponent
  numbers(max: number | null | undefined): number[] {
    const n = Number(max ?? 0);
    return Array.from({ length: n + 1 }, (_, i) => i);
  }

  // Dentro de CreditNoteDialogComponent
  trackByIndex(index: number, _item: unknown): number {
    return index;
  }

  // Asegura que qty ∈ [0..max] y sea entero
  onQtyInput(index: number): void {
    const group = this.items.at(index) as FormGroup;
    const max = Number(group.get('maxQty')?.value ?? 0);
    let val = Number(group.get('qty')?.value ?? 0);

    if (isNaN(val)) val = 0;
    val = Math.floor(val);          // solo enteros
    if (val < 0) val = 0;
    if (val > max) val = max;

    // Actualiza sin re-emitir para evitar loops de validación
    group.get('qty')?.setValue(val, { emitEvent: false });

    // Revalida para que se actualicen los mat-error
    group.get('qty')?.updateValueAndValidity({ emitEvent: false });
  }


  close(): void {
    this.dialogRef.close({ applied: false });
  }

  submit(): void {
    if (this.loading) return;
    this.submitted = true;

    // Marca todo para mostrar errores
    this.form.markAllAsTouched();

    // Valida comentarios y selección
    const hasSelection = this.hasSelection();
    if (!this.form.valid || !hasSelection) {
      // coloca un error a nivel formulario para mostrar mensaje bajo la tabla
      this.form.setErrors({ ...(this.form.errors ?? {}), noItems: !hasSelection });
      return;
    }

    const chosen = this.items.controls
      .map(g => ({
        productId: g.get('productId')?.value,
        quantity: Number(g.get('qty')?.value || 0),
        unitPrice: Number(g.get('unitPrice')?.value || 0),
      }))
      .filter(x => x.quantity > 0);

    const comments = this.form.get('comments')?.value ?? '';
    const req = {
      saleId: this.data.sale.saleId,
      comments,
      products: chosen
    };

    this.loading = true;
    this.salesService.createCreditNote(req).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close({ applied: true });
      },
      error: () => {
        this.loading = false;
        this.dialogRef.close({ applied: false });
      }
    });
  }
}
