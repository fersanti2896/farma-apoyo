import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { GlobalStateService } from '../../shared/services';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private globalState: GlobalStateService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data['roles'] as number[];
    const user = this.globalState.getUser();

    if (!user || !allowedRoles.includes(user.roleId)) {
      this.router.navigate(['/sic/inicio/stock']);
      
      return false;
    }

    return true;
  }
}
