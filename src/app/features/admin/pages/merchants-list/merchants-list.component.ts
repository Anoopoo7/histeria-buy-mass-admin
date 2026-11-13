import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  LucideAngularModule,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
} from 'lucide-angular';
import { MerchantRecord, MerchantStatus } from '../../../../core/models/merchant.model';
import { AdminMerchantService } from '../../../../core/services/admin-merchant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-admin-merchants-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="bm-admin-merchants-page">
      <bm-page-header
        title="Store Opening Applications"
        subtitle="Admin portal to review, inspect, approve, or reject merchant storefront applications"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Admin Applications' }
        ]"
      >
        <div bmHeaderActions>
          <bm-button variant="outline" size="md" (btnClick)="loadApplications()">
            <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading></lucide-icon>
            <span>Refresh</span>
          </bm-button>
        </div>
      </bm-page-header>

      <!-- Status Filter Tabs -->
      <div class="bm-filter-tabs">
        <button
          type="button"
          class="bm-tab-btn"
          [class.active]="selectedStatus() === 'PENDING_REVIEW'"
          (click)="filterByStatus('PENDING_REVIEW')"
        >
          <span>Pending Review</span>
          @if (pendingCount() > 0) {
            <span class="bm-count-pill bm-count-warning">{{ pendingCount() }}</span>
          }
        </button>

        <button
          type="button"
          class="bm-tab-btn"
          [class.active]="selectedStatus() === undefined"
          (click)="filterByStatus(undefined)"
        >
          <span>All Applications</span>
          @if (allCount() > 0) {
            <span class="bm-count-pill">{{ allCount() }}</span>
          }
        </button>

        <button
          type="button"
          class="bm-tab-btn"
          [class.active]="selectedStatus() === 'APPROVED'"
          (click)="filterByStatus('APPROVED')"
        >
          <span>Approved</span>
          @if (approvedCount() > 0) {
            <span class="bm-count-pill bm-count-success">{{ approvedCount() }}</span>
          }
        </button>

        <button
          type="button"
          class="bm-tab-btn"
          [class.active]="selectedStatus() === 'REJECTED'"
          (click)="filterByStatus('REJECTED')"
        >
          <span>Rejected</span>
          @if (rejectedCount() > 0) {
            <span class="bm-count-pill bm-count-danger">{{ rejectedCount() }}</span>
          }
        </button>

        <button
          type="button"
          class="bm-tab-btn"
          [class.active]="selectedStatus() === 'DRAFT'"
          (click)="filterByStatus('DRAFT')"
        >
          <span>Drafts</span>
          @if (draftCount() > 0) {
            <span class="bm-count-pill">{{ draftCount() }}</span>
          }
        </button>
      </div>

      <!-- Main Applications Table -->
      <bm-card>
        @if (isLoading()) {
          <div class="bm-loading-box">
            <lucide-icon [img]="RefreshIcon" [size]="20" class="bm-spin"></lucide-icon>
            <span>Fetching merchant store applications...</span>
          </div>
        } @else if (filteredApplications().length === 0) {
          <bm-empty-state
            [title]="emptyStateTitle()"
            description="Store opening applications submitted by merchants will appear here for territory verification."
          >
            <div bmEmptyIcon>
              <lucide-icon [img]="StoreIcon" [size]="40"></lucide-icon>
            </div>
            @if (selectedStatus() !== undefined && allCount() > 0) {
              <div bmEmptyActions style="margin-top: 12px;">
                <bm-button variant="primary" size="sm" (btnClick)="filterByStatus(undefined)">
                  <span>View All Applications ({{ allCount() }})</span>
                </bm-button>
              </div>
            }
          </bm-empty-state>
        } @else {
          <div class="bm-table-wrapper">
            <table class="bm-table" aria-label="Merchant Applications Table">
              <thead>
                <tr>
                  <th>Store Details</th>
                  <th>Owner / Contact</th>
                  <th>Location & District</th>
                  <th>Photos / Docs</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th class="bm-text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (app of filteredApplications(); track app.id) {
                  <tr class="bm-table-row">
                    <!-- Store Details -->
                    <td>
                      <div class="bm-cell-store">
                        <strong class="bm-store-name">{{ app.storeName }}</strong>
                        <span class="bm-store-type">{{ app.businessType || 'General Retail' }}</span>
                      </div>
                    </td>

                    <!-- Owner Details -->
                    <td>
                      <div class="bm-cell-owner">
                        <span class="bm-owner-name">{{ app.owner?.name || 'Store Owner' }}</span>
                        <span class="bm-owner-email">{{ app.owner?.email || app.ownerUserId }}</span>
                        @if (app.owner?.phone) {
                          <span class="bm-owner-phone">{{ app.owner?.phone }}</span>
                        }
                      </div>
                    </td>

                    <!-- Location -->
                    <td>
                      <div class="bm-cell-location">
                        <span>{{ app.city }}, {{ app.district }}</span>
                        <span class="bm-pin-sub">{{ app.postalCode }}</span>
                      </div>
                    </td>

                    <!-- Photos & Docs count -->
                    <td>
                      <div class="bm-cell-counts">
                        <span class="bm-badge-count">
                          📷 {{ app.photos ? app.photos.length : 0 }} photos
                        </span>
                        <span class="bm-badge-count">
                          📄 {{ app.documents ? app.documents.length : 0 }} docs
                        </span>
                      </div>
                    </td>

                    <!-- Status -->
                    <td>
                      <bm-badge [variant]="getStatusBadgeVariant(app.status)" size="sm">
                        {{ app.status }}
                      </bm-badge>
                    </td>

                    <!-- Date -->
                    <td class="bm-cell-date">
                      {{ formatDate(app.submittedAt || app.createdAt) }}
                    </td>

                    <!-- Action link -->
                    <td class="bm-text-right">
                      <a [routerLink]="['/admin/merchants', app.id]">
                        <bm-button variant="outline" size="sm">
                          <lucide-icon [img]="EyeIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Review</span>
                        </bm-button>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </bm-card>
    </div>
  `,
  styles: [`
    .bm-admin-merchants-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-filter-tabs {
      display: flex;
      gap: var(--bm-space-2);
      border-bottom: 1px solid var(--bm-color-border);
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .bm-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: var(--bm-space-2) var(--bm-space-4);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--bm-color-text-secondary);
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--bm-transition-fast);

      &:hover {
        color: var(--bm-color-text-primary);
      }

      &.active {
        color: var(--bm-color-primary);
        border-bottom-color: var(--bm-color-primary);
        font-weight: var(--bm-font-weight-semibold);
      }
    }

    .bm-count-pill {
      background-color: var(--bm-color-surface-subtle);
      color: var(--bm-color-text-secondary);
      font-size: 11px;
      padding: 1px 7px;
      border-radius: var(--bm-radius-full);
      font-weight: var(--bm-font-weight-bold);
    }

    .bm-count-warning {
      background-color: #FEF3C7;
      color: #92400E;
    }

    .bm-count-success {
      background-color: #E8F3ED;
      color: var(--bm-color-primary);
    }

    .bm-count-danger {
      background-color: #FEE2E2;
      color: #DC2626;
    }

    .bm-loading-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-8);
      color: var(--bm-color-text-secondary);
      font-size: var(--bm-font-size-sm);
    }

    .bm-spin {
      animation: spin 1s linear infinite;
    }

    .bm-table-wrapper {
      overflow-x: auto;
    }

    .bm-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--bm-font-size-xs);

      th {
        padding: var(--bm-space-3) var(--bm-space-4);
        background-color: var(--bm-color-surface-subtle);
        color: var(--bm-color-text-secondary);
        font-weight: var(--bm-font-weight-medium);
        border-bottom: 1px solid var(--bm-color-border);
        white-space: nowrap;
      }

      td {
        padding: var(--bm-space-3) var(--bm-space-4);
        border-bottom: 1px solid var(--bm-color-border);
        vertical-align: middle;
      }

      tr:last-child td {
        border-bottom: none;
      }
    }

    .bm-table-row:hover td {
      background-color: var(--bm-color-bg);
    }

    .bm-text-right {
      text-align: right;
    }

    .bm-cell-store {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-store-name {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
    }

    .bm-store-type {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
    }

    .bm-cell-owner {
      display: flex;
      flex-direction: column;
      gap: 1px;
      font-size: 11px;
    }

    .bm-owner-name {
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-owner-email {
      color: var(--bm-color-text-secondary);
    }

    .bm-owner-phone {
      color: var(--bm-color-text-muted);
    }

    .bm-cell-location {
      display: flex;
      flex-direction: column;
      font-size: 11px;
    }

    .bm-pin-sub {
      color: var(--bm-color-text-muted);
      font-family: var(--bm-font-mono);
    }

    .bm-cell-counts {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 11px;
      color: var(--bm-color-text-secondary);
    }

    .bm-cell-date {
      color: var(--bm-color-text-secondary);
      white-space: nowrap;
    }
  `],
})
export class AdminMerchantsListComponent implements OnInit {
  private readonly adminService = inject(AdminMerchantService);
  private readonly toast = inject(ToastService);

  readonly RefreshIcon = RefreshCw;
  readonly EyeIcon = Eye;
  readonly StoreIcon = Store;

  readonly applications = signal<MerchantRecord[]>([]);
  readonly selectedStatus = signal<MerchantStatus | undefined>('PENDING_REVIEW');
  readonly isLoading = signal<boolean>(false);

  readonly allCount = signal<number>(0);
  readonly pendingCount = signal<number>(0);
  readonly approvedCount = signal<number>(0);
  readonly rejectedCount = signal<number>(0);
  readonly draftCount = signal<number>(0);

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading.set(true);
    this.adminService.listApplications(this.selectedStatus()).subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.danger('Failed to load merchant store applications.');
      },
    });

    // Also fetch all applications to calculate counts across all statuses
    this.adminService.listApplications().subscribe({
      next: (all) => {
        this.allCount.set(all.length);
        this.pendingCount.set(all.filter((a) => a.status === 'PENDING_REVIEW').length);
        this.approvedCount.set(all.filter((a) => a.status === 'APPROVED').length);
        this.rejectedCount.set(all.filter((a) => a.status === 'REJECTED').length);
        this.draftCount.set(all.filter((a) => a.status === 'DRAFT').length);
      },
    });
  }

  filterByStatus(status: MerchantStatus | undefined): void {
    this.selectedStatus.set(status);
    this.loadApplications();
  }

  filteredApplications(): MerchantRecord[] {
    return this.applications();
  }

  emptyStateTitle(): string {
    const s = this.selectedStatus();
    if (s === 'PENDING_REVIEW') return 'No Applications Pending Review';
    if (s === 'APPROVED') return 'No Approved Stores Found';
    if (s === 'REJECTED') return 'No Rejected Applications Found';
    return 'No Merchant Applications Found';
  }

  getStatusBadgeVariant(status: MerchantStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING_REVIEW': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }
}
