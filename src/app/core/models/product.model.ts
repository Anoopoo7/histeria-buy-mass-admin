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
  'Grocery & Staples',
  'Fresh Vegetables & Fruits',
  'Dairy & Bakery',
  'Spices & Condiments',
  'Beverages & Tea',
  'Organic & Health Food',
  'Personal Care & Hygiene',
  'Household & Cleaning',
  'Snacks & Packaged Food',
  'Meat, Poultry & Seafood',
  'Electronics & Appliances',
  'Stationery & Office',
  'General Retail',
];

export const PRODUCT_UNITS = [
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Gram (g)', value: 'g' },
  { label: 'Piece (pc)', value: 'piece' },
  { label: 'Packet (pkt)', value: 'pack' },
  { label: 'Litre (L)', value: 'litre' },
  { label: 'Millilitre (ml)', value: 'ml' },
  { label: 'Box', value: 'box' },
  { label: 'Dozen (12 pcs)', value: 'dozen' },
  { label: 'Bundle', value: 'bundle' },
];
