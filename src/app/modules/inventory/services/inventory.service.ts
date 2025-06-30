import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { StockDTO } from '../../interfaces/stock.interface';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  listStock(): Observable<ApiResponse<StockDTO[]>> {
    return this.http.get<ApiResponse<StockDTO[]>>(`${ this.api }/Warehouse/GetStock`, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
