import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-cancel-sale-dialog',
  standalone: false,
  templateUrl: './cancel-sale-dialog.component.html'
})
export class CancelSaleDialogComponent {
  public cancelForm!: FormGroup;
  public saleId: number = 0;
  public type: string = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CancelSaleDialogComponent>,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: { saleId: number, type: string }
  ) {
    this.saleId = data.saleId;
    this.type = data.type
  }

  ngOnInit(): void {
    this.cancelForm = this.fb.group({
      comment: [ '', [ Validators.required ] ]
    });

    // Siempre se actualiza la validez del campo
    this.cancelForm.get('comment')?.updateValueAndValidity();
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.cancelForm, field );
  }

  confirm(): void {
    if (this.cancelForm.valid) {
      this.dialogRef.close(this.cancelForm.value.comment?.trim());
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
