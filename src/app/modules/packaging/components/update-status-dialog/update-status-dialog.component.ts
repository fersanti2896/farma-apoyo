import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-update-status-dialog',
  standalone: false,
  templateUrl: './update-status-dialog.component.html'
})
export class UpdateStatusDialogComponent {
  public statusForm!: FormGroup;
  public saleId: number = 0;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { saleId: number }
  ) {
    this.saleId = data.saleId;
  }

  ngOnInit(): void {
    this.statusForm = this.fb.group({
      comment: ['']
    });
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
