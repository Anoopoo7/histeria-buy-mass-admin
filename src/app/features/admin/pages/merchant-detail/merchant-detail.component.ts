import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
  X,
} from 'lucide-angular';
import { MerchantRecord, MerchantStatus } from '../../../../core/models/merchant.model';
import { ApiError } from '../../../../core/services/api-client.service';
import { AdminMerchantService } from '../../../../core/services/admin-merchant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'bm-admin-merchant-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  template: `
    <div class="bm-admin-detail-page">
      <bm-page-header
        [title]="application()?.storeName || 'Merchant Application Review'"
        [subtitle]="'Application ID: ' + (application()?.id || '')"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Admin Applications', url: '/admin/merchants' },
          { label: 'Review Details' }
        ]"
      >
        <div bmHeaderActions class="bm-action-bar">
          <a routerLink="/admin/merchants">
            <bm-button variant="outline" size="md">
              <lucide-icon [img]="ArrowLeftIcon" [size]="16" bmLeading></lucide-icon>
              <span>Back to List</span>
            </bm-button>
          </a>

          @if (application()?.status === 'PENDING_REVIEW' || application()?.status === 'DRAFT') {
            <bm-button
              variant="danger"
              size="md"
              (btnClick)="openRejectDialog()"
              [disabled]="isProcessing()"
            >
              <lucide-icon [img]="AlertCircleIcon" [size]="16" bmLeading></lucide-icon>
              <span>Reject Application</span>
            </bm-button>

            <bm-button
              variant="primary"
              size="md"
              [loading]="isProcessing()"
              (btnClick)="onApprove()"
            >
              <lucide-icon [img]="CheckCircleIcon" [size]="16" bmLeading></lucide-icon>
              <span>Approve Storefront</span>
            </bm-button>
          }
        </div>
      </bm-page-header>

      @if (isLoading()) {
        <div class="bm-loading-box">
          <lucide-icon [img]="RefreshIcon" [size]="24" class="bm-spin"></lucide-icon>
          <span>Loading application details...</span>
        </div>
      } @else {
        @if (application(); as app) {
        <!-- Status Bar -->
        <div class="bm-status-banner" [class]="'banner-' + app.status.toLowerCase()">
          <div class="bm-status-icon">
            @switch (app.status) {
              @case ('APPROVED') {
                <lucide-icon [img]="CheckCircleIcon" [size]="20"></lucide-icon>
              }
              @case ('PENDING_REVIEW') {
                <lucide-icon [img]="ClockIcon" [size]="20"></lucide-icon>
              }
              @case ('REJECTED') {
                <lucide-icon [img]="AlertCircleIcon" [size]="20"></lucide-icon>
              }
              @default {
                <lucide-icon [img]="StoreIcon" [size]="20"></lucide-icon>
              }
            }
          </div>
          <div class="bm-status-info">
            <div class="bm-status-headline">
              <strong>Current Status: {{ app.status }}</strong>
              <bm-badge [variant]="getStatusBadgeVariant(app.status)" size="sm">
                {{ app.status }}
              </bm-badge>
            </div>
            @if (app.status === 'APPROVED' && app.storeCode) {
              <p class="bm-status-sub">Assigned Merchant Store Code: <strong>{{ app.storeCode }}</strong></p>
            } @else if (app.status === 'REJECTED' && app.rejectionReason) {
              <p class="bm-status-sub bm-text-danger">
                Rejection Note: <em>{{ app.rejectionReason }}</em>
              </p>
            } @else if (app.status === 'PENDING_REVIEW') {
              <p class="bm-status-sub">Awaiting territory administrative review and decision.</p>
            }
          </div>
        </div>

        <!-- 2-Column Application Layout -->
        <div class="bm-detail-grid">
          <!-- Left Column: Store Details & Owner Contact -->
          <div class="bm-col-left">
            <!-- Store Profile Details -->
            <bm-card title="Physical Storefront Information">
              <div class="bm-info-rows">
                <div class="bm-info-row">
                  <span class="bm-label">Store Name:</span>
                  <span class="bm-value"><strong>{{ app.storeName }}</strong></span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">Business Category:</span>
                  <span class="bm-value">{{ app.businessType || 'General Retail' }}</span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">Description:</span>
                  <span class="bm-value">{{ app.description }}</span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">Street Address:</span>
                  <span class="bm-value">
                    {{ app.addressLine1 }}
                    @if (app.addressLine2) {
                      , {{ app.addressLine2 }}
                    }
                  </span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">City, District, State:</span>
                  <span class="bm-value">{{ app.city }}, {{ app.district }}, {{ app.state }}</span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">Postal PIN Code:</span>
                  <span class="bm-value bm-mono">{{ app.postalCode }}</span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">GPS Coordinates:</span>
                  <span class="bm-value bm-mono">
                    Lat: {{ app.location.latitude }}, Lng: {{ app.location.longitude }}
                  </span>
                </div>
              </div>
            </bm-card>

            <!-- Store Photographs -->
            <bm-card [title]="'Store Photographs (' + (app.photos.length) + ')'">
              @if (app.photos && app.photos.length > 0) {
                <div class="bm-photos-grid">
                  @for (photo of app.photos; track photo.id) {
                    <div class="bm-photo-item">
                      <img [src]="photo.url" [alt]="photo.category" class="bm-img-thumb" />
                      <div class="bm-img-meta">
                        <bm-badge variant="neutral" size="sm">{{ photo.category }}</bm-badge>
                        <a [href]="photo.url" target="_blank" rel="noopener noreferrer" class="bm-zoom-link">
                          <lucide-icon [img]="ExternalLinkIcon" [size]="12"></lucide-icon>
                        </a>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="bm-empty-text">No photographs attached to this application.</p>
              }
            </bm-card>
          </div>

          <!-- Right Column: Owner Profile & KYC Documents -->
          <div class="bm-col-right">
            <!-- Operator Identity -->
            <bm-card title="Store Operator / KYC Verification">
              <div class="bm-info-rows">
                <div class="bm-info-row">
                  <span class="bm-label">Operator Name:</span>
                  <span class="bm-value"><strong>{{ app.owner?.name || 'N/A' }}</strong></span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">Email:</span>
                  <span class="bm-value">
                    {{ app.owner?.email || 'N/A' }}
                    @if (app.owner?.isEmailVerified) {
                      <bm-badge variant="success" size="sm">Verified</bm-badge>
                    } @else {
                      <bm-badge variant="warning" size="sm">Unverified</bm-badge>
                    }
                  </span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">WhatsApp Phone:</span>
                  <span class="bm-value">
                    {{ app.owner?.phone || 'N/A' }}
                    @if (app.owner?.isPhoneVerified) {
                      <bm-badge variant="success" size="sm">Verified</bm-badge>
                    } @else {
                      <bm-badge variant="warning" size="sm">Unverified</bm-badge>
                    }
                  </span>
                </div>
                <div class="bm-info-row">
                  <span class="bm-label">User Account ID:</span>
                  <span class="bm-value bm-mono">{{ app.ownerUserId }}</span>
                </div>
              </div>
            </bm-card>

            <!-- Business Licensing Documents -->
            <bm-card [title]="'Attached Business Documents (' + (app.documents.length) + ')'">
              @if (app.documents && app.documents.length > 0) {
                <div class="bm-docs-list">
                  @for (doc of app.documents; track doc.id) {
                    <div class="bm-doc-card">
                      <div class="bm-doc-icon">
                        <lucide-icon [img]="FileCheckIcon" [size]="18"></lucide-icon>
                      </div>
                      <div class="bm-doc-details">
                        <span class="bm-doc-title">{{ doc.type.replace('_', ' ') }}</span>
                        <a [href]="doc.url" target="_blank" rel="noopener noreferrer" class="bm-doc-link">
                          <span>Inspect Document File</span>
                          <lucide-icon [img]="ExternalLinkIcon" [size]="12"></lucide-icon>
                        </a>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="bm-empty-text">No business KYC documents attached.</p>
              }
            </bm-card>
          </div>
        </div>
        }
      }

      <!-- Rejection Modal Dialog -->
      @if (showRejectModal()) {
        <div class="bm-modal-backdrop" (click)="closeRejectDialog()">
          <div class="bm-modal-box" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <h3>Reject Store Application</h3>
              <button type="button" class="bm-close-btn" (click)="closeRejectDialog()">
                <lucide-icon [img]="CloseIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <p class="bm-modal-instruction">
              Provide a clear reason for rejecting this storefront application.
              The merchant will see this feedback in their portal to correct their submission.
            </p>

            <form [formGroup]="rejectForm" (ngSubmit)="onConfirmReject()">
              <div class="bm-textarea-field">
                <label for="rejection-reason" class="bm-field-label">Mandatory Rejection Feedback *</label>
                <textarea
                  id="rejection-reason"
                  formControlName="reason"
                  rows="4"
                  placeholder="e.g. Photographs do not show a physical commercial signboard. Trade license document expired."
                  class="bm-textarea"
                ></textarea>
                @if (rejectForm.get('reason')?.touched && rejectForm.get('reason')?.invalid) {
                  <span class="bm-field-error">A non-empty rejection reason is required.</span>
                }
              </div>

              <div class="bm-modal-footer">
                <bm-button
                  type="button"
                  variant="outline"
                  size="md"
                  (btnClick)="closeRejectDialog()"
                >
                  Cancel
                </bm-button>

                <bm-button
                  type="submit"
                  variant="danger"
                  size="md"
                  [loading]="isProcessing()"
                  [disabled]="rejectForm.invalid || isProcessing()"
                >
                  Confirm Rejection
                </bm-button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bm-admin-detail-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
    }

    .bm-action-bar {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-loading-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-12);
      color: var(--bm-color-text-secondary);
      font-size: var(--bm-font-size-sm);
    }

    .bm-spin {
      animation: spin 1s linear infinite;
    }

    .bm-status-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-4);
      padding: var(--bm-space-4) var(--bm-space-5);
      border-radius: var(--bm-radius-lg);
      border: 1px solid var(--bm-color-border);
      background-color: var(--bm-color-surface);

      &.banner-approved {
        border-left: 4px solid var(--bm-color-success);
        .bm-status-icon { color: var(--bm-color-success); }
      }

      &.banner-pending_review {
        border-left: 4px solid var(--bm-color-warning);
        .bm-status-icon { color: var(--bm-color-warning); }
      }

      &.banner-rejected {
        border-left: 4px solid var(--bm-color-danger);
        .bm-status-icon { color: var(--bm-color-danger); }
      }
    }

    .bm-status-info {
      flex: 1;
    }

    .bm-status-headline {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      font-size: var(--bm-font-size-sm);
    }

    .bm-status-sub {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 4px 0 0 0;
    }

    .bm-text-danger {
      color: var(--bm-color-danger);
    }

    .bm-detail-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-6);

      @media (min-width: 1024px) {
        grid-template-columns: 3fr 2fr;
      }
    }

    .bm-col-left, .bm-col-right {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-info-rows {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
    }

    .bm-info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--bm-space-2) 0;
      border-bottom: 1px solid var(--bm-color-border);
      font-size: var(--bm-font-size-xs);

      &:last-child {
        border-bottom: none;
      }
    }

    .bm-label {
      color: var(--bm-color-text-secondary);
      flex-shrink: 0;
      width: 140px;
    }

    .bm-value {
      color: var(--bm-color-text-primary);
      text-align: right;
      display: inline-flex;
      align-items: center;
      gap: var(--bm-space-2);
    }

    .bm-mono {
      font-family: var(--bm-font-mono);
      background-color: var(--bm-color-surface-subtle);
      padding: 1px 6px;
      border-radius: var(--bm-radius-sm);
    }

    .bm-photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--bm-space-3);
    }

    .bm-photo-item {
      position: relative;
      height: 120px;
      border-radius: var(--bm-radius-md);
      overflow: hidden;
      border: 1px solid var(--bm-color-border);
    }

    .bm-img-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-img-meta {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 4px 6px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-zoom-link {
      color: #FFFFFF;
      padding: 2px;
    }

    .bm-docs-list {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
    }

    .bm-doc-card {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-surface-subtle);
    }

    .bm-doc-icon {
      color: var(--bm-color-primary);
    }

    .bm-doc-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-doc-title {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-doc-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--bm-color-primary);
    }

    .bm-empty-text {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 0;
    }

    // Modal
    .bm-modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: var(--bm-space-4);
    }

    .bm-modal-box {
      width: 100%;
      max-width: 520px;
      background-color: var(--bm-color-surface);
      border-radius: var(--bm-radius-lg);
      border: 1px solid var(--bm-color-border);
      box-shadow: var(--bm-shadow-lg);
      padding: var(--bm-space-6);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
    }

    .bm-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        font-size: var(--bm-font-size-md);
        font-weight: var(--bm-font-weight-semibold);
        color: var(--bm-color-text-primary);
        margin: 0;
      }
    }

    .bm-close-btn {
      background: transparent;
      border: none;
      color: var(--bm-color-text-secondary);
      cursor: pointer;
    }

    .bm-modal-instruction {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .bm-textarea-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-field-label {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-textarea {
      width: 100%;
      padding: var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-family: inherit;
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      outline: none;
      resize: vertical;

      &:focus {
        border-color: var(--bm-color-danger);
      }
    }

    .bm-field-error {
      font-size: 11px;
      color: var(--bm-color-danger);
    }

    .bm-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--bm-space-3);
      margin-top: var(--bm-space-4);
      padding-top: var(--bm-space-4);
      border-top: 1px solid var(--bm-color-border);
    }
  `],
})
export class AdminMerchantDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminMerchantService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly ArrowLeftIcon = ArrowLeft;
  readonly CheckCircleIcon = CheckCircle2;
  readonly AlertCircleIcon = AlertCircle;
  readonly ClockIcon = Clock;
  readonly StoreIcon = Store;
  readonly RefreshIcon = RefreshCw;
  readonly ExternalLinkIcon = ExternalLink;
  readonly FileCheckIcon = FileCheck2;
  readonly CloseIcon = X;

  readonly application = signal<MerchantRecord | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isProcessing = signal<boolean>(false);
  readonly showRejectModal = signal<boolean>(false);

  readonly rejectForm: FormGroup = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.danger('Invalid application ID.');
      this.router.navigate(['/admin/merchants']);
      return;
    }
    this.loadDetail(id);
  }

  loadDetail(id: string): void {
    this.isLoading.set(true);
    this.adminService.getApplication(id).subscribe({
      next: (app) => {
        this.application.set(app);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.danger('Failed to load application.');
        this.router.navigate(['/admin/merchants']);
      },
    });
  }

  onApprove(): void {
    const app = this.application();
    if (!app || this.isProcessing()) return;

    this.isProcessing.set(true);
    this.adminService.approveApplication(app.id).subscribe({
      next: (updated) => {
        this.isProcessing.set(false);
        this.application.set(updated);
        this.toast.success(`Storefront '${updated.storeName}' has been approved!`);
      },
      error: (err: ApiError) => {
        this.isProcessing.set(false);
        this.toast.danger(err.message || 'Approval failed.');
      },
    });
  }

  openRejectDialog(): void {
    this.rejectForm.reset({ reason: '' });
    this.showRejectModal.set(true);
  }

  closeRejectDialog(): void {
    this.showRejectModal.set(false);
  }

  onConfirmReject(): void {
    const app = this.application();
    if (!app || this.rejectForm.invalid || this.isProcessing()) return;

    const reason = this.rejectForm.value.reason.trim();
    this.isProcessing.set(true);

    this.adminService.rejectApplication(app.id, reason).subscribe({
      next: (updated) => {
        this.isProcessing.set(false);
        this.showRejectModal.set(false);
        this.application.set(updated);
        this.toast.warning('Store application has been marked as rejected.');
      },
      error: (err: ApiError) => {
        this.isProcessing.set(false);
        this.toast.danger(err.message || 'Rejection failed.');
      },
    });
  }

  getStatusBadgeVariant(status: MerchantStatus): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING_REVIEW': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  }
}
