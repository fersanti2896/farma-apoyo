
export interface ProductDTO {
    productId: number;
    productName: string;
    barcode: string;
    unit: string;
    price: number;
}

export interface CreateProductRequest {
  productName: string;
  description: string;
  barcode: string;
  unit: string;
  price: number;
}

export interface CreateProductProviderRequest {
  productId: number;
  supplierId: number;   
  unitPrice: number; 
}

export interface ProductsBySupplierRequest {
  supplierId: number;
}

export interface ProductBySupplierDTO {
  productProviderId: number;
  productId: number;
  productName: string;
}
