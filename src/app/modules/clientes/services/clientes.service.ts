import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { GlobalStateService } from '../../../shared/services';
import { environment } from '../../../enviroments/enviroment';
import { ReplyResponse, StatusRequest } from '../../interfaces/reply.interface';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { ClientByUserDTO, ClientDTO, CreateClientRequest, UpdateClientRequest } from '../../interfaces/client.interface';
import { CPRequest, CPResponse, MunicipalityReponse, MunicipalityRequest, StatesResponse, TownReponse, TownRequest } from '../../interfaces/catalogs.interface';

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

  getStates(): Observable<StatesResponse> {
    return this.http.post<StatesResponse>(`${ this.api }/Catalogs/GetStates`, { headers: this.getHeaders() });
  }

  getMunicipalityByState( data: MunicipalityRequest ): Observable<MunicipalityReponse> {
    return this.http.post<MunicipalityReponse>(`${ this.api }/Catalogs/GetMunicipalityByState`, data, { headers: this.getHeaders() });
  }

  getTownByStateAndMunicipality( data: TownRequest ): Observable<TownReponse> {
    return this.http.post<TownReponse>(`${ this.api }/Catalogs/GetTownByStateAndMunicipality`, data, { headers: this.getHeaders() });
  }

  getCP( data: CPRequest ): Observable<CPResponse> {
    return this.http.post<CPResponse>(`${ this.api }/Catalogs/GetCP`, data, { headers: this.getHeaders() });
  }

  updateClient( data: UpdateClientRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Client/UpdateClient`, data, { headers: this.getHeaders() });
  }

  activeClient( data: StatusRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Client/DeactivateClient`, data, { headers: this.getHeaders() });
  }

  getClientsByUser(): Observable<ApiResponse<ClientByUserDTO[]>> {
    return this.http.get<ApiResponse<ClientByUserDTO[]>>(`${ this.api }/Client/GetClientsByUser`, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
