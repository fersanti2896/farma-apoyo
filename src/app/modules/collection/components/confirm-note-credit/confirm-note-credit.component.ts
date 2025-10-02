import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { GlobalStateService, ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-confirm-note-credit',
  standalone: false,
  templateUrl: './confirm-note-credit.component.html'
})
export class ConfirmNoteCreditComponent {
  public confirmForm!: FormGroup;
  public isWarehouse: boolean = false;
  public noteCreditId: number = 0;
  public RolId: number = 0;
  public saleId: number = 0;

  constructor(
    private fb: FormBuilder,
    private globalStateService: GlobalStateService,
    private dialogRef: MatDialogRef<ConfirmNoteCreditComponent>,
    private validatorsService: ValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: { noteCreditId: number, saleId: number, isWarehouse: boolean }
  ) {
    this.noteCreditId = data.noteCreditId;
    this.saleId = data.saleId;
    this.isWarehouse = data.isWarehouse
  }

  ngOnInit(): void {
    this.confirmForm = this.fb.group({
      comment: [ '', [ Validators.required ] ]
    });

    // Siempre se actualiza la validez del campo
    this.confirmForm.get('comment')?.updateValueAndValidity();

    const { roleId } = this.globalStateService.getUser();
    this.RolId = roleId;
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.confirmForm, field );
  }

  confirm(): void {
    if (this.confirmForm.valid) {
      this.dialogRef.close(this.confirmForm.value.comment?.trim());
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
