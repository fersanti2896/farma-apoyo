// auth/guards/auth-guest.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { GlobalStateService } from '../../shared/services';

@Injectable({ providedIn: 'root' })
export class AuthGuestGuard implements CanActivate {
  constructor(private global: GlobalStateService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token   = this.global.getToken();
    const refresh = localStorage.getItem('refresh_token');
    return (token || refresh) ? this.router.parseUrl('/sic/inicio/stock') : true;
  }
}
