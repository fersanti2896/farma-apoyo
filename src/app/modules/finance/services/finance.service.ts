import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { FinanceBuildRequest, FinanceMethodTotalDTO, FinanceResumeDTO, FinanceResumeRequest } from '../../interfaces/finance.interface';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private globalStateService: GlobalStateService
  ) { }

  buildFinance( data: FinanceBuildRequest ): Observable<ApiResponse<FinanceMethodTotalDTO[]>> {
    return this.http.post<ApiResponse<FinanceMethodTotalDTO[]>>(`${ this.api }/Collection/GetFinanceSummary`, data,  { headers: this.getHeaders() });
  }

  financeResume( data: FinanceResumeRequest ): Observable<ApiResponse<FinanceResumeDTO[]>> {
    return this.http.post<ApiResponse<FinanceResumeDTO[]>>(`${ this.api }/Collection/GetFinanceResume`, data,  { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
