import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
import { ApplyPaymentEntryRequest, CostsHistoricalRequest, FinanceBuildRequest, FinanceMethodTotalDTO, FinanceResumeDTO, FinanceResumeRequest, NotesSuppliersDTO } from '../../interfaces/finance.interface';
import { ReplyResponse } from '../../interfaces/reply.interface';

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
    return this.http.post<ApiResponse<FinanceMethodTotalDTO[]>>(`${ this.api }/Finances/GetFinanceSummary`, data,  { headers: this.getHeaders() });
  }

  financeResume( data: FinanceResumeRequest ): Observable<ApiResponse<FinanceResumeDTO[]>> {
    return this.http.post<ApiResponse<FinanceResumeDTO[]>>(`${ this.api }/Finances/GetFinanceResume`, data,  { headers: this.getHeaders() });
  }

  costesSuppliers( data: CostsHistoricalRequest ): Observable<ApiResponse<NotesSuppliersDTO[]>> {
    return this.http.post<ApiResponse<NotesSuppliersDTO[]>>(`${ this.api }/Finances/GetNotesSuppliersHistorical`, data,  { headers: this.getHeaders() });
  }

  applyPaymentEntry( data: ApplyPaymentEntryRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${ this.api }/Finances/ApplyPaymentEntry`, data,  { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
