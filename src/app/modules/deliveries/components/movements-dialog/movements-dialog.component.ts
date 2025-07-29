import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MovementsSaleDTO } from '../../../interfaces/sale.interface';

@Component({
  selector: 'app-movements-dialog',
  standalone: false,
  templateUrl: './movements-dialog.component.html'
})
export class MovementsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MovementsSaleDTO
  ) {}
}
