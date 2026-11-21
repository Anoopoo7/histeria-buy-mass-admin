export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ProductImage {
  id: string;
  url: string;
  uploadedAt: string | Date;
  key?: string;
  mimeType?: string;
  size?: number;
}

export interface ProductRecord {
  id: string;
  storeId: string;
  ownerUserId: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  sku?: string;
  images: ProductImage[];
  price: number;
  regularRetailPrice?: number;
  unit: string;
  status: ProductStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  brand?: string;
  sku?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  unit?: string;
  brand?: string;
  sku?: string;
  status?: ProductStatus;
}

export interface QueryProductsParams {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  category?: string;
  search?: string;
}

export interface PaginatedProductsResponse {
  data: ProductRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const PRODUCT_CATEGORIES = [
  'Cars - Hatchback',
  'Cars - Compact & Mid SUV',
  'Cars - Premium SUV & MUV',
  'Cars - Sedan',
  'Cars - Electric Vehicles (EV)',
  'Motorcycles - Commuter & Mileage',
  'Motorcycles - Sports & Naked',
  'Motorcycles - Cruiser & Adventure',
  'Scooters - Petrol',
  'Electric Two-Wheelers (EV Scooters & Bikes)',
  'Commercial & Utility Vehicles',
];

export const PRODUCT_UNITS = [
  { label: 'Vehicle (Unit)', value: 'unit' },
  { label: 'Bike / Two-Wheeler', value: 'bike' },
  { label: 'Car / Four-Wheeler', value: 'car' },
  { label: 'Piece', value: 'piece' },
];
