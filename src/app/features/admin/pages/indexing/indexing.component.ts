import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Filter,
  Layers,
  LucideAngularModule,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  X,
  Zap,
} from 'lucide-angular';
import {
  SyncCollectionType,
  SyncModeType,
  TypesenseSyncHistoryRecord,
} from '../../../../core/models/search-sync.model';
import { SearchSyncService } from '../../../../core/services/search-sync.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';

export type IndexingActiveTab = 'all' | 'stores' | 'products' | 'pools' | 'history';

@Component({
  selector: 'bm-admin-indexing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="bm-indexing-page">
      <bm-page-header
        title="Search Indexing & Typesense Clusters"
        subtitle="Manage search cluster indexing, schema initialization & audit sync history for stores, products, and pools"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Platform Administration' },
          { label: 'Search Indexing' }
        ]"
      >
        <div bmHeaderActions class="bm-header-actions-group">
          <bm-button
            variant="outline"
            size="md"
            [disabled]="isInitializing() || isLoadingHistory()"
            (btnClick)="openInitModal()"
          >
            <lucide-icon [img]="ServerIcon" [size]="16" bmLeading></lucide-icon>
            <span>Initialize Schemas</span>
          </bm-button>

          <bm-button
            variant="primary"
            size="md"
            [disabled]="isTriggeringSync()"
            (btnClick)="openSyncModal('all')"
          >
            <lucide-icon [img]="ZapIcon" [size]="16" bmLeading></lucide-icon>
            <span>Trigger Global Sync</span>
          </bm-button>
        </div>
      </bm-page-header>

      <!-- Active Job In-Progress Alert Banner -->
      @if (activeJob()) {
        <div class="bm-active-job-banner" role="status">
          <div class="bm-job-spinner">
            <lucide-icon [img]="RefreshIcon" [size]="20" class="bm-spin"></lucide-icon>
          </div>
          <div class="bm-job-content">
            <strong>Typesense Indexing In Progress...</strong>
            <p>
              Syncing <strong>{{ activeJob()!.collectionName.toUpperCase() }}</strong> collection in
              <strong>{{ activeJob()!.mode }}</strong> mode. Started by {{ activeJob()!.triggeredBy }}.
            </p>
          </div>
          <span class="bm-job-tag">AUTO-POLLING LIVE</span>
        </div>
      }

      <!-- Top Metric Overview Cards -->
      <div class="bm-metrics-grid">
        <div class="bm-metric-card">
          <div class="bm-metric-header">
            <span class="bm-metric-title">Total Indexing Jobs</span>
            <lucide-icon [img]="DatabaseIcon" [size]="18" class="text-primary"></lucide-icon>
          </div>
          <div class="bm-metric-value">{{ totalJobsCount() }}</div>
          <span class="bm-metric-sub">Across all Typesense collections</span>
        </div>

        <div class="bm-metric-card">
          <div class="bm-metric-header">
            <span class="bm-metric-title">Completed Successfully</span>
            <lucide-icon [img]="CheckCircle2Icon" [size]="18" class="text-success"></lucide-icon>
          </div>
          <div class="bm-metric-value text-success">{{ completedJobsCount() }}</div>
          <span class="bm-metric-sub">Ready for geo & keyword search</span>
        </div>

        <div class="bm-metric-card">
          <div class="bm-metric-header">
            <span class="bm-metric-title">Failed Sync Attempts</span>
            <lucide-icon [img]="AlertTriangleIcon" [size]="18" class="text-danger"></lucide-icon>
          </div>
          <div class="bm-metric-value text-danger">{{ failedJobsCount() }}</div>
          <span class="bm-metric-sub">Requires admin attention / cluster check</span>
        </div>

        <div class="bm-metric-card">
          <div class="bm-metric-header">
            <span class="bm-metric-title">Avg Sync Duration</span>
            <lucide-icon [img]="ClockIcon" [size]="18" class="text-muted"></lucide-icon>
          </div>
          <div class="bm-metric-value">{{ avgDurationFormatted() }}</div>
          <span class="bm-metric-sub">Batch throughput speed</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bm-tabs-container">
        <div class="bm-filter-tabs">
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="activeTab() === 'all'"
            (click)="setTab('all')"
          >
            <lucide-icon [img]="LayersIcon" [size]="16"></lucide-icon>
            <span>Overview & All Collections</span>
          </button>

          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="activeTab() === 'stores'"
            (click)="setTab('stores')"
          >
            <lucide-icon [img]="StoreIcon" [size]="16"></lucide-icon>
            <span>Stores</span>
            @if (getLatestStoreSync()) {
              <span class="bm-tab-pill" [class.success]="getLatestStoreSync()?.status === 'COMPLETED'">
                {{ getLatestStoreSync()?.status }}
              </span>
            }
          </button>

          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="activeTab() === 'products'"
            (click)="setTab('products')"
          >
            <lucide-icon [img]="ShoppingBagIcon" [size]="16"></lucide-icon>
            <span>Products</span>
            @if (getLatestProductSync()) {
              <span class="bm-tab-pill" [class.success]="getLatestProductSync()?.status === 'COMPLETED'">
                {{ getLatestProductSync()?.status }}
              </span>
            }
          </button>

          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="activeTab() === 'pools'"
            (click)="setTab('pools')"
          >
            <lucide-icon [img]="SparklesIcon" [size]="16"></lucide-icon>
            <span>Pools</span>
            @if (getLatestPoolSync()) {
              <span class="bm-tab-pill" [class.success]="getLatestPoolSync()?.status === 'COMPLETED'">
                {{ getLatestPoolSync()?.status }}
              </span>
            }
          </button>

          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="activeTab() === 'history'"
            (click)="setTab('history')"
          >
            <lucide-icon [img]="ClockIcon" [size]="16"></lucide-icon>
            <span>Sync History Audit</span>
            <span class="bm-tab-count">{{ totalHistoryCount() }}</span>
          </button>
        </div>
      </div>

      <!-- TAB 1: OVERVIEW & ALL COLLECTIONS -->
      @if (activeTab() === 'all') {
        <div class="bm-tab-pane">
          <!-- Collections Grid -->
          <div class="bm-collections-cards-grid">
            <!-- Stores Card -->
            <div class="bm-collection-card">
              <div class="bm-collection-header">
                <div class="bm-collection-icon store-icon">
                  <lucide-icon [img]="StoreIcon" [size]="22"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-collection-name">Stores Collection</h3>
                  <code class="bm-collection-key">typesense: stores</code>
                </div>
                <div class="bm-collection-actions">
                  <bm-button variant="outline" size="sm" (btnClick)="openSyncModal('stores')">
                    <lucide-icon [img]="PlayIcon" [size]="14" bmLeading></lucide-icon>
                    <span>Re-index</span>
                  </bm-button>
                </div>
              </div>
              <p class="bm-collection-desc">
                Enables location-radius storefront discovery, city/district filtering, and Kerala business type search.
              </p>
              <div class="bm-collection-meta">
                <div class="bm-meta-row">
                  <span class="bm-meta-label">Indexed Fields:</span>
                  <span class="bm-meta-val">storeName, location [lat, lng], city, state, businessType</span>
                </div>
                <div class="bm-meta-row">
                  <span class="bm-meta-label">Last Status:</span>
                  @if (getLatestStoreSync()) {
                    <bm-badge [variant]="getStatusBadgeVariant(getLatestStoreSync()!.status)" size="sm">
                      {{ getLatestStoreSync()!.status }}
                    </bm-badge>
                  } @else {
                    <span class="text-muted">No sync recorded yet</span>
                  }
                </div>
              </div>
            </div>

            <!-- Products Card -->
            <div class="bm-collection-card">
              <div class="bm-collection-header">
                <div class="bm-collection-icon product-icon">
                  <lucide-icon [img]="ShoppingBagIcon" [size]="22"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-collection-name">Products Collection</h3>
                  <code class="bm-collection-key">typesense: products</code>
                </div>
                <div class="bm-collection-actions">
                  <bm-button variant="outline" size="sm" (btnClick)="openSyncModal('products')">
                    <lucide-icon [img]="PlayIcon" [size]="14" bmLeading></lucide-icon>
                    <span>Re-index</span>
                  </bm-button>
                </div>
              </div>
              <p class="bm-collection-desc">
                Facilitates customer instant search, price-range faceting, category browsing, and local store inventory filtering.
              </p>
              <div class="bm-collection-meta">
                <div class="bm-meta-row">
                  <span class="bm-meta-label">Indexed Fields:</span>
                  <span class="bm-meta-val">name, category, brand, price, location [lat, lng], storeId</span>
                </div>
                <div class="bm-meta-row">
                  <span class="bm-meta-label">Last Status:</span>
                  @if (getLatestProductSync()) {
                    <bm-badge [variant]="getStatusBadgeVariant(getLatestProductSync()!.status)" size="sm">
                      {{ getLatestProductSync()!.status }}
                    </bm-badge>
                  } @else {
                    <span class="text-muted">No sync recorded yet</span>
                  }
                </div>
              </div>
            </div>

            <!-- Pools Card -->
            <div class="bm-collection-card">
              <div class="bm-collection-header">
                <div class="bm-collection-icon pool-icon">
                  <lucide-icon [img]="SparklesIcon" [size]="22"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-collection-name">Pools Collection</h3>
                  <code class="bm-collection-key">typesense: pools</code>
                </div>
                <div class="bm-collection-actions">
                  <bm-button variant="outline" size="sm" (btnClick)="openSyncModal('pools')">
                    <lucide-icon [img]="PlayIcon" [size]="14" bmLeading></lucide-icon>
                    <span>Re-index</span>
                  </bm-button>
                </div>
              </div>
              <p class="bm-collection-desc">
                Powers group-buying discovery, active campaign progression, minimum discount tier search, and neighbor pooling.
              </p>
              <div class="bm-collection-meta">
                <div class="bm-meta-row">
                  <span class="bm-meta-label">Indexed Fields:</span>
                  <span class="bm-meta-val">title, minDiscountPercentage, category, location, status</span>
                </div>
                <div class="bm-meta-row">
                  <span class="bm-meta-label">Last Status:</span>
                  @if (getLatestPoolSync()) {
                    <bm-badge [variant]="getStatusBadgeVariant(getLatestPoolSync()!.status)" size="sm">
                      {{ getLatestPoolSync()!.status }}
                    </bm-badge>
                  } @else {
                    <span class="text-muted">No sync recorded yet</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Operations Recap -->
          <bm-card title="Recent Indexing Jobs" subtitle="Latest full and delta sync executions across all collections">
            <div bmCardAction>
              <bm-button variant="outline" size="sm" (btnClick)="loadHistory()">
                <lucide-icon [img]="RefreshIcon" [size]="14" [class.bm-spin]="isLoadingHistory()" bmLeading></lucide-icon>
                <span>Refresh History</span>
              </bm-button>
            </div>
            <ng-container *ngTemplateOutlet="historyTableTemplate; context: { items: recentSyncHistory(), showViewAll: true }"></ng-container>
          </bm-card>
        </div>
      }

      <!-- TAB 2: STORES TAB -->
      @if (activeTab() === 'stores') {
        <div class="bm-tab-pane">
          <div class="bm-collection-detail-header">
            <div class="bm-collection-detail-info">
              <h2>Stores Index Management</h2>
              <p>
                MongoDB stores collections are mapped to Typesense documents including 2D geolocation coordinates
                for radius matching and neighborhood distance sorting.
              </p>
            </div>
            <div class="bm-collection-detail-buttons">
              <bm-button variant="primary" size="md" (btnClick)="openSyncModal('stores', 'FULL')">
                <lucide-icon [img]="PlayIcon" [size]="16" bmLeading></lucide-icon>
                <span>Full Stores Re-index</span>
              </bm-button>
              <bm-button variant="outline" size="md" (btnClick)="openSyncModal('stores', 'DELTA')">
                <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading></lucide-icon>
                <span>Delta Sync</span>
              </bm-button>
            </div>
          </div>

          <bm-card title="Stores Index History" subtitle="Audit log of re-index events for the stores collection">
            <ng-container *ngTemplateOutlet="historyTableTemplate; context: { items: collectionHistory('stores'), showViewAll: false }"></ng-container>
          </bm-card>
        </div>
      }

      <!-- TAB 3: PRODUCTS TAB -->
      @if (activeTab() === 'products') {
        <div class="bm-tab-pane">
          <div class="bm-collection-detail-header">
            <div class="bm-collection-detail-info">
              <h2>Products Index Management</h2>
              <p>
                Product catalogue entries mapped to Typesense with text search, faceted categories, pricing bounds,
                and store location metadata for instant local delivery discovery.
              </p>
            </div>
            <div class="bm-collection-detail-buttons">
              <bm-button variant="primary" size="md" (btnClick)="openSyncModal('products', 'FULL')">
                <lucide-icon [img]="PlayIcon" [size]="16" bmLeading></lucide-icon>
                <span>Full Products Re-index</span>
              </bm-button>
              <bm-button variant="outline" size="md" (btnClick)="openSyncModal('products', 'DELTA')">
                <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading></lucide-icon>
                <span>Delta Sync</span>
              </bm-button>
            </div>
          </div>

          <bm-card title="Products Index History" subtitle="Audit log of re-index events for the products collection">
            <ng-container *ngTemplateOutlet="historyTableTemplate; context: { items: collectionHistory('products'), showViewAll: false }"></ng-container>
          </bm-card>
        </div>
      }

      <!-- TAB 4: POOLS TAB -->
      @if (activeTab() === 'pools') {
        <div class="bm-tab-pane">
          <div class="bm-collection-detail-header">
            <div class="bm-collection-detail-info">
              <h2>Group-Buying Pools Index Management</h2>
              <p>
                Group buying campaigns indexed for active discount queries, discount tier thresholds, and local pickup
                proximity filters.
              </p>
            </div>
            <div class="bm-collection-detail-buttons">
              <bm-button variant="primary" size="md" (btnClick)="openSyncModal('pools', 'FULL')">
                <lucide-icon [img]="PlayIcon" [size]="16" bmLeading></lucide-icon>
                <span>Full Pools Re-index</span>
              </bm-button>
              <bm-button variant="outline" size="md" (btnClick)="openSyncModal('pools', 'DELTA')">
                <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading></lucide-icon>
                <span>Delta Sync</span>
              </bm-button>
            </div>
          </div>

          <bm-card title="Pools Index History" subtitle="Audit log of re-index events for the pools collection">
            <ng-container *ngTemplateOutlet="historyTableTemplate; context: { items: collectionHistory('pools'), showViewAll: false }"></ng-container>
          </bm-card>
        </div>
      }

      <!-- TAB 5: COMPREHENSIVE HISTORY AUDIT -->
      @if (activeTab() === 'history') {
        <div class="bm-tab-pane">
          <bm-card title="Typesense Indexing Audit Log" subtitle="Comprehensive record of background sync runs, record throughput & diagnostics">
            <div bmCardAction class="bm-history-filter-bar">
              <select
                class="bm-select-filter"
                [ngModel]="historyCollectionFilter()"
                (ngModelChange)="onFilterCollectionChange($event)"
              >
                <option value="all">All Collections</option>
                <option value="stores">Stores Only</option>
                <option value="products">Products Only</option>
                <option value="pools">Pools Only</option>
              </select>

              <bm-button variant="outline" size="sm" (btnClick)="loadHistory()">
                <lucide-icon [img]="RefreshIcon" [size]="14" [class.bm-spin]="isLoadingHistory()" bmLeading></lucide-icon>
                <span>Refresh</span>
              </bm-button>
            </div>

            <ng-container *ngTemplateOutlet="historyTableTemplate; context: { items: historyRecords(), showViewAll: false }"></ng-container>

            <!-- Pagination Bar -->
            @if (historyPagination().totalPages > 1) {
              <div class="bm-pagination-footer">
                <span class="bm-page-info">
                  Showing page {{ historyPagination().page }} of {{ historyPagination().totalPages }}
                  ({{ historyPagination().total }} total sync jobs)
                </span>
                <div class="bm-pagination-controls">
                  <button
                    type="button"
                    class="bm-page-btn"
                    [disabled]="historyPagination().page <= 1 || isLoadingHistory()"
                    (click)="changePage(historyPagination().page - 1)"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    class="bm-page-btn"
                    [disabled]="historyPagination().page >= historyPagination().totalPages || isLoadingHistory()"
                    (click)="changePage(historyPagination().page + 1)"
                  >
                    Next
                  </button>
                </div>
              </div>
            }
          </bm-card>
        </div>
      }

      <!-- REUSABLE TABLE TEMPLATE FOR HISTORY -->
      <ng-template #historyTableTemplate let-items="items" let-showViewAll="showViewAll">
        @if (isLoadingHistory() && items.length === 0) {
          <div class="bm-skeleton-table-wrapper" aria-label="Loading history">
            <bm-skeleton variant="table-row" [count]="5" [columns]="6"></bm-skeleton>
          </div>
        } @else if (items.length === 0) {
          <bm-empty-state
            title="No Sync History Recorded"
            description="No background Typesense indexing jobs found for this collection."
          >
            <div bmEmptyIcon>
              <lucide-icon [img]="DatabaseIcon" [size]="40"></lucide-icon>
            </div>
            <div bmEmptyAction>
              <bm-button variant="outline" size="sm" (btnClick)="openSyncModal('all')">
                <span>Trigger First Sync</span>
              </bm-button>
            </div>
          </bm-empty-state>
        } @else {
          <div class="bm-table-wrapper">
            <table class="bm-table" aria-label="Sync History Table">
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Throughput / Duration</th>
                  <th>Started</th>
                  <th>Triggered By</th>
                </tr>
              </thead>
              <tbody>
                @for (record of items; track record.id) {
                  <tr>
                    <td>
                      <div class="bm-col-badge-wrap">
                        <span class="bm-collection-tag" [attr.data-col]="record.collectionName">
                          {{ record.collectionName.toUpperCase() }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span class="bm-mode-pill" [class.full]="record.mode === 'FULL'">
                        {{ record.mode }}
                      </span>
                    </td>
                    <td>
                      <bm-badge [variant]="getStatusBadgeVariant(record.status)" size="sm">
                        @if (record.status === 'IN_PROGRESS') {
                          <lucide-icon [img]="RefreshIcon" [size]="12" class="bm-spin" bmLeading></lucide-icon>
                        }
                        {{ record.status }}
                      </bm-badge>
                    </td>
                    <td>
                      <div class="bm-records-cell">
                        <strong>{{ record.totalRecords }}</strong>
                        <span class="text-success" title="Succeeded">✓ {{ record.succeededCount }}</span>
                        @if (record.failedCount > 0) {
                          <span class="text-danger" title="Failed">✗ {{ record.failedCount }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="bm-cell-duration">{{ formatDuration(record.durationMs) }}</span>
                    </td>
                    <td>
                      <span class="bm-cell-time">{{ record.startedAt | date:'medium' }}</span>
                    </td>
                    <td>
                      <span class="bm-cell-user">{{ record.triggeredBy }}</span>
                    </td>
                  </tr>

                  <!-- Error message row if failed -->
                  @if (record.errorSummary) {
                    <tr class="bm-error-row">
                      <td colspan="7">
                        <div class="bm-error-alert">
                          <lucide-icon [img]="AlertCircleIcon" [size]="14"></lucide-icon>
                          <span>{{ record.errorSummary }}</span>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (showViewAll && historyRecords().length > 5) {
            <div class="bm-card-view-all">
              <button type="button" class="bm-link-btn" (click)="setTab('history')">
                <span>View Full Audit History ({{ totalHistoryCount() }} jobs) &rarr;</span>
              </button>
            </div>
          }
        }
      </ng-template>

      <!-- MODAL: TRIGGER SYNC -->
      @if (isSyncModalOpen()) {
        <div class="bm-modal-backdrop" (click)="closeSyncModal()">
          <div class="bm-modal-container" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <div>
                <h3 class="bm-modal-title">Trigger Typesense Re-Index</h3>
                <p class="bm-modal-subtitle">Initiate background document syncing into the search cluster</p>
              </div>
              <button type="button" class="bm-close-btn" (click)="closeSyncModal()">
                <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <div class="bm-modal-body">
              <!-- Collection Selection -->
              <div class="bm-form-group">
                <label class="bm-form-label">Target Collection</label>
                <div class="bm-radio-group">
                  <label class="bm-radio-pill" [class.selected]="syncFormCollection === 'all'">
                    <input type="radio" name="col" value="all" [(ngModel)]="syncFormCollection" />
                    <span>All Collections (Stores, Products, Pools)</span>
                  </label>
                  <label class="bm-radio-pill" [class.selected]="syncFormCollection === 'stores'">
                    <input type="radio" name="col" value="stores" [(ngModel)]="syncFormCollection" />
                    <span>Stores Collection Only</span>
                  </label>
                  <label class="bm-radio-pill" [class.selected]="syncFormCollection === 'products'">
                    <input type="radio" name="col" value="products" [(ngModel)]="syncFormCollection" />
                    <span>Products Collection Only</span>
                  </label>
                  <label class="bm-radio-pill" [class.selected]="syncFormCollection === 'pools'">
                    <input type="radio" name="col" value="pools" [(ngModel)]="syncFormCollection" />
                    <span>Pools Collection Only</span>
                  </label>
                </div>
              </div>

              <!-- Mode Selection -->
              <div class="bm-form-group">
                <label class="bm-form-label">Indexing Mode</label>
                <div class="bm-mode-cards">
                  <div
                    class="bm-mode-card"
                    [class.selected]="syncFormMode === 'FULL'"
                    (click)="syncFormMode = 'FULL'"
                  >
                    <div class="bm-mode-header">
                      <strong>FULL Re-index</strong>
                      <span class="bm-tag">Recommended on Deploy</span>
                    </div>
                    <p>Scans the complete MongoDB collection and re-indexes every document from scratch.</p>
                  </div>

                  <div
                    class="bm-mode-card"
                    [class.selected]="syncFormMode === 'DELTA'"
                    (click)="syncFormMode = 'DELTA'"
                  >
                    <div class="bm-mode-header">
                      <strong>DELTA Sync</strong>
                      <span class="bm-tag">Fast Incremental</span>
                    </div>
                    <p>Only indexes documents created or updated since the last successful sync run.</p>
                  </div>
                </div>
              </div>

              @if (syncFormMode === 'DELTA') {
                <div class="bm-form-group">
                  <label class="bm-form-label">Custom Since Date (Optional ISO timestamp)</label>
                  <input
                    type="text"
                    class="bm-form-input"
                    placeholder="Leave blank to sync since last successful run"
                    [(ngModel)]="syncFormSince"
                  />
                  <span class="bm-form-hint">Format: YYYY-MM-DDTHH:mm:ssZ (or leave empty for automatic)</span>
                </div>
              }
            </div>

            <div class="bm-modal-footer">
              <bm-button variant="outline" size="md" (btnClick)="closeSyncModal()" [disabled]="isTriggeringSync()">
                <span>Cancel</span>
              </bm-button>
              <bm-button variant="primary" size="md" (btnClick)="submitSync()" [disabled]="isTriggeringSync()">
                @if (isTriggeringSync()) {
                  <lucide-icon [img]="RefreshIcon" [size]="16" class="bm-spin" bmLeading></lucide-icon>
                } @else {
                  <lucide-icon [img]="PlayIcon" [size]="16" bmLeading></lucide-icon>
                }
                <span>{{ isTriggeringSync() ? 'Queuing Job...' : 'Start Indexing Job' }}</span>
              </bm-button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: INITIALIZE SCHEMAS -->
      @if (isInitModalOpen()) {
        <div class="bm-modal-backdrop" (click)="isInitModalOpen.set(false)">
          <div class="bm-modal-container" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <div>
                <h3 class="bm-modal-title">Initialize Typesense Schemas</h3>
                <p class="bm-modal-subtitle">Ensure collection schemas and field configurations exist in cluster</p>
              </div>
              <button type="button" class="bm-close-btn" (click)="isInitModalOpen.set(false)">
                <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <div class="bm-modal-body">
              <div class="bm-info-box">
                <lucide-icon [img]="ServerIcon" [size]="20" class="text-primary"></lucide-icon>
                <p>
                  This triggers schema verification for <strong>stores</strong>, <strong>products</strong>, and
                  <strong>pools</strong> collections in Typesense. Any missing collections or facet indices will be registered.
                </p>
              </div>
              <p class="text-secondary" style="font-size: 13px; margin-top: 12px;">
                Safe operation: existing documents are retained. Run this after updating search schema attributes.
              </p>
            </div>

            <div class="bm-modal-footer">
              <bm-button variant="outline" size="md" (btnClick)="isInitModalOpen.set(false)" [disabled]="isInitializing()">
                <span>Cancel</span>
              </bm-button>
              <bm-button variant="primary" size="md" (btnClick)="submitInitCollections()" [disabled]="isInitializing()">
                @if (isInitializing()) {
                  <lucide-icon [img]="RefreshIcon" [size]="16" class="bm-spin" bmLeading></lucide-icon>
                }
                <span>{{ isInitializing() ? 'Initializing...' : 'Initialize All Schemas' }}</span>
              </bm-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bm-indexing-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-header-actions-group {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    // Active Job In-Progress Banner
    .bm-active-job-banner {
      display: flex;
      align-items: center;
      gap: var(--bm-space-4);
      padding: var(--bm-space-4);
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-left: 4px solid #2563EB;
      border-radius: var(--bm-radius-md);
      box-shadow: var(--bm-shadow-xs);
    }

    .bm-job-spinner {
      color: #2563EB;
      display: flex;
      align-items: center;
    }

    .bm-job-content {
      flex: 1;
      font-size: var(--bm-font-size-xs);
      color: #1E3A8A;

      strong {
        font-size: var(--bm-font-size-sm);
        display: block;
        margin-bottom: 2px;
      }

      p {
        margin: 0;
      }
    }

    .bm-job-tag {
      font-size: 10px;
      font-weight: 700;
      background: #DBEAFE;
      color: #1D4ED8;
      padding: 3px 8px;
      border-radius: var(--bm-radius-full);
      letter-spacing: 0.05em;
    }

    // Metric Grid
    .bm-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--bm-space-4);
    }

    .bm-metric-card {
      background: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      padding: var(--bm-space-4) var(--bm-space-5);
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: var(--bm-shadow-xs);
    }

    .bm-metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-metric-title {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-secondary);
    }

    .bm-metric-value {
      font-size: var(--bm-font-size-2xl);
      font-weight: var(--bm-font-weight-bold);
      color: var(--bm-color-text-primary);
      letter-spacing: -0.02em;
    }

    .bm-metric-sub {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .text-primary { color: var(--bm-color-primary, #176B50); }
    .text-success { color: var(--bm-color-accent, #22C55E); }
    .text-danger { color: var(--bm-color-danger, #EF4444); }
    .text-muted { color: var(--bm-color-text-muted, #94A3B8); }

    // Tabs
    .bm-tabs-container {
      border-bottom: 1px solid var(--bm-color-border);
      padding-bottom: var(--bm-space-2);
    }

    .bm-filter-tabs {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .bm-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: 8px 14px;
      background: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--bm-transition-fast);

      &:hover {
        background: var(--bm-color-surface-subtle);
        color: var(--bm-color-text-primary);
      }

      &.active {
        background: var(--bm-color-primary-soft, #E6F4ED);
        color: var(--bm-color-primary, #176B50);
        border-color: var(--bm-color-primary);
        font-weight: 600;
      }
    }

    .bm-tab-pill {
      font-size: 10px;
      padding: 1px 6px;
      background: var(--bm-color-surface-subtle);
      border-radius: var(--bm-radius-full);
      color: var(--bm-color-text-muted);

      &.success {
        background: #DCFCE7;
        color: #15803D;
      }
    }

    .bm-tab-count {
      font-size: 10px;
      font-weight: 700;
      background: var(--bm-color-surface-subtle);
      color: var(--bm-color-text-secondary);
      padding: 1px 6px;
      border-radius: var(--bm-radius-full);
    }

    .bm-tab-pane {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    // Collections Grid
    .bm-collections-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--bm-space-4);
    }

    .bm-collection-card {
      background: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      padding: var(--bm-space-5);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      box-shadow: var(--bm-shadow-xs);
    }

    .bm-collection-header {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-collection-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--bm-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.store-icon {
        background: #E0F2FE;
        color: #0369A1;
      }

      &.product-icon {
        background: #FEF3C7;
        color: #B45309;
      }

      &.pool-icon {
        background: #EDE9FE;
        color: #6D28D9;
      }
    }

    .bm-collection-name {
      font-size: var(--bm-font-size-sm);
      font-weight: 600;
      margin: 0;
      color: var(--bm-color-text-primary);
    }

    .bm-collection-key {
      font-family: var(--bm-font-mono);
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-collection-actions {
      margin-left: auto;
    }

    .bm-collection-desc {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .bm-collection-meta {
      background: var(--bm-color-surface-subtle);
      border-radius: var(--bm-radius-md);
      padding: var(--bm-space-3);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11px;
    }

    .bm-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .bm-meta-label {
      color: var(--bm-color-text-muted);
      font-weight: 500;
    }

    .bm-meta-val {
      font-family: var(--bm-font-mono);
      color: var(--bm-color-text-primary);
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 60%;
    }

    // Detail Pane Header
    .bm-collection-detail-header {
      background: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      padding: var(--bm-space-5);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);

      @media (min-width: 640px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .bm-collection-detail-info {
      h2 {
        font-size: var(--bm-font-size-base);
        font-weight: 600;
        margin-bottom: 4px;
      }

      p {
        font-size: var(--bm-font-size-xs);
        color: var(--bm-color-text-secondary);
        margin: 0;
        max-width: 580px;
      }
    }

    .bm-collection-detail-buttons {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    // History Table
    .bm-table-wrapper {
      overflow-x: auto;
    }

    .bm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--bm-font-size-xs);
      text-align: left;

      th {
        padding: 12px 16px;
        background: var(--bm-color-surface-subtle);
        border-bottom: 1px solid var(--bm-color-border);
        color: var(--bm-color-text-secondary);
        font-weight: 600;
        white-space: nowrap;
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--bm-color-border);
        color: var(--bm-color-text-primary);
        vertical-align: middle;
      }
    }

    .bm-collection-tag {
      font-family: var(--bm-font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: var(--bm-radius-sm);
      letter-spacing: 0.05em;

      &[data-col="all"] {
        background: #F3F4F6;
        color: #374151;
      }
      &[data-col="stores"] {
        background: #E0F2FE;
        color: #0369A1;
      }
      &[data-col="products"] {
        background: #FEF3C7;
        color: #B45309;
      }
      &[data-col="pools"] {
        background: #EDE9FE;
        color: #6D28D9;
      }
    }

    .bm-mode-pill {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: var(--bm-radius-sm);
      background: var(--bm-color-surface-subtle);
      color: var(--bm-color-text-secondary);

      &.full {
        background: #E6F4ED;
        color: #176B50;
      }
    }

    .bm-records-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }

    .bm-cell-duration {
      font-family: var(--bm-font-mono);
      font-size: 11px;
      color: var(--bm-color-text-secondary);
    }

    .bm-cell-time {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      white-space: nowrap;
    }

    .bm-cell-user {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-error-row {
      background: #FEF2F2;

      td {
        padding: 8px 16px;
        border-bottom: 1px solid #FECACA;
      }
    }

    .bm-error-alert {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #B91C1C;
    }

    .bm-card-view-all {
      padding: 12px 16px;
      text-align: center;
      border-top: 1px solid var(--bm-color-border);
    }

    .bm-link-btn {
      background: transparent;
      border: none;
      color: var(--bm-color-primary);
      font-size: var(--bm-font-size-xs);
      font-weight: 600;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    // History filter & pagination
    .bm-history-filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bm-select-filter {
      padding: 6px 10px;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      background: var(--bm-color-surface);
      color: var(--bm-color-text-primary);
      cursor: pointer;
    }

    .bm-pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--bm-color-border);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
    }

    .bm-pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bm-page-btn {
      padding: 4px 10px;
      border: 1px solid var(--bm-color-border);
      background: var(--bm-color-surface);
      border-radius: var(--bm-radius-sm);
      font-size: var(--bm-font-size-xs);
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    // Modal
    .bm-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--bm-space-4);
      overflow-y: auto;
    }

    .bm-modal-container {
      background: #FFFFFF;
      border-radius: var(--bm-radius-xl);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 540px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin: auto;
    }

    .bm-modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--bm-color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-modal-title {
      font-size: var(--bm-font-size-base);
      font-weight: 600;
      margin: 0;
      color: var(--bm-color-text-primary);
    }

    .bm-modal-subtitle {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 2px 0 0 0;
    }

    .bm-close-btn {
      background: transparent;
      border: none;
      color: var(--bm-color-text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: var(--bm-radius-sm);

      &:hover {
        background: var(--bm-color-surface-subtle);
        color: var(--bm-color-text-primary);
      }
    }

    .bm-modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      max-height: calc(90vh - 140px);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bm-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-form-label {
      font-size: var(--bm-font-size-xs);
      font-weight: 600;
      color: var(--bm-color-text-primary);
    }

    .bm-form-hint {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-form-input {
      padding: 8px 12px;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      outline: none;

      &:focus {
        border-color: var(--bm-color-primary);
      }
    }

    .bm-radio-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-radio-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      cursor: pointer;
      transition: all 150ms ease;

      &.selected {
        border-color: var(--bm-color-primary);
        background: var(--bm-color-primary-soft, #E6F4ED);
        font-weight: 600;
        color: var(--bm-color-primary);
      }
    }

    .bm-mode-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .bm-mode-card {
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 150ms ease;

      p {
        font-size: 11px;
        color: var(--bm-color-text-secondary);
        margin: 0;
      }

      &.selected {
        border-color: var(--bm-color-primary);
        background: var(--bm-color-primary-soft, #E6F4ED);

        strong {
          color: var(--bm-color-primary);
        }
      }
    }

    .bm-mode-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      strong {
        font-size: var(--bm-font-size-xs);
      }

      .bm-tag {
        font-size: 9px;
        font-weight: 700;
        background: #DBEAFE;
        color: #1D4ED8;
        padding: 1px 4px;
        border-radius: 4px;
      }
    }

    .bm-info-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: var(--bm-color-surface-subtle);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);

      p {
        margin: 0;
        line-height: 1.5;
      }
    }

    .bm-modal-footer {
      padding: 14px 24px;
      border-top: 1px solid var(--bm-color-border);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
  `],
})
export class AdminIndexingPageComponent implements OnInit, OnDestroy {
  private readonly searchSyncService = inject(SearchSyncService);
  private readonly toast = inject(ToastService);

  readonly RefreshIcon = RefreshCw;
  readonly DatabaseIcon = Database;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly AlertCircleIcon = AlertCircle;
  readonly ClockIcon = Clock;
  readonly LayersIcon = Layers;
  readonly StoreIcon = Store;
  readonly ShoppingBagIcon = ShoppingBag;
  readonly SparklesIcon = Sparkles;
  readonly PlayIcon = Play;
  readonly ZapIcon = Zap;
  readonly ServerIcon = Server;
  readonly XIcon = X;

  readonly activeTab = signal<IndexingActiveTab>('all');
  readonly historyRecords = signal<TypesenseSyncHistoryRecord[]>([]);
  readonly historyPagination = signal({ total: 0, page: 1, limit: 15, totalPages: 1 });
  readonly historyCollectionFilter = signal<string>('all');

  readonly isLoadingHistory = signal<boolean>(false);
  readonly isTriggeringSync = signal<boolean>(false);
  readonly isInitializing = signal<boolean>(false);

  readonly isSyncModalOpen = signal<boolean>(false);
  readonly isInitModalOpen = signal<boolean>(false);

  // Form state for Sync Modal
  syncFormCollection: SyncCollectionType = 'all';
  syncFormMode: SyncModeType = 'FULL';
  syncFormSince = '';

  private pollInterval?: ReturnType<typeof setInterval>;

  readonly activeJob = computed(() => {
    return this.historyRecords().find((r) => r.status === 'IN_PROGRESS') || null;
  });

  readonly totalJobsCount = computed(() => {
    return this.historyPagination().total || this.historyRecords().length;
  });

  readonly completedJobsCount = computed(() => {
    return this.historyRecords().filter((r) => r.status === 'COMPLETED').length;
  });

  readonly failedJobsCount = computed(() => {
    return this.historyRecords().filter((r) => r.status === 'FAILED').length;
  });

  readonly avgDurationFormatted = computed(() => {
    const records = this.historyRecords().filter((r) => r.durationMs > 0);
    if (records.length === 0) return '—';
    const avg = Math.round(records.reduce((sum, r) => sum + r.durationMs, 0) / records.length);
    return this.formatDuration(avg);
  });

  readonly totalHistoryCount = computed(() => {
    return this.historyPagination().total;
  });

  readonly recentSyncHistory = computed(() => {
    return this.historyRecords().slice(0, 5);
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  setTab(tab: IndexingActiveTab): void {
    this.activeTab.set(tab);
  }

  collectionHistory(collection: SyncCollectionType): TypesenseSyncHistoryRecord[] {
    return this.historyRecords().filter((r) => r.collectionName === collection);
  }

  getLatestStoreSync(): TypesenseSyncHistoryRecord | undefined {
    return this.historyRecords().find((r) => r.collectionName === 'stores');
  }

  getLatestProductSync(): TypesenseSyncHistoryRecord | undefined {
    return this.historyRecords().find((r) => r.collectionName === 'products');
  }

  getLatestPoolSync(): TypesenseSyncHistoryRecord | undefined {
    return this.historyRecords().find((r) => r.collectionName === 'pools');
  }

  loadHistory(page = 1): void {
    this.isLoadingHistory.set(true);
    const colFilter = this.historyCollectionFilter();

    this.searchSyncService
      .getSyncHistory({
        page,
        limit: 15,
        collection: colFilter,
      })
      .subscribe({
        next: (res) => {
          this.isLoadingHistory.set(false);
          this.historyRecords.set(res.data || []);
          this.historyPagination.set(
            res.pagination || { total: res.data?.length || 0, page: 1, limit: 15, totalPages: 1 },
          );

          // Check if any job is IN_PROGRESS; if so, maintain polling
          if (res.data?.some((r) => r.status === 'IN_PROGRESS')) {
            this.startPolling();
          } else {
            this.stopPolling();
          }
        },
        error: () => {
          this.isLoadingHistory.set(false);
          this.stopPolling();
        },
      });
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.historyPagination().totalPages) {
      this.loadHistory(newPage);
    }
  }

  onFilterCollectionChange(col: string): void {
    this.historyCollectionFilter.set(col);
    this.loadHistory(1);
  }

  openSyncModal(collection: SyncCollectionType = 'all', mode: SyncModeType = 'FULL'): void {
    this.syncFormCollection = collection;
    this.syncFormMode = mode;
    this.syncFormSince = '';
    this.isSyncModalOpen.set(true);
  }

  closeSyncModal(): void {
    this.isSyncModalOpen.set(false);
  }

  openInitModal(): void {
    this.isInitModalOpen.set(true);
  }

  submitSync(): void {
    this.isTriggeringSync.set(true);

    this.searchSyncService
      .triggerSync({
        collection: this.syncFormCollection,
        mode: this.syncFormMode,
        since: this.syncFormSince.trim() ? this.syncFormSince.trim() : undefined,
      })
      .subscribe({
        next: () => {
          this.isTriggeringSync.set(false);
          this.closeSyncModal();
          this.loadHistory(1);
          this.startPolling();
        },
        error: () => {
          this.isTriggeringSync.set(false);
        },
      });
  }

  submitInitCollections(): void {
    this.isInitializing.set(true);

    this.searchSyncService.initCollections().subscribe({
      next: () => {
        this.isInitializing.set(false);
        this.isInitModalOpen.set(false);
      },
      error: () => {
        this.isInitializing.set(false);
      },
    });
  }

  private startPolling(): void {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      this.loadHistory(this.historyPagination().page);
    }, 2500);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  getStatusBadgeVariant(status: TypesenseSyncHistoryRecord['status']): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'FAILED':
        return 'danger';
      case 'PARTIAL':
        return 'warning';
      default:
        return 'info';
    }
  }

  formatDuration(ms: number): string {
    if (!ms || ms <= 0) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    const sec = (ms / 1000).toFixed(1);
    return `${sec}s`;
  }
}
