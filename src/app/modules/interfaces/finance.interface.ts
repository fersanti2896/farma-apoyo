
export interface FinanceBuildRequest {
    startDate: string;
    endDate: string;
}

export interface FinanceMethodTotalDTO {
    paymentMethod: string;
    totalAmount: number;
}

export interface FinanceResumeRequest {
    startDate: string;
    endDate: string;
    paymentMethod: string;
}

export interface FinanceResumeDTO {
    paymentId: number;
    saleId: number;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
}

export interface CostsHistoricalRequest {
    startDate: string;
    endDate: string;
    supplierId?: number;
    status?: number;
}

export interface NotesSuppliersDTO {
    entryId: number;
    supplierId: number;
    businessName: string;
    invoiceNumber: string;
    entryDate: string;
    expectedPaymentDate: string;
    totalAmount: number;
    amountPending: number;
    status: number;
    statusName: string;
}

export interface ApplyPaymentEntryRequest {
    entryId: number;
    supplierId: number;
    amount: number;
    paymentMethod: string;
    paymentDate?: string;
    comments?: string;
}

export interface ConfirmPaymentEntryData {
  entryId: number;
  supplierId: number;
  businessName: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPending: number;
  paymentMethods: { value: string; label: string }[];
}
