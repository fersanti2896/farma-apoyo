import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { CreateProductRequest, ProductDTO, StatusProductRequest, UpdateProductRequest } from '../../interfaces/product.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listProducts(): Observable<ApiResponse<ProductDTO[]>> {
    return this.http.get<ApiResponse<ProductDTO[]>>(`${ this.api }/Warehouse/GetAllProducts`, { headers: this.getHeaders() });
  }

  createProduct( data: CreateProductRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Warehouse/CreateProduct`, data, { headers: this.getHeaders() });
  }

  editProduct( data: UpdateProductRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Warehouse/UpdateProduct`, data, { headers: this.getHeaders() });
  }

  activeProduct( data: StatusProductRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Warehouse/DeactivateProduct`, data, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
