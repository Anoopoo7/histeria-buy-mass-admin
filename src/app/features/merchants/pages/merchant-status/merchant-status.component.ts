import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  LucideAngularModule,
  ShieldAlert,
  Store,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-merchant-status',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
  ],
  template: `
    <div class="bm-merchant-status-page">
      <bm-page-header
        title="Store Onboarding & Verification"
        subtitle="Manage your merchant store application and administrative review status"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Store Status' }
        ]"
      ></bm-page-header>

      <div class="bm-status-grid">
        <!-- Main Status Card -->
        <bm-card [title]="merchant()?.storeName || 'Merchant Store Application'">
          <div class="bm-status-banner" [class]="'banner-' + statusLower()">
            <div class="bm-status-icon">
              @switch (merchant()?.status) {
                @case ('APPROVED') {
                  <lucide-icon [img]="CheckCircleIcon" [size]="24"></lucide-icon>
                }
                @case ('PENDING_REVIEW') {
                  <lucide-icon [img]="ClockIcon" [size]="24"></lucide-icon>
                }
                @case ('REJECTED') {
                  <lucide-icon [img]="AlertCircleIcon" [size]="24"></lucide-icon>
                }
                @case ('SUSPENDED') {
                  <lucide-icon [img]="ShieldAlertIcon" [size]="24"></lucide-icon>
                }
                @default {
                  <lucide-icon [img]="StoreIcon" [size]="24"></lucide-icon>
                }
              }
            </div>

            <div class="bm-status-content">
              <div class="bm-status-title-row">
                <h3 class="bm-status-heading">Status: {{ statusLabel() }}</h3>
                <bm-badge [variant]="statusBadgeVariant()" size="md">
                  {{ merchant()?.status || 'NOT APPLIED' }}
                </bm-badge>
              </div>
              <p class="bm-status-message">{{ statusDescription() }}</p>
            </div>
          </div>

          <!-- Application Details if available -->
          @if (merchant()) {
            <div class="bm-application-summary">
              <div class="bm-summary-item">
                <span class="bm-summary-label">Store Code:</span>
                <span class="bm-summary-val bm-code">{{ merchant()?.storeCode || 'Pending Assignment' }}</span>
              </div>
              <div class="bm-summary-item">
                <span class="bm-summary-label">Business Type:</span>
                <span class="bm-summary-val">{{ merchant()?.businessType || 'Vehicle Dealership' }}</span>
              </div>
              <div class="bm-summary-item">
                <span class="bm-summary-label">District & State:</span>
                <span class="bm-summary-val">{{ merchant()?.district }}, {{ merchant()?.state }}</span>
              </div>
              @if (merchant()?.rejectionReason) {
                <div class="bm-rejection-box">
                  <strong>Admin Feedback:</strong>
                  <p>{{ merchant()?.rejectionReason }}</p>
                </div>
              }
            </div>
          }
        </bm-card>

        <!-- Onboarding Timeline Steps -->
        <bm-card title="Merchant Onboarding Pipeline">
          <div class="bm-pipeline-steps">
            <div class="bm-step is-complete">
              <div class="bm-step-indicator">1</div>
              <div class="bm-step-info">
                <h4>User Account Created</h4>
                <p>Operator identity registered on BuyMass</p>
              </div>
            </div>

            <div class="bm-step" [class.is-complete]="authService.currentUser()?.isPhoneVerified">
              <div class="bm-step-indicator">2</div>
              <div class="bm-step-info">
                <h4>WhatsApp Phone Verified</h4>
                <p>OTP verification for store security</p>
              </div>
            </div>

            <div class="bm-step" [class.is-complete]="hasApplication()">
              <div class="bm-step-indicator">3</div>
              <div class="bm-step-info">
                <h4>Store Profile Submission</h4>
                <p>Business address, GST, and trade licensing</p>
              </div>
            </div>

            <div class="bm-step" [class.is-complete]="isApproved()">
              <div class="bm-step-indicator">4</div>
              <div class="bm-step-info">
                <h4>BuyMass Admin Review</h4>
                <p>Verification by local Kerala territory coordinators</p>
              </div>
            </div>
          </div>
        </bm-card>
      </div>
    </div>
  `,
  styles: [`
    .bm-merchant-status-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-status-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-6);

      @media (min-width: 1024px) {
        grid-template-columns: 2fr 1fr;
      }
    }

    .bm-status-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-4);
      padding: var(--bm-space-4);
      border-radius: var(--bm-radius-md);
      margin-bottom: var(--bm-space-5);

      &.banner-approved {
        background-color: var(--bm-color-success-bg);
        border: 1px solid var(--bm-color-success-border);
        .bm-status-icon { color: var(--bm-color-success); }
      }

      &.banner-pending_review {
        background-color: var(--bm-color-warning-bg);
        border: 1px solid var(--bm-color-warning-border);
        .bm-status-icon { color: var(--bm-color-warning); }
      }

      &.banner-rejected, &.banner-suspended {
        background-color: var(--bm-color-danger-bg);
        border: 1px solid var(--bm-color-danger-border);
        .bm-status-icon { color: var(--bm-color-danger); }
      }

      &.banner-draft, &.banner-unregistered {
        background-color: var(--bm-color-surface-subtle);
        border: 1px solid var(--bm-color-border);
        .bm-status-icon { color: var(--bm-color-text-secondary); }
      }
    }

    .bm-status-content {
      flex: 1;
    }

    .bm-status-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--bm-space-2);
      margin-bottom: 4px;
    }

    .bm-status-heading {
      font-size: var(--bm-font-size-md);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-status-message {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .bm-application-summary {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      padding-top: var(--bm-space-4);
      border-top: 1px solid var(--bm-color-border);
    }

    .bm-summary-item {
      display: flex;
      justify-content: space-between;
      font-size: var(--bm-font-size-sm);
    }

    .bm-summary-label {
      color: var(--bm-color-text-secondary);
    }

    .bm-summary-val {
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-code {
      font-family: var(--bm-font-mono);
      font-size: var(--bm-font-size-xs);
      background-color: var(--bm-color-surface-subtle);
      padding: 1px 6px;
      border-radius: var(--bm-radius-sm);
      border: 1px solid var(--bm-color-border);
    }

    .bm-rejection-box {
      margin-top: var(--bm-space-2);
      padding: var(--bm-space-3);
      background-color: var(--bm-color-danger-bg);
      border: 1px solid var(--bm-color-danger-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-danger);

      p {
        margin: 2px 0 0 0;
      }
    }

    .bm-pipeline-steps {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
    }

    .bm-step {
      display: flex;
      gap: var(--bm-space-3);
      align-items: flex-start;

      &.is-complete {
        .bm-step-indicator {
          background-color: var(--bm-color-primary);
          color: #FFFFFF;
          border-color: var(--bm-color-primary);
        }

        h4 {
          color: var(--bm-color-text-primary);
        }
      }
    }

    .bm-step-indicator {
      width: 28px;
      height: 28px;
      border-radius: var(--bm-radius-full);
      background-color: var(--bm-color-surface-subtle);
      border: 1px solid var(--bm-color-border);
      color: var(--bm-color-text-muted);
      font-weight: var(--bm-font-weight-bold);
      font-size: var(--bm-font-size-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bm-step-info {
      h4 {
        font-size: var(--bm-font-size-sm);
        font-weight: var(--bm-font-weight-medium);
        color: var(--bm-color-text-secondary);
        margin: 0;
      }

      p {
        font-size: var(--bm-font-size-xs);
        color: var(--bm-color-text-muted);
        margin: 2px 0 0 0;
      }
    }
  `],
})
export class MerchantStatusComponent {
  readonly authService = inject(AuthService);

  readonly StoreIcon = Store;
  readonly CheckCircleIcon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly AlertCircleIcon = AlertCircle;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly BuildingIcon = Building2;
  readonly FileCheckIcon = FileCheck2;

  readonly merchant = this.authService.currentMerchant;

  readonly statusLower = computed(() => {
    return (this.merchant()?.status || 'unregistered').toLowerCase();
  });

  readonly isApproved = computed(() => this.merchant()?.status === 'APPROVED');
  readonly hasApplication = computed(() => !!this.merchant());

  readonly statusLabel = computed(() => {
    const s = this.merchant()?.status;
    if (s === 'APPROVED') return 'Approved & Active';
    if (s === 'PENDING_REVIEW') return 'Submitted — Awaiting Admin Review';
    if (s === 'DRAFT') return 'Application In Draft';
    if (s === 'REJECTED') return 'Application Requires Changes';
    if (s === 'SUSPENDED') return 'Storefront Suspended';
    return 'No Store Application Found';
  });

  readonly statusDescription = computed(() => {
    const s = this.merchant()?.status;
    if (s === 'APPROVED') {
      return 'Your merchant store is approved. You have full access to manage products, campaigns, orders, and customer pickup verification.';
    }
    if (s === 'PENDING_REVIEW') {
      return 'Your store onboarding documents and location details are currently being reviewed by our administrative team. We will notify you via WhatsApp once approved.';
    }
    if (s === 'DRAFT') {
      return 'Your store application draft has been saved. Submit when all required business documents and photographs are attached.';
    }
    if (s === 'REJECTED') {
      return 'Your application was rejected by administrative review. Please check the feedback below and contact your regional coordinator.';
    }
    return 'To sell on BuyMass, your business account must submit store onboarding credentials for territory approval.';
  });

  readonly statusBadgeVariant = computed(() => {
    const s = this.merchant()?.status;
    if (s === 'APPROVED') return 'success';
    if (s === 'PENDING_REVIEW') return 'warning';
    if (s === 'REJECTED') return 'danger';
    return 'neutral';
  });
}
