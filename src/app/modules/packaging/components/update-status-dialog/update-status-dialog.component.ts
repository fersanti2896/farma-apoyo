import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-update-status-dialog',
  standalone: false,
  templateUrl: './update-status-dialog.component.html'
})
export class UpdateStatusDialogComponent {
  public statusForm!: FormGroup;
  public saleId: number = 0;
  public isPackaging: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateStatusDialogComponent>,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: { saleId: number, isPackaging: boolean }
  ) {
    this.saleId = data.saleId;
    this.isPackaging = data.isPackaging
  }

  ngOnInit(): void {
    this.statusForm = this.fb.group({
      comment: [ '', [ ] ]
    });

    if (this.isPackaging) {
      this.statusForm.get('comment')?.setValidators([Validators.required]);
    }

    // Siempre se actualiza la validez del campo
    this.statusForm.get('comment')?.updateValueAndValidity();
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.statusForm, field );
  }

  confirm(): void {
    if (this.statusForm.valid) {
      this.dialogRef.close(this.statusForm.value.comment?.trim());
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
