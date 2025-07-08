import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { CreateWarehouseRequest, DetailsEntryResponse, EntrySummaryDTO, FullEntryByIdRequest } from '../../interfaces/entrey-sumarry.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';
import { ProductDTO } from '../../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listWarehouse(): Observable<ApiResponse<EntrySummaryDTO[]>> {
    return this.http.get<ApiResponse<EntrySummaryDTO[]>>(`${ this.api }/Supplier/GetEntryList`, { headers: this.getHeaders() });
  }

  createWarehouse( data: CreateWarehouseRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Warehouse/CreateFullEntry`, data, { headers: this.getHeaders() });
  }

  detailsFullEntryById( data: FullEntryByIdRequest ): Observable<ApiResponse<DetailsEntryResponse>> {
    return this.http.post<ApiResponse<DetailsEntryResponse>>(`${ this.api }/Warehouse/FullEntryById`, data, { headers: this.getHeaders() });
  }  

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
