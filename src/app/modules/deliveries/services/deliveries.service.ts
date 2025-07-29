import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { GlobalStateService } from '../../../shared/services';
import { environment } from '../../../enviroments/enviroment';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';
import { AssignDeliveryUserRequest, SaleDTO, SalesByStatusRequest, SalesStatusDTO } from '../../interfaces/sale.interface';

@Injectable({
  providedIn: 'root'
})
export class DeliveriesService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  assignDelivery( data: AssignDeliveryUserRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Sales/AssignDeliveryUser`, data,  { headers: this.getHeaders() });
  }

  listSalesStatus(): Observable<ApiResponse<SalesStatusDTO[]>> {
    return this.http.get<ApiResponse<SalesStatusDTO[]>>(`${ this.api }/Sales/GetAllSalesStatus`,  { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
