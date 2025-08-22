import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { DetailSaleByIdRequest, DetailsSaleDTO, DetailsSaleResponse, SaleDTO, SalesByStatusRequest, UpdateSaleStatusRequest } from '../../interfaces/sale.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';

@Injectable({
  providedIn: 'root'
})
export class PackagingService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listSales( data: SalesByStatusRequest ): Observable<ApiResponse<SaleDTO[]>> {
    return this.http.post<ApiResponse<SaleDTO[]>>(`${ this.api }/Sales/GetAllSalesByStatus`, data,  { headers: this.getHeaders() });
  }

  postDetailSaleById( data: DetailSaleByIdRequest ): Observable<ApiResponse<DetailsSaleDTO[]>> {
    return this.http.post<ApiResponse<DetailsSaleDTO[]>>(`${ this.api }/Sales/DetailsSaleBySaleId`, data, { headers: this.getHeaders() });
  }

  updateSaleStatus( data: UpdateSaleStatusRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Sales/UpdateSaleStatus`, data, { headers: this.getHeaders() });
  }

  listSalesDeliveryByUserId( data: SalesByStatusRequest ): Observable<ApiResponse<SaleDTO[]>> {
    return this.http.post<ApiResponse<SaleDTO[]>>(`${ this.api }/Sales/GetSalesByDeliveryId`, data,  { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
