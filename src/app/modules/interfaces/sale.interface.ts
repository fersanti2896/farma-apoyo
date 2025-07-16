import { ProductSale } from './product.interface';

export interface CreateSaleRequest {
    clientId: number;
    totalAmount: number;
    products: ProductSale[]; 
}

export interface SaleDTO {
    saleId: number;
    clientId: number;
    businessName: string;
    saleStatusId: number;
    statusName: string;
    totalAmount: number;
    saleDate: string;
}

export interface DetailsSaleDTO {
    saleId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
    lot: string;
    expirationDate: string;
    createDate: string;
    vendedor: string;

}

export interface DetailSaleByIdRequest {
    saleId: number;
}

export interface DetailsSaleResponse {
    result: DetailsSaleDTO[]
}

export interface TicketData {
  sale: SaleDTO;
  details: DetailsSaleDTO[];
}

export interface UpdateSaleStatusRequest {
    saleId: number;
    saleStatusId: number;
    comments: string;
}