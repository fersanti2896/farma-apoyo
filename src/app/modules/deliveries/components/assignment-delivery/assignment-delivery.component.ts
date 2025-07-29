import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { map, Observable, startWith } from 'rxjs';

import { UsersDTO } from '../../../../auth/interfaces/auth.interface';
import { UserService } from '../../../usuarios/services/user.service';
import { ValidatorsService } from '../../../../shared/services';

@Component({
  selector: 'app-assignment-delivery',
  standalone: false,
  templateUrl: './assignment-delivery.component.html'
})
export class AssignmentDeliveryComponent {
  public assigmentForm!: FormGroup;
  public saleId: number = 0;

  public users: UsersDTO[] = [];
  public userControl = new FormControl<UsersDTO | null>(null);
  public filteredUser!: Observable<UsersDTO[]>;

  public isUpdated: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignmentDeliveryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { saleId: number, isUpdated: boolean },
    private userService: UserService,
    private validatorsService: ValidatorsService
  ) {
    this.saleId = data.saleId;
    this.isUpdated = data.isUpdated
  }

  ngOnInit(): void {
    this.assigmentForm = this.fb.group({
      userId: [ null, [ Validators.required ] ],
      comment: [ '', [] ]
    });

    if (!this.isUpdated) {
      this.assigmentForm.get('comment')?.setValidators([Validators.required]);
    }

    // Siempre se actualiza la validez del campo
    this.assigmentForm.get('comment')?.updateValueAndValidity();

    this.loadUser();
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.assigmentForm, field );
  }

  loadUser(): void {
    this.userService.listUsers().subscribe(response => {
      this.users = response.result!.filter(user => user.status === 1);

      this.filteredUser = this.userControl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const searchValue = typeof value === 'string' ? value.toLowerCase() : this.displayFnUser(value!).toLowerCase();
          return this.users.filter(user => 
            this.displayFnUser(user).toLowerCase().includes(searchValue)
          );
        })
      );
    });
  }

  displayFnUser(user: UsersDTO): string {
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''} ${user?.mLastName ?? ''}`.trim();
  }

  onUserSelected(user: UsersDTO): void {
    this.assigmentForm.get('userId')?.setValue(user?.userId);
  }

  confirm(): void {
    if (this.assigmentForm.invalid) {
      this.assigmentForm.markAllAsTouched();
      
      return;
    }

    const userId = this.assigmentForm.get('userId')?.value;
    const comment = this.assigmentForm.get('comment')?.value;

    this.dialogRef.close({ userId, comment });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
