import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { GlobalStateService } from '../../../shared/services';
import { environment } from '../../../enviroments/enviroment';
import { ApplyPaymentRequest, CancelSaleRequest, SalesPendingPaymentDTO } from '../../interfaces/sale.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';
import { CancelledCommentsRequest, CancelledSaleCommentDTO, PaymentStatusDTO, SalesHistoricalRequest, SalesPendingPaymentRequest } from '../../interfaces/collection.interface';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listSalesHistorical( data: SalesHistoricalRequest ): Observable<ApiResponse<SalesPendingPaymentDTO[]>> {
    return this.http.post<ApiResponse<SalesPendingPaymentDTO[]>>(`${ this.api }/Collection/GetSalesHistorical`, data, { headers: this.getHeaders() });
  }

  listSalesPayments( data: SalesPendingPaymentRequest ): Observable<ApiResponse<SalesPendingPaymentDTO[]>> {
    return this.http.post<ApiResponse<SalesPendingPaymentDTO[]>>(`${ this.api }/Collection/GetSalesPendingPayment`, data, { headers: this.getHeaders() });
  }

  listSalesPaids( data: SalesHistoricalRequest ): Observable<ApiResponse<SalesPendingPaymentDTO[]>> {
    return this.http.post<ApiResponse<SalesPendingPaymentDTO[]>>(`${ this.api }/Collection/GetSalesPaids`, data, { headers: this.getHeaders() });
  }

  applicationPayment( data: ApplyPaymentRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Collection/ApplyPayment`, data, { headers: this.getHeaders() });
  }

  listStatusPayment(): Observable<ApiResponse<PaymentStatusDTO[]>> {
    return this.http.get<ApiResponse<PaymentStatusDTO[]>>(`${ this.api }/Collection/GetAllPaymentStatus`,  { headers: this.getHeaders() });
  }

  cancelSaleCompleted( data: CancelSaleRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Collection/CancelSaleWithComment`, data, { headers: this.getHeaders() });
  }

  cancelSaleByOmission( data: CancelSaleRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Collection/CancelSaleByOmission`, data, { headers: this.getHeaders() });
  }

  getCommentsSaleCancelled( data: CancelledCommentsRequest ): Observable<ApiResponse<CancelledSaleCommentDTO[]>> {
    return this.http.post<ApiResponse<CancelledSaleCommentDTO[]>>(`${ this.api }/Collection/GetSaleCancelledComments`, data, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
