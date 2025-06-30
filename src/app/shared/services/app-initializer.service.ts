import { Injectable } from '@angular/core';
import { GlobalStateService } from './global-state.service';
import { AuthService } from '../../auth/services/auth.service';
import { RefreshTokenRequest } from '../../auth/interfaces/auth.interface';

@Injectable({
    providedIn: 'root',
  })
  export class AppInitializerService {
    constructor(
      private authService: AuthService,
      private globalState: GlobalStateService
    ) {}
  
    initializeApp(): Promise<void> {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const requestBody: RefreshTokenRequest = {
          refreshToken: refreshToken
        };
  
        return this.authService.refreshAccessToken(requestBody).toPromise().then(
          (response) => {
            if (response!.result) {
              this.globalState.setToken(response!.result.token);
              this.globalState.setUser(response!.result);
              localStorage.setItem('refresh_token', response!.result.refreshToken);
            }
          },
          (error) => {
            console.error('Failed to refresh token on app init', error);
            this.globalState.clearState();
          }
        );
      }
  
      return Promise.resolve();
    }
  }
  
