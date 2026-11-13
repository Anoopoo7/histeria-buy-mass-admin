export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderNotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export type PickupVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'LOCKED';

export type PickupNotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED';

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  quantity: number;
  regularUnitPrice: number;
  regularSubtotal: number;
  discountedSubtotal: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  merchantId: string;
  poolId: string;
  participationId: string;
  cartId?: string;
  items: OrderItemSnapshot[];
  regularTotal: number;
  discountPercentage: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  placedAt: string;
  confirmedAt?: string | null;
  readyForPickupAt?: string | null;
  pickupVerifiedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  // WhatsApp notification outbox tracking
  notificationStatus?: OrderNotificationStatus;
  notificationAttempts?: number;
  notificationLastAttemptAt?: string | null;
  notificationError?: string | null;
  notificationProviderMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyPickupRequest {
  otp: string;
}

export interface VerifyPickupResponse {
  message: string;
  order: OrderRecord;
  pickupVerification?: {
    id: string;
    orderId: string;
    status: PickupVerificationStatus;
    verifiedAt: string;
    attemptCount: number;
  };
}

export interface ReadyForPickupResponse {
  message: string;
  order: OrderRecord;
  pickupVerification?: {
    id: string;
    orderId: string;
    status: PickupVerificationStatus;
    expiresAt: string;
  };
}

export interface AdminPickupVerificationView {
  id: string;
  orderId: string;
  userId: string;
  storeId: string;
  status: PickupVerificationStatus;
  expiresAt: string;
  verifiedAt?: string | null;
  attemptCount: number;
  maxAttempts: number;
  resendCount: number;
  maxResends: number;
  lastSentAt?: string | null;
  notificationStatus: PickupNotificationStatus;
  notificationAttempts: number;
  notificationLastAttemptAt?: string | null;
  notificationError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFailuresReport {
  poolFinalizationFailures: any[];
  orderNotificationFailures: OrderRecord[];
  expiredOrLockedPickups: AdminPickupVerificationView[];
  failedPickupNotifications: AdminPickupVerificationView[];
}

export interface PaginatedOrdersResponse {
  data: OrderRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  poolId?: string;
  storeId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'createdAt' | 'readyForPickupAt';
  sortOrder?: 'asc' | 'desc';
}
