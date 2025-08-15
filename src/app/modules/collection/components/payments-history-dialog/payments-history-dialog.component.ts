import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PaymentsSaleDTO } from '../../../interfaces/collection.interface';

@Component({
  selector: 'app-payments-history-dialog',
  standalone: false,
  templateUrl: './payments-history-dialog.component.html'
})
export class PaymentsHistoryDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PaymentsSaleDTO[]
  ) {}
}
