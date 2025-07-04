
export interface EntrySummaryDTO {
    entryId: number;
    supplierId: number;
    businessName: string;
    invoiceNumber: string;
    entryDate: string;
    expectedPaymentDate: string;
    totalAmount: number;
}

export interface ProductsDetailsDTO {
    productId: number;
    quantity: number;
    unitPrice: number;
    expirationDate: string;
    lot: string;
}

export interface CreateWarehouseRequest {
    supplierId: number;
    invoiceNumber: string;
    expectedPaymentDate: string;
    totalAmount: number;
    observations: string;
    products: ProductsDetailsDTO[]
}

export interface ProductView extends ProductsDetailsDTO {
  productName: string;
}
