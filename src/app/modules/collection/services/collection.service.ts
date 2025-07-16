import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { GlobalStateService } from '../../../shared/services';
import { environment } from '../../../enviroments/enviroment';
import { ApplyPaymentRequest, SalesPendingPaymentDTO } from '../../interfaces/sale.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listSalesPayments( ): Observable<ApiResponse<SalesPendingPaymentDTO[]>> {
    return this.http.get<ApiResponse<SalesPendingPaymentDTO[]>>(`${ this.api }/Sales/GetSalesPendingPayment`,  { headers: this.getHeaders() });
  }

  applicationPayment( data: ApplyPaymentRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Sales/ApplyPayment`, data, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
