import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../auth/interfaces/auth.interface';
import { ApplyPaymentEntryRequest, CostsHistoricalRequest, DetailByEntryIdRequest, ExpenseHistoricalRequest, ExpensePaymentDTO, ExpensePaymentRequest, ExpensesCategoriesDTO, FinanceBuildRequest, FinanceMethodTotalDTO, FinanceResumeDTO, FinanceResumeRequest, FinanceSalesDTO, FinanceSalesRequest, NotesSuppliersDTO, PaymentsEntryDTO, ReportFinanceDTO, ReportProductDTO, ReportSalesVendedorDTO } from '../../interfaces/finance.interface';
import { environment } from '../../../enviroments/enviroment';
import { GlobalStateService } from '../../../shared/services';
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
    return this.http.post<ApiResponse<FinanceMethodTotalDTO[]>>(`${this.api}/Finances/GetFinanceSummary`, data, { headers: this.getHeaders() });
  }

  financeResume( data: FinanceResumeRequest ): Observable<ApiResponse<FinanceResumeDTO[]>> {
    return this.http.post<ApiResponse<FinanceResumeDTO[]>>(`${this.api}/Finances/GetFinanceResume`, data, { headers: this.getHeaders() });
  }

  costesSuppliers( data: CostsHistoricalRequest ): Observable<ApiResponse<NotesSuppliersDTO[]>> {
    return this.http.post<ApiResponse<NotesSuppliersDTO[]>>(`${this.api}/Finances/GetNotesSuppliersHistorical`, data, { headers: this.getHeaders() });
  }

  applyPaymentEntry( data: ApplyPaymentEntryRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${this.api}/Finances/ApplyPaymentEntry`, data, { headers: this.getHeaders() });
  }

  movementsByEntryId( data: DetailByEntryIdRequest ): Observable<ApiResponse<PaymentsEntryDTO>> {
    return this.http.post<ApiResponse<PaymentsEntryDTO>>(`${this.api}/Finances/PaymentsByEntryId`, data, { headers: this.getHeaders() });
  }

  expenseCategories(): Observable<ApiResponse<ExpensesCategoriesDTO[]>> {
    return this.http.get<ApiResponse<ExpensesCategoriesDTO[]>>(`${this.api}/Finances/GetExpensesCategories`, { headers: this.getHeaders() });
  }

  expensesPayments( data: ExpenseHistoricalRequest ): Observable<ApiResponse<ExpensePaymentDTO[]>> {
    return this.http.post<ApiResponse<ExpensePaymentDTO[]>>(`${this.api}/Finances/GetExpensePaymentsHistorical`, data, { headers: this.getHeaders() });
  }

  createExpense( data: ExpensePaymentRequest ): Observable<ApiResponse<ReplyResponse>> {
    return this.http.post<ApiResponse<ReplyResponse>>(`${this.api}/Finances/CreateExpensePayment`, data, { headers: this.getHeaders() });
  }

  reportFinanceHistorical( data: FinanceBuildRequest ): Observable<ApiResponse<ReportFinanceDTO[]>> {
    return this.http.post<ApiResponse<ReportFinanceDTO[]>>(`${this.api}/Finances/ReportFinanceHistorical`, data, { headers: this.getHeaders() });
  } 

  reportSalesHistorical( data: FinanceSalesRequest ): Observable<ApiResponse<FinanceSalesDTO[]>> {
    return this.http.post<ApiResponse<FinanceSalesDTO[]>>(`${this.api}/Finances/ReportSalesHistorical`, data, { headers: this.getHeaders() });
  } 

  reportProductHistorical( data: FinanceBuildRequest ): Observable<ApiResponse<ReportProductDTO[]>> {
    return this.http.post<ApiResponse<ReportProductDTO[]>>(`${this.api}/Finances/ReportProductHistorical`, data, { headers: this.getHeaders() });
  }

  reporteSalesVendedorHistorical( data: FinanceBuildRequest ): Observable<ApiResponse<ReportSalesVendedorDTO[]>> {
    return this.http.post<ApiResponse<ReportSalesVendedorDTO[]>>(`${this.api}/Finances/ReporteSalesVendedorHistorical`, data, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.globalStateService.getToken();

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
