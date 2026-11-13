import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  CreatePoolRequest,
  LifecycleSyncResponse,
  MerchantParticipantSummary,
  PaginatedPoolsResponse,
  PoolRecord,
  QueryPoolsParams,
  RejectPoolRequest,
  ReviewPoolRequest,
  UpdatePoolRequest,
} from '../models/pool.model';
import { ApiClientService } from './api-client.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class PoolService {
  private readonly apiClient = inject(ApiClientService);
  private readonly toast = inject(ToastService);

  // ==========================================
  // Merchant Endpoints
  // ==========================================

  /**
   * List authenticated merchant's pools with status filters & pagination.
   * GET /api/v1/merchant/pools
   */
  listMerchantPools(params?: QueryPoolsParams): Observable<PaginatedPoolsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams['page'] = params.page.toString();
    if (params?.limit) queryParams['limit'] = params.limit.toString();
    if (params?.status) queryParams['status'] = params.status;
    if (params?.search) queryParams['search'] = params.search;

    return this.apiClient.get<PaginatedPoolsResponse>('/api/v1/merchant/pools', {
      params: queryParams,
    });
  }

  /**
   * Get single merchant pool details.
   * GET /api/v1/merchant/pools/:poolId
   */
  getMerchantPool(poolId: string): Observable<{ pool: PoolRecord }> {
    return this.apiClient.get<{ pool: PoolRecord }>(`/api/v1/merchant/pools/${poolId}`);
  }

  /**
   * Create a new group-buying pool in DRAFT state.
   * POST /api/v1/merchant/pools
   */
  createPool(dto: CreatePoolRequest): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>('/api/v1/merchant/pools', dto)
      .pipe(
        tap((res) => {
          this.toast.success('Pool created in Draft status.');
        }),
      );
  }

  /**
   * Update a DRAFT or REJECTED pool.
   * PATCH /api/v1/merchant/pools/:poolId
   */
  updatePool(poolId: string, dto: UpdatePoolRequest): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .patch<{ message: string; pool: PoolRecord }>(`/api/v1/merchant/pools/${poolId}`, dto)
      .pipe(
        tap(() => {
          this.toast.success('Pool configuration updated.');
        }),
      );
  }

  /**
   * Add products to a DRAFT or REJECTED pool.
   * POST /api/v1/merchant/pools/:poolId/products
   */
  addProductsToPool(poolId: string, productIds: string[]): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>(`/api/v1/merchant/pools/${poolId}/products`, {
        productIds,
      })
      .pipe(
        tap(() => {
          this.toast.success('Products added to pool.');
        }),
      );
  }

  /**
   * Remove a product from a DRAFT or REJECTED pool.
   * DELETE /api/v1/merchant/pools/:poolId/products/:productId
   */
  removeProductFromPool(poolId: string, productId: string): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .delete<{ message: string; pool: PoolRecord }>(
        `/api/v1/merchant/pools/${poolId}/products/${productId}`,
      )
      .pipe(
        tap(() => {
          this.toast.info('Product removed from pool.');
        }),
      );
  }

  /**
   * Submit a DRAFT or REJECTED pool for admin approval.
   * POST /api/v1/merchant/pools/:poolId/submit
   */
  submitPoolForReview(poolId: string): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>(`/api/v1/merchant/pools/${poolId}/submit`, {})
      .pipe(
        tap(() => {
          this.toast.success('Pool submitted for administration review.');
        }),
      );
  }

  /**
   * Cancel a pool.
   * POST /api/v1/merchant/pools/:poolId/cancel
   */
  cancelPool(poolId: string): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>(`/api/v1/merchant/pools/${poolId}/cancel`, {})
      .pipe(
        tap(() => {
          this.toast.warning('Pool has been cancelled.');
        }),
      );
  }

  /**
   * View aggregated participant summary (no customer PII).
   * GET /api/v1/merchant/pools/:poolId/participants
   */
  getParticipantSummary(poolId: string): Observable<MerchantParticipantSummary> {
    return this.apiClient.get<MerchantParticipantSummary>(
      `/api/v1/merchant/pools/${poolId}/participants`,
    );
  }

  // ==========================================
  // Platform Admin Endpoints
  // ==========================================

  /**
   * Admin: List all platform pools across all stores.
   * GET /api/v1/admin/pools
   */
  listAdminPools(params?: QueryPoolsParams): Observable<PaginatedPoolsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams['page'] = params.page.toString();
    if (params?.limit) queryParams['limit'] = params.limit.toString();
    if (params?.status) queryParams['status'] = params.status;
    if (params?.search) queryParams['search'] = params.search;

    return this.apiClient.get<PaginatedPoolsResponse>('/api/v1/admin/pools', {
      params: queryParams,
    });
  }

  /**
   * Admin: Get pool details including admin internal notes.
   * GET /api/v1/admin/pools/:poolId
   */
  getAdminPool(poolId: string): Observable<{ pool: PoolRecord }> {
    return this.apiClient.get<{ pool: PoolRecord }>(`/api/v1/admin/pools/${poolId}`);
  }

  /**
   * Admin: Approve pool in PENDING_REVIEW -> transitions to SCHEDULED.
   * POST /api/v1/admin/pools/:poolId/approve
   */
  approvePool(poolId: string, dto?: ReviewPoolRequest): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>(`/api/v1/admin/pools/${poolId}/approve`, dto || {})
      .pipe(
        tap(() => {
          this.toast.success('Pool approved and scheduled.');
        }),
      );
  }

  /**
   * Admin: Reject pool with mandatory reason.
   * POST /api/v1/admin/pools/:poolId/reject
   */
  rejectPool(poolId: string, dto: RejectPoolRequest): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>(`/api/v1/admin/pools/${poolId}/reject`, dto)
      .pipe(
        tap(() => {
          this.toast.warning('Pool has been rejected with feedback.');
        }),
      );
  }

  /**
   * Admin: Temporarily pause an ACTIVE or SCHEDULED pool.
   * POST /api/v1/admin/pools/:poolId/pause
   */
  pausePool(poolId: string, dto?: ReviewPoolRequest): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>(`/api/v1/admin/pools/${poolId}/pause`, dto || {})
      .pipe(
        tap(() => {
          this.toast.info('Pool paused.');
        }),
      );
  }

  /**
   * Admin: Cancel a pool.
   * POST /api/v1/admin/pools/:poolId/cancel
   */
  adminCancelPool(poolId: string, dto?: ReviewPoolRequest): Observable<{ message: string; pool: PoolRecord }> {
    return this.apiClient
      .post<{ message: string; pool: PoolRecord }>(`/api/v1/admin/pools/${poolId}/cancel`, dto || {})
      .pipe(
        tap(() => {
          this.toast.warning('Pool cancelled by admin.');
        }),
      );
  }

  /**
   * Admin: Manually trigger the lifecycle batch job on-demand.
   * Promotes SCHEDULED pools whose start time has arrived to ACTIVE (auto-start),
   * and finalizes COMPLETED pools.
   * POST /api/v1/admin/pools/sync
   */
  syncLifecycleBatch(): Observable<LifecycleSyncResponse> {
    return this.apiClient
      .post<LifecycleSyncResponse>('/api/v1/admin/pools/sync', {})
      .pipe(
        tap((res) => {
          this.toast.success(
            `Lifecycle sync complete: ${res.activated} activated, ${res.completed} finalized.`,
          );
        }),
      );
  }
}
