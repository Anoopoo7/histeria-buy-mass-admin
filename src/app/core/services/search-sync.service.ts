import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  InitCollectionsResponse,
  PaginatedSyncHistoryResponse,
  TriggerSyncRequest,
  TriggerSyncResponse,
} from '../models/search-sync.model';
import { ApiClientService } from './api-client.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class SearchSyncService {
  private readonly apiClient = inject(ApiClientService);
  private readonly toast = inject(ToastService);

  /**
   * Trigger manual full re-index or delta sync for Typesense.
   * POST /api/v1/admin/search/sync
   */
  triggerSync(dto: TriggerSyncRequest): Observable<TriggerSyncResponse> {
    return this.apiClient
      .post<TriggerSyncResponse>('/api/v1/admin/search/sync', dto)
      .pipe(
        tap((res) => {
          this.toast.info(res.message || 'Indexing job queued successfully.');
        }),
      );
  }

  /**
   * Get paginated Typesense indexing history records.
   * GET /api/v1/admin/search/sync/history
   */
  getSyncHistory(params?: {
    page?: number;
    limit?: number;
    collection?: string;
  }): Observable<PaginatedSyncHistoryResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams['page'] = params.page.toString();
    if (params?.limit) queryParams['limit'] = params.limit.toString();
    if (params?.collection && params.collection !== 'all') {
      queryParams['collection'] = params.collection;
    }

    return this.apiClient.get<PaginatedSyncHistoryResponse>(
      '/api/v1/admin/search/sync/history',
      {
        params: queryParams,
      },
    );
  }

  /**
   * Manually initialize collection schemas in Typesense.
   * POST /api/v1/admin/search/collections/init
   */
  initCollections(): Observable<InitCollectionsResponse> {
    return this.apiClient
      .post<InitCollectionsResponse>('/api/v1/admin/search/collections/init', {})
      .pipe(
        tap((res) => {
          this.toast.success(res.message || 'Typesense collections initialized successfully.');
        }),
      );
  }
}
