import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { GlobalStateService } from '../../../shared/services';
import { environment } from '../../../enviroments/enviroment';
import { ReplyResponse } from '../../interfaces/reply.interface';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { ClientDTO, CreateClientRequest } from '../../interfaces/client.interface';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listClients(): Observable<ApiResponse<ClientDTO[]>> {
    return this.http.get<ApiResponse<ClientDTO[]>>(`${ this.api }/Client/GetAllClients`, { headers: this.getHeaders() });
  }

  createClient( data: CreateClientRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Client/CreateClient`, data, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
