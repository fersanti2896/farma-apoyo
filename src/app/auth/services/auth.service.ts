import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { ApiResponse, LoginDTO, LoginRequest, RefreshTokenRequest } from '../interfaces/auth.interface';
import { environment } from '../../enviroments/enviroment';
import { GlobalStateService } from '../../shared/services/global-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService 
  ) { }

  login( data: LoginRequest ): Observable<ApiResponse<LoginDTO>> {
    return this.http.post<ApiResponse<LoginDTO>>(`${ this.api }/User/Login`, data).pipe(
      tap((response) => {
        if (response.result) {
          this.globalStateService.setToken(response.result.token);
          this.globalStateService.setUser(response.result);
        }
      })
    );
  }

  refreshAccessToken( data: RefreshTokenRequest ): Observable<ApiResponse<LoginDTO>> {
    return this.http.post<ApiResponse<LoginDTO>>(`${ this.api }/User/RefreshToken`, data);
  }
}
