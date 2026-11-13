export type PoolStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type PoolFinalizationStatus =
  | 'IDLE'
  | 'PROCESSING'
  | 'FINALIZED'
  | 'FAILED';

export interface PoolTier {
  targetAmount: number;
  discountPercentage: number;
}

export interface PoolProductItem {
  productId: string;
  productName?: string;
  regularPrice?: number;
  targetAmount?: number;
  discountPercentage?: number;
}

export interface PoolRecord {
  id: string;
  storeId: string;
  ownerUserId: string;
  importCode?: string;
  title: string;
  description?: string;
  productIds: string[];
  productId?: string;
  products?: PoolProductItem[];
  startsAt: string;
  durationMinutes: number;
  endsAt: string;
  status: PoolStatus;
  minParticipants?: number;
  tiers: PoolTier[];
  targetAmount?: number;
  discountPercentage?: number;
  // Review metadata
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  // Target & Finalization metadata
  targetEverReached?: boolean;
  isFinalized?: boolean;
  finalizationStatus?: PoolFinalizationStatus;
  finalDiscountPercentage?: number | null;
  finalCombinedValue?: number | null;
  finalParticipantCount?: number | null;
  finalCalculatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePoolRequest {
  title: string;
  description?: string;
  productIds: string[];
  startsAt: string;
  durationMinutes: number;
  endsAt?: string;
  minParticipants?: number;
  tiers: PoolTier[];
  targetAmount?: number;
  discountPercentage?: number;
}

export interface UpdatePoolRequest {
  title?: string;
  description?: string;
  productIds?: string[];
  startsAt?: string;
  durationMinutes?: number;
  minParticipants?: number;
  tiers?: PoolTier[];
  targetAmount?: number;
  discountPercentage?: number;
}

export interface ReviewPoolRequest {
  adminNotes?: string;
}

export interface RejectPoolRequest {
  rejectionReason: string;
  adminNotes?: string;
}

export interface ParticipantProductQuantity {
  productId: string;
  productName?: string;
  quantity: number;
}

export interface MerchantParticipantSummary {
  totalParticipants: number;
  combinedEligibleCartValue: number;
  productQuantities: ParticipantProductQuantity[];
  poolStatus: PoolStatus;
  currentTier?: PoolTier;
  nextTier?: PoolTier;
}

export interface PaginatedPoolsResponse {
  data: PoolRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryPoolsParams {
  page?: number;
  limit?: number;
  status?: PoolStatus;
  search?: string;
}

export interface LifecycleSyncResponse {
  message: string;
  activated: number;
  completed: number;
}
