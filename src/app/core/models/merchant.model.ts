export type MerchantStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

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
  status: MerchantStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantMeResponse {
  merchant: MerchantRecord | null;
}
