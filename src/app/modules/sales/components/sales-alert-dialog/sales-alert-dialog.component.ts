import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-sales-alert-dialog',
  standalone: false,
  templateUrl: './sales-alert-dialog.component.html'
})
export class SalesAlertDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    public dialogRef: MatDialogRef<SalesAlertDialogComponent>
  ) {}
}
