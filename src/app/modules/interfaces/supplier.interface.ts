
export interface SupplierDTO {
    supplierId: number;
    businessName: string;
    contactName: string;
    phone: string;
    address: string;
    status: number;
    descriptionStatus: string;
    balance: number;
    thirdPartyBalance: number;
}

export interface CreateSupplierRequest {
    businessName: string;
    contactName: string;
    phone: string;
    email: string;
    rfc: string;
    address: string;
    paymentTerms: string;
    notes: string;
}

export interface BalanceSupplierRequest {
    supplierId: number;
}

export interface BalaceTSupplierDTO {
    supplierId: number;
    businessName: string;
    balance: number;
    thirdPartyBalance: number;
}