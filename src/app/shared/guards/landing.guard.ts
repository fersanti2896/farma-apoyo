// shared/guards/landing.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { GlobalStateService } from '../services';

@Injectable({ providedIn: 'root' })
export class LandingGuard implements CanActivate {
  constructor(private router: Router, private global: GlobalStateService) {}

  canActivate(): UrlTree {
    const token   = this.global.getToken();
    const refresh = localStorage.getItem('refresh_token');

    // Si hay sesión (token o al menos refresh), manda al home por defecto
    if (token || refresh) return this.router.parseUrl('/sic/inicio/stock');

    // Si no hay sesión, al login
    return this.router.parseUrl('/auth/login');
  }
}
