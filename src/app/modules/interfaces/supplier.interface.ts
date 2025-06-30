
export interface SupplierDTO {
    supplierId: number;
    businessName: string;
    contactName: string;
    phone: string;
    address: string;
    status: number;
    descriptionStatus: string;
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