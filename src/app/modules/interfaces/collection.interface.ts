
export interface PaymentStatusDTO {
    paymentStatusId: number;
    paymentStatusName: string;
}

export interface CancelledSaleCommentDTO {
    comments: string;
    createDate: string
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