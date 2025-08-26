
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
    cve_CodigoPostal: string;
    cve_Estado: string;
    cve_Municipio: string;
    cve_Colonia: string;
    street: string;
    extNbr: string;
    innerNbr: string;
    userId: number;
}

export interface UpdateClientRequest extends CreateClientRequest {
    clientId: number;
}

export interface ClientDTO {
    clientId: number;
    contactName: string;
    businessName: string;
    address: string;
    phoneNumber: string;
    rfc: string;
    email: string | null;
    creditLimit: number;
    notes: string | null;
    paymentDays: number;
    cve_CodigoPostal: string;
    cve_Estado: string;
    cve_Municipio: string;
    cve_Colonia: string;
    street: string;
    extNbr: string;
    innerNbr: string | null;
    userId: number;
    status: number;
    descriptionStatus: string;
}

export interface ClientByUserDTO {
    clientId: number;
    contactName: string;
    businessName: string;
    creditLimit: number;
    availableCredit: number;
    paymentDays: number;
    isBlocked: number;
    address: string;
}