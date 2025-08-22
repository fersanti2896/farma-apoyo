
export interface PaymentStatusDTO {
    paymentStatusId: number;
    paymentStatusName: string;
}

export interface CancelledSaleCommentDTO {
    comments: string;
    createDate: string
}

export interface PaymentsSaleDTO {
    paymentDate: string;
    amount: number;
    comments: string;
    username: string;
    paymentMethod: string;
}

export interface CreditNoteListRequest {
    startDate: string;
    endDate: string;
    clientId?: number;
    salesPersonId?: number;
    saleStatusId?: number;
}

export interface CreditNoteListDTO {
    noteCreditId: number;
    saleId: number;
    finalCreditAmount: number;
    comments: string;
    createDate: string;
    createdBy: string;
    vendedor: string;
    clientName: string;
}

export interface SalesPendingPaymentRequest {
    startDate: string;
    endDate: string;
    clientId?: number;
    salesPersonId?: number;
    saleStatusId?: number;
    paymentStatusId?: number;
}

export interface SalesHistoricalRequest {
    startDate: string;
    endDate: string;
    clientId?: number;
    salesPersonId?: number;
    saleStatusId?: number;
    paymentStatusId?: number;
}

export interface CancelledCommentsRequest {
    saleId: number;
}

export interface SalePaymentDTO {
    saleId: number;
    amount: number;
}

export interface ApplyMultiplePaymentRequest {
    sales: SalePaymentDTO[]
    method: string;
    comments: string;
    paymentDate: string;
}

export interface MultiplePaymentDialogData {
  enteredAmount: number;
  paymentDate: Date;
  selected: SalePaymentDTO[];
  paymentMethods: { value: string; label: string }[];
}

export interface ApproveCreditNoteRequest {
    noteCreditId: number;
    commentsCollection: string;
}