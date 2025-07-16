import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { UserInfoCreditDTO } from '../../../dashboard/interfaces/user.interface';
import { ClientByUserDTO } from '../../interfaces/client.interface';
import { ProductStockDTO } from '../../interfaces/product.interface';
import { CreateSaleRequest } from '../../interfaces/sale.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  creditInfo(): Observable<ApiResponse<UserInfoCreditDTO>> {
    return this.http.get<ApiResponse<UserInfoCreditDTO>>(`${ this.api }/User/CreditInfo`, { headers: this.getHeaders() });
  }

  getClienteByUser(): Observable<ApiResponse<ClientByUserDTO[]>> {
    return this.http.get<ApiResponse<ClientByUserDTO[]>>(`${ this.api }/Client/GetClientsByUser`, { headers: this.getHeaders() });
  }
  
  getProductStock(): Observable<ApiResponse<ProductStockDTO[]>> {
    return this.http.get<ApiResponse<ProductStockDTO[]>>(`${ this.api }/Warehouse/GetStockReal`, { headers: this.getHeaders() });
  }

  createSale( data: CreateSaleRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Sales/CreateSale`, data, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
