import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/auth.interface';
import { ValidatorsService } from '../../../shared/services';

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
    private validatorsService: ValidatorsService
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
    const loginReques: LoginRequest = {
      Username: username,
      Password: password
    }

    this.isLoading = true;

    this.authService.login( loginReques ).subscribe({
      next: res => {
        localStorage.setItem('refresh_token', res.result?.Token!);
        
        this.isLoading = false;
        this.loginForm.reset();
      },
      error: err => {
        this.isLoading = false;
        console.error(err);
        this.loginForm.reset();
      }
    });
  }

  toggleTooltip(): void {
    this.showTooltip = !this.showTooltip;
  }
}
