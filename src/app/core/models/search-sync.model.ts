export type SyncCollectionType = 'all' | 'stores' | 'products' | 'pools';
export type SyncModeType = 'FULL' | 'DELTA';
export type SyncStatusType = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface TriggerSyncRequest {
  collection?: SyncCollectionType;
  mode?: SyncModeType;
  since?: string;
}

export interface TriggerSyncResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface TypesenseSyncHistoryRecord {
  id: string;
  collectionName: SyncCollectionType;
  mode: SyncModeType;
  status: SyncStatusType;
  totalRecords: number;
  succeededCount: number;
  failedCount: number;
  durationMs: number;
  errorSummary: string | null;
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface PaginatedSyncHistoryResponse {
  data: TypesenseSyncHistoryRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InitCollectionsResponse {
  message: string;
}
