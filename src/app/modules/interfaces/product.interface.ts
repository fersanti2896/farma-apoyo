
export interface ProductDTO {
  productId: number;
  productName: string;
  barcode: string;
  unit: string;
  price: number;
  description: string;
}

export interface CreateProductRequest {
  productName: string;
  description: string;
  barcode: string;
  unit: string;
  price: number;
}

export interface UpdateProductRequest extends CreateProductRequest {
  productId: number;
}

export interface CreateProductProviderRequest {
  productId: number;
  supplierId: number;   
  unitPrice: number; 
}

export interface ProductsBySupplierRequest {
  supplierId: number;
}

export interface ProductDTO {
  productId: number;
  productName: string;
  status: number;
}

export interface ProductStockDTO {
  productId: number;
  productName: string;
  price: number;
  stockReal: number;
}

export interface ProductSale {
  productId: number;
  quantity: number;
  unitPrice: number;  
}

export interface StatusProductRequest {
  productId: number;
  status: number;
}