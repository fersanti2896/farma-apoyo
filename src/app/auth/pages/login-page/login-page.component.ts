import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/auth.interface';
import { ValidatorsService } from '../../../shared/services';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'auth-login-page',
  standalone: false,
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  public loginForm!: FormGroup;
  public showTooltip: boolean = false;
  public isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private validatorsService: ValidatorsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [ '', [ Validators.required ] ],
      password: [ '', [ Validators.required ] ],
    });
  }

  isValidField = ( field: string ) => {
    return this.validatorsService.isValidField( this.loginForm, field );
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      return;
    }

    const { username, password } = this.loginForm.value;

    const loginRequest: LoginRequest = {
      username,
      password
    }

    this.isLoading = true;

    this.authService.login( loginRequest ).subscribe({
      next: (response) => {
        if(response.result) {
          localStorage.setItem('refresh_token', response.result.refreshToken);
                  
          this.isLoading = false;
          this.loginForm.reset();
          this.router.navigate(['/sic/inicio']);
        }
        
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Usuario o Contraseña incorrectos.', 'Cerrar', { duration: 3000 });
        this.loginForm.reset();
      }
    });
  }

  toggleTooltip(): void {
    this.showTooltip = !this.showTooltip;
  }
}
