import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-confirm-devolution-dialog',
  standalone: false,
  templateUrl: './confirm-devolution-dialog.component.html'
})
export class ConfirmDevolutionDialogComponent {
  public devolutionForm!: FormGroup;
  public saleId: number = 0;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConfirmDevolutionDialogComponent>,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: { saleId: number }
  ) {
    this.saleId = data.saleId;
  }

  ngOnInit(): void {
    this.devolutionForm = this.fb.group({
      comment: [ '', [ Validators.required ] ]
    });

    // Siempre se actualiza la validez del campo
    this.devolutionForm.get('comment')?.updateValueAndValidity();
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.devolutionForm, field );
  }

  confirm(): void {
    if (this.devolutionForm.valid) {
      this.dialogRef.close(this.devolutionForm.value.comment?.trim());
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
