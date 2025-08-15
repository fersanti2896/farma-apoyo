import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { ApiResponse, UsersDTO } from '../../../auth/interfaces/auth.interface';
import { Observable } from 'rxjs';
import { CreateUserRequest, StatusUserRequest, UpdateUserRequest } from '../../../dashboard/interfaces/user.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService 
  ) { }

  listUsers(): Observable<ApiResponse<UsersDTO[]>> {
    return this.http.get<ApiResponse<UsersDTO[]>>(`${ this.api }/User/GetAllUsers`, { headers: this.getHeaders() } );
  }

  activeUser( data: StatusUserRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/User/DeactivateUser`, data, { headers: this.getHeaders() } );
  }

  createUser( data: CreateUserRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/User/CreateUser`, data);
  }

  updateUser( data: UpdateUserRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/User/UpdateUser`, data, { headers: this.getHeaders() } );
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
