import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { GlobalStateService } from './global-state.service';
import { AuthService } from '../../auth/services/auth.service';
import { RefreshTokenRequest } from '../../auth/interfaces/auth.interface';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private globalState: GlobalStateService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.globalState.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error) => {
        if (error.status === 401) {
          // Token expired; refresh the token
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            this.globalState.clearState();
            this.router.navigate(['/auth/login']);

            return throwError(() => new Error('No refresh token found'));
          }

          const requestBody: RefreshTokenRequest = {
            refreshToken: refreshToken
          };

          return this.authService.refreshAccessToken(requestBody).pipe(
            switchMap((response) => {
              this.globalState.setToken(response.result?.token || null);
              localStorage.setItem('refresh_token', response.result!.refreshToken);

              req = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.result?.token}`,
                },
              });

              return next.handle(req);
            }),
            catchError((refreshError) => {
              this.globalState.clearState();
              this.router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        }

        return throwError(() => error);
      })
    );
  }
}
