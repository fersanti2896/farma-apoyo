import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../enviroments/enviroment';
import { ApiResponse, LoginDTO, LoginRequest } from '../interfaces/auth.interface';
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
          this.globalStateService.setToken(response.result.Token);
          this.globalStateService.setUser(response.result);
        }
      })
    );
  }
}
