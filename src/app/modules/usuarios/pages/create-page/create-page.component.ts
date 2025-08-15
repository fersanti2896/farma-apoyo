import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../services/user.service';
import { ValidatorsService } from '../../../../shared/services';
import { CreateUserRequest, UpdateUserRequest } from '../../../../dashboard/interfaces/user.interface';

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

  public isEditMode: boolean = false;
  public userIdToEdit: number | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar,
    private location: Location,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    this.isEditMode = !!userId;
    this.userIdToEdit = userId ? +userId : null;

    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mLastName: [''],
      email: ['', Validators.email],
      username: ['', Validators.required],
      passwordHash: ['', this.isEditMode ? [] : [Validators.required] ],
      creditLimit: [null, Validators.required],
      roleId: [null, Validators.required],
    });

    if (this.isEditMode && this.userIdToEdit) {
      this.loadUserToEdit(this.userIdToEdit);
    }
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.userForm, field );
  }

  loadUserToEdit(userId: number): void {
    this.isLoading = true;

    this.userService.listUsers().subscribe({
      next: (res) => {
        const user = res.result?.find(u => u.userId === userId);
        if (user) {
          this.userForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            mLastName: user.mLastName,
            email: user.email,
            username: user.username,
            creditLimit: user.creditLimit,
            roleId: user.roleId,
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar el usuario.', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();

      return;
    }
    const form = this.userForm.value;

    const request: CreateUserRequest | UpdateUserRequest = {
      firstName: form.firstName,
      lastName: form.lastName,
      mLastName: form.mLastName,
      email: form.email,
      username: form.username,
      creditLimit: form.creditLimit,
      availableCredit: form.creditLimit,
      roleId: form.roleId,
      ...(this.isEditMode
        ? { userId: this.userIdToEdit!, passwordHash: form.passwordHash }
        : { passwordHash: form.passwordHash })
    };
    

    this.isLoading = true;

     const observable = this.isEditMode
      ? this.userService.updateUser(request as UpdateUserRequest)
      : this.userService.createUser(request as CreateUserRequest);

    observable.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Usuario actualizado.' : 'Usuario creado.',
          'Cerrar',
          { duration: 3000 }
        );
        this.router.navigate(['/sic/inicio/usuarios']);
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open(
          this.isEditMode ? 'Error al actualizar.' : 'Error al crear usuario.',
          'Cerrar',
          { duration: 3000 }
        );
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
