export type MerchantStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type PhotoCategory = 'EXTERIOR' | 'INTERIOR' | 'DISPLAY_AREA' | 'OTHER';

export interface StorePhoto {
  id: string;
  url: string;
  category: PhotoCategory;
  key?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
}

export type BusinessDocumentType =
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'TRADE_LICENSE'
  | 'OTHER';

export interface StoreDocument {
  id: string;
  url: string;
  type: BusinessDocumentType;
  key?: string;
  uploadedAt?: string;
}

export interface StoreLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
  latitude: number;
  longitude: number;
}

export interface OwnerContactInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface MerchantRecord {
  id: string;
  ownerUserId: string;
  storeCode?: string;
  storeName: string;
  description: string;
  businessType: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  country: string;
  location: StoreLocation;
  photos: StorePhoto[];
  documents: StoreDocument[];
  status: MerchantStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: OwnerContactInfo;
}

export interface MerchantMeResponse {
  merchant: MerchantRecord | null;
}

export interface CreateMerchantRequest {
  storeName: string;
  description?: string;
  businessType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateMerchantRequest {
  storeName?: string;
  description?: string;
  businessType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface PhotoUploadItem {
  url: string;
  category: PhotoCategory;
}

export interface DocumentUploadItem {
  url: string;
  type: BusinessDocumentType;
}

export interface AdminApplicationsResponse {
  count: number;
  applications: MerchantRecord[];
}

export interface AdminApplicationDetailResponse {
  application: MerchantRecord;
}
