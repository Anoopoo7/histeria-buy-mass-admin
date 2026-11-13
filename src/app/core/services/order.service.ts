import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AdminFailuresReport,
  AdminPickupVerificationView,
  OrderRecord,
  OrderStatus,
  PaginatedOrdersResponse,
  QueryOrdersParams,
  ReadyForPickupResponse,
  VerifyPickupResponse,
} from '../models/order.model';
import { ApiClientService } from './api-client.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apiClient = inject(ApiClientService);
  private readonly toast = inject(ToastService);

  // ==========================================
  // Merchant Orders Endpoints
  // ==========================================

  /**
   * List orders belonging to authenticated merchant's store.
   * GET /api/v1/merchant/orders
   */
  listMerchantOrders(params?: QueryOrdersParams): Observable<PaginatedOrdersResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams['page'] = params.page.toString();
    if (params?.limit) queryParams['limit'] = params.limit.toString();
    if (params?.status) queryParams['status'] = params.status;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.poolId) queryParams['poolId'] = params.poolId;
    if (params?.fromDate) queryParams['fromDate'] = params.fromDate;
    if (params?.toDate) queryParams['toDate'] = params.toDate;
    if (params?.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params?.sortOrder) queryParams['sortOrder'] = params.sortOrder;

    return this.apiClient.get<PaginatedOrdersResponse>('/api/v1/merchant/orders', {
      params: queryParams,
    });
  }

  /**
   * List orders awaiting customer collection at the store.
   * GET /api/v1/merchant/orders/ready-for-pickup
   */
  listReadyForPickupOrders(params?: QueryOrdersParams): Observable<PaginatedOrdersResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams['page'] = params.page.toString();
    if (params?.limit) queryParams['limit'] = params.limit.toString();
    if (params?.search) queryParams['search'] = params.search;
    if (params?.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params?.sortOrder) queryParams['sortOrder'] = params.sortOrder;

    return this.apiClient.get<PaginatedOrdersResponse>(
      '/api/v1/merchant/orders/ready-for-pickup',
      {
        params: queryParams,
      },
    );
  }

  /**
   * Get single order details for merchant.
   * GET /api/v1/merchant/orders/:orderId
   */
  getMerchantOrder(orderId: string): Observable<{ order: OrderRecord }> {
    return this.apiClient.get<{ order: OrderRecord }>(`/api/v1/merchant/orders/${orderId}`);
  }

  /**
   * Marks a CONFIRMED order as READY_FOR_PICKUP, generates a hashed pickup OTP,
   * and triggers a WhatsApp notification to the customer with their code.
   * PATCH /api/v1/merchant/orders/:orderId/ready-for-pickup
   */
  markOrderReadyForPickup(orderId: string): Observable<ReadyForPickupResponse> {
    return this.apiClient
      .patch<ReadyForPickupResponse>(
        `/api/v1/merchant/orders/${orderId}/ready-for-pickup`,
        {},
      )
      .pipe(
        tap(() => {
          this.toast.success('Order marked Ready for Pickup. WhatsApp verification code sent to customer.');
        }),
      );
  }

  /**
   * Verifies the customer's 6-digit pickup OTP and completes the order.
   * POST /api/v1/merchant/orders/:orderId/verify-pickup
   */
  verifyOrderPickup(orderId: string, otp: string): Observable<VerifyPickupResponse> {
    return this.apiClient
      .post<VerifyPickupResponse>(`/api/v1/merchant/orders/${orderId}/verify-pickup`, {
        otp: otp.trim(),
      })
      .pipe(
        tap(() => {
          this.toast.success('Pickup verified successfully! Order completed.');
        }),
      );
  }

  /**
   * Update order status with transition validation.
   * Direct completion without OTP verification is prohibited.
   * PATCH /api/v1/merchant/orders/:orderId/status
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<{ message: string; order: OrderRecord }> {
    return this.apiClient
      .patch<{ message: string; order: OrderRecord }>(
        `/api/v1/merchant/orders/${orderId}/status`,
        { status },
      )
      .pipe(
        tap(() => {
          this.toast.success(`Order status updated to ${status}.`);
        }),
      );
  }

  // ==========================================
  // Platform Admin Endpoints
  // ==========================================

  /**
   * Admin: List all platform orders across all merchants.
   * GET /api/v1/admin/orders
   */
  listAdminOrders(params?: QueryOrdersParams): Observable<PaginatedOrdersResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams['page'] = params.page.toString();
    if (params?.limit) queryParams['limit'] = params.limit.toString();
    if (params?.status) queryParams['status'] = params.status;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.storeId) queryParams['storeId'] = params.storeId;
    if (params?.poolId) queryParams['poolId'] = params.poolId;
    if (params?.fromDate) queryParams['fromDate'] = params.fromDate;
    if (params?.toDate) queryParams['toDate'] = params.toDate;

    return this.apiClient.get<PaginatedOrdersResponse>('/api/v1/admin/orders', {
      params: queryParams,
    });
  }

  /**
   * Admin: Get full order details including outbox diagnostics.
   * GET /api/v1/admin/orders/:orderId
   */
  getAdminOrder(orderId: string): Observable<{ order: OrderRecord }> {
    return this.apiClient.get<{ order: OrderRecord }>(`/api/v1/admin/orders/${orderId}`);
  }

  /**
   * Admin: Inspect pool finalization failures, WhatsApp outbox failures,
   * and expired or locked pickup verifications.
   * GET /api/v1/admin/orders/failures
   */
  inspectFailures(): Observable<AdminFailuresReport> {
    return this.apiClient.get<AdminFailuresReport>('/api/v1/admin/orders/failures');
  }

  /**
   * Admin: List pickup verification records.
   * GET /api/v1/admin/orders/pickups
   */
  listPickupVerifications(params?: Record<string, string>): Observable<{ data: AdminPickupVerificationView[]; pagination: any }> {
    return this.apiClient.get<{ data: AdminPickupVerificationView[]; pagination: any }>(
      '/api/v1/admin/orders/pickups',
      {
        params: params || {},
      },
    );
  }
}
