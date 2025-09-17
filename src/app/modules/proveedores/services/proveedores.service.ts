import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GlobalStateService } from '../../../shared/services';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { BalaceTSupplierDTO, BalanceSupplierRequest, CreateSupplierRequest, SupplierDTO } from '../../interfaces/supplier.interface';
import { ReplyResponse, StatusRequest } from '../../interfaces/reply.interface';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listSupliers(): Observable<ApiResponse<SupplierDTO[]>> {
    return this.http.get<ApiResponse<SupplierDTO[]>>(`${ this.api }/Supplier/GetAllSuppliers`, { headers: this.getHeaders() });
  }

  activeSupplier( data: StatusRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Supplier/DeactivateSupplier`, data, { headers: this.getHeaders() });
  }

  createSupplier( data: CreateSupplierRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Supplier/CreateSupplier`, data, { headers: this.getHeaders() });
  }

  balacesSupplier( data: BalanceSupplierRequest ): Observable<ApiResponse<BalaceTSupplierDTO>> {
    return this.http.post<ApiResponse<BalaceTSupplierDTO>>(`${ this.api }/Supplier/GetSupplierBalances`, data, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
