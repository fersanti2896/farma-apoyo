import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../services/user.service';
import { ValidatorsService } from '../../../../shared/services';
import { CreateUserRequest } from '../../../../dashboard/interfaces/user.interface';


@Component({
  selector: 'modules-user-create-page',
  standalone: false,
  templateUrl: './create-page.component.html',
})
export class CreatePageComponent {
  public isLoading: boolean = false;
  public userForm!: FormGroup;
  public roles: { id: number, name: string }[] = [
    { id: 2, name: 'Administrativo' },
    { id: 3, name: 'Supervisor' },
    { id: 4, name: 'Almacen' },
    { id: 5, name: 'Vendedor' },
    { id: 6, name: 'Repartidor' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mLastName: [''],
      email: ['', Validators.email],
      username: ['', Validators.required],
      passwordHash: ['', Validators.required],
      creditLimit: [null, Validators.required],
      roleId: [null, Validators.required],
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.userForm, field );
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();

      return;
    }

    const { firstName, lastName, mLastName, email, username, passwordHash, creditLimit, roleId } = this.userForm.value;
    
    const createUserRequest: CreateUserRequest = {
      firstName,
      lastName,
      mLastName,
      email,
      username,
      passwordHash,
      creditLimit,
      availableCredit: creditLimit,
      roleId,
    }

    this.isLoading = true;

    this.userService.createUser( createUserRequest ).subscribe({
      next: (response) => {
        if(response.result) {
          this.snackBar.open(`Usuario creado correctamente`, 'Cerrar', { duration: 300, });
          this.userForm.reset();
          this.isLoading = false;
          
          setTimeout(() => {
            this.router.navigate(['/sic/inicio/usuarios'])
          }, 1000);
        }
        
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al crear usuario.', 'Cerrar', { duration: 3000 });
        this.userForm.reset();
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
