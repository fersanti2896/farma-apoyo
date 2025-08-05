
export interface FinanceBuildRequest {
    startDate: string;
    endDate: string;
}

export interface FinanceMethodTotalDTO {
    paymentMethod: string;
    totalAmount: number;
}