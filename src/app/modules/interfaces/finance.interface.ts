
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