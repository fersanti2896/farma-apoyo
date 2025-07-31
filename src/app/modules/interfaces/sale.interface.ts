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
    vendedor: string;
    repartidor: string;
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
    repartidor: string;
}

export interface SalesByStatusRequest {
    saleStatusId: number;
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

export interface AssignDeliveryUserRequest {
    saleId: number;
    deliveryUserId: number;
    commentsDelivery: string;
    isUpdated: boolean;
}

export interface SalesStatusDTO {
    saleStatusId: number;
    statusName: string;
}

export interface SalesPendingPaymentDTO {
    saleId: number;
    saleDate: string;
    totalAmount: number;
    amountPaid: number;
    amountPending: number;
    saleStatus: string;
    paymentStatusId: number;
    paymentStatus: string;
    clientId: number;
    businessName: string;
    salesPersonId: number;
    salesPerson: string;
}

export interface ApplyPaymentRequest {
    saleId: number;
    amount: number;
    method: string;
    comments: string;
}

export interface MovementsSaleDTO {
    saleId: number;
    comments: string;
    commentsDelivery: string;
    updateDate: string;
}

export interface SalesByUserRequest {
    startDate: string;
    endDate: string;
    saleStatusId?: number;
    PaymentStatusId?: number;
}

export interface SalesByUserDTO {
    saleId: number;
    clientId: number;
    businessName: string;
    userId: number;
    saleDate: string;
    totalAmount: number;
    saleStatusId: number;
    statusName: string;
    paymentStatusId: number;
    namePayment: string;
}