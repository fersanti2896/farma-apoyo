
export interface CreateClientRequest {
    contactName: string;
    businessName: string;
    address: string;
    phoneNumber: string;
    rfc: string;
    email: string;
    notes: string;
    paymentDays: number;    
    creditLimit: number;
}

export interface ClientDTO {
    clientId: number;
    contactName: string;
    businessName: string;
    address: string;
    phoneNumber: string;
    rfc: string;
    email: string;
    creditLimit: number;
}