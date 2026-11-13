import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  LucideAngularModule,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import {
  BusinessDocumentType,
  CreateMerchantRequest,
  MerchantRecord,
  PhotoCategory,
  UpdateMerchantRequest,
} from '../../../../core/models/merchant.model';
import { ApiError } from '../../../../core/services/api-client.service';
import { MerchantService } from '../../../../core/services/merchant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';

export const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

export const BUSINESS_TYPES = [
  'Grocery & Supermarket',
  'Fresh Produce & Vegetables',
  'Spices & Plantation Goods',
  'Organic & Health Food',
  'Bakery & Confectionery',
  'Meat & Fish Store',
  'Stationery & General Store',
  'Other Retail',
];

@Component({
  selector: 'bm-my-store',
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
    InputComponent,
    SelectComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="bm-store-page">
      <bm-page-header
        title="My Merchant Store"
        subtitle="Manage your store details, photos, business licenses and verification"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'My Store' }
        ]"
      >
        <div bmHeaderActions>
          @if (merchant(); as store) {
            @if (store.status === 'DRAFT' || store.status === 'REJECTED') {
              <bm-button
                variant="primary"
                size="md"
                [loading]="isSubmittingReview()"
                (btnClick)="handleSubmitForReview()"
              >
                <lucide-icon [img]="SendIcon" [size]="16" bmLeading></lucide-icon>
                <span>Submit for Admin Review</span>
              </bm-button>
            }
          }
        </div>
      </bm-page-header>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="bm-loading-box">
          <lucide-icon [img]="RefreshIcon" [size]="24" class="bm-spin"></lucide-icon>
          <span>Loading store profile...</span>
        </div>
      } @else if (!merchant()) {
        <!-- NO STORE CREATED YET: Guided Store Creation Form -->
        <div class="bm-create-store-container">
          <div class="bm-create-hero">
            <div class="bm-hero-icon">
              <lucide-icon [img]="StoreIcon" [size]="28"></lucide-icon>
            </div>
            <div>
              <h2 class="bm-create-title">Open Your BuyMass Merchant Store</h2>
              <p class="bm-create-desc">
                Register your local physical storefront to host community group-buying campaigns,
                manage bulk orders, and provide store pickup to customers across Kerala.
              </p>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="bm-alert-banner bm-alert-danger" role="alert">
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <bm-card title="Store Identification & Location">
            <form [formGroup]="createStoreForm" (ngSubmit)="onCreateStore()" class="bm-store-form">
              <div class="bm-form-grid">
                <!-- Store Name -->
                <bm-input
                  id="store-name"
                  label="Store / Business Name"
                  placeholder="e.g. Green Valley Fresh Mart"
                  [required]="true"
                  formControlName="storeName"
                  [error]="getCreateError('storeName')"
                ></bm-input>

                <!-- Business Type -->
                <bm-select
                  id="store-btype"
                  label="Business Category"
                  [required]="true"
                  [options]="businessTypes"
                  placeholder="Select business category"
                  formControlName="businessType"
                  [error]="getCreateError('businessType')"
                ></bm-select>

                <!-- Description -->
                <div class="bm-full-col">
                  <bm-input
                    id="store-desc"
                    label="Store Description & Specialties"
                    placeholder="Briefly describe your store, primary goods sold, and pickup facility"
                    [required]="true"
                    formControlName="description"
                    [error]="getCreateError('description')"
                  ></bm-input>
                </div>

                <!-- Address Line 1 -->
                <bm-input
                  id="store-addr1"
                  label="Shop / Building & Street Address"
                  placeholder="e.g. Building 4/12, MG Road"
                  [required]="true"
                  formControlName="addressLine1"
                  [error]="getCreateError('addressLine1')"
                ></bm-input>

                <!-- Address Line 2 -->
                <bm-input
                  id="store-addr2"
                  label="Landmark / Locality (Optional)"
                  placeholder="e.g. Near Metro Pillar 42"
                  formControlName="addressLine2"
                ></bm-input>

                <!-- City -->
                <bm-input
                  id="store-city"
                  label="City / Town"
                  placeholder="e.g. Kochi"
                  [required]="true"
                  formControlName="city"
                  [error]="getCreateError('city')"
                ></bm-input>

                <!-- District -->
                <bm-select
                  id="store-district"
                  label="Kerala District"
                  [required]="true"
                  [options]="keralaDistricts"
                  placeholder="Select Kerala district"
                  formControlName="district"
                  [error]="getCreateError('district')"
                ></bm-select>

                <!-- Postal PIN Code -->
                <bm-input
                  id="store-pincode"
                  label="6-Digit Postal PIN Code"
                  placeholder="e.g. 682001"
                  [required]="true"
                  formControlName="postalCode"
                  hint="Must be a valid 6-digit Indian PIN code"
                  [error]="getCreateError('postalCode')"
                ></bm-input>

                <!-- State -->
                <bm-input
                  id="store-state"
                  label="State"
                  [required]="true"
                  formControlName="state"
                ></bm-input>

                <!-- Coordinates -->
                <bm-input
                  id="store-lat"
                  label="Store Latitude"
                  type="number"
                  placeholder="e.g. 9.9312"
                  [required]="true"
                  formControlName="latitude"
                  [error]="getCreateError('latitude')"
                ></bm-input>

                <bm-input
                  id="store-lng"
                  label="Store Longitude"
                  type="number"
                  placeholder="e.g. 76.2673"
                  [required]="true"
                  formControlName="longitude"
                  [error]="getCreateError('longitude')"
                ></bm-input>
              </div>

              <!-- Quick Coordinate Preset Helper -->
              <div class="bm-coord-helper">
                <span>Auto-fill typical Kerala coordinates:</span>
                <button type="button" class="bm-pill-btn" (click)="setPresetCoords(9.9312, 76.2673, 'Kochi')">
                  Kochi (9.9312, 76.2673)
                </button>
                <button type="button" class="bm-pill-btn" (click)="setPresetCoords(11.2588, 75.7804, 'Kozhikode')">
                  Kozhikode (11.2588, 75.7804)
                </button>
                <button type="button" class="bm-pill-btn" (click)="setPresetCoords(8.5241, 76.9366, 'Trivandrum')">
                  Trivandrum (8.5241, 76.9366)
                </button>
              </div>

              <div class="bm-form-actions">
                <bm-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [loading]="isCreatingStore()"
                  [disabled]="createStoreForm.invalid || isCreatingStore()"
                >
                  <lucide-icon [img]="StoreIcon" [size]="18" bmLeading></lucide-icon>
                  <span>Create Store Application</span>
                </bm-button>
              </div>
            </form>
          </bm-card>
        </div>
      } @else {
        <!-- STORE PROFILE ACTIVE / IN ONBOARDING -->
        <div class="bm-store-active-layout">
          <!-- Top Status Strip -->
          <div class="bm-store-status-banner" [class]="'status-' + (merchant()?.status || 'draft').toLowerCase()">
            <div class="bm-status-main">
              <div class="bm-status-icon-wrap">
                @switch (merchant()?.status) {
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
              <div>
                <div class="bm-status-title-row">
                  <h3 class="bm-store-display-name">{{ merchant()?.storeName }}</h3>
                  <bm-badge [variant]="statusBadgeVariant(merchant()?.status)" size="md">
                    {{ merchant()?.status }}
                  </bm-badge>
                </div>
                <p class="bm-status-subtitle">
                  @if (merchant()?.status === 'APPROVED') {
                    Store is approved & live. Store Code: <strong>{{ merchant()?.storeCode }}</strong>
                  } @else if (merchant()?.status === 'PENDING_REVIEW') {
                    Application is currently under BuyMass territory admin review. You will be notified via WhatsApp.
                  } @else if (merchant()?.status === 'REJECTED') {
                    Application was rejected. Please review feedback and update details before re-submitting.
                  } @else {
                    Store application draft saved. Upload 3+ store photos and submit for review.
                  }
                </p>
              </div>
            </div>

            @if (merchant()?.rejectionReason) {
              <div class="bm-rejection-alert">
                <strong>Rejection Reason:</strong> {{ merchant()?.rejectionReason }}
              </div>
            }
          </div>

          <!-- Section 1: Store Overview & Editable Details -->
          <bm-card title="Store Details & Physical Location">
            <div class="bm-store-info-grid">
              <div class="bm-info-item">
                <span class="bm-info-label">Store Code</span>
                <span class="bm-info-val bm-code">{{ merchant()?.storeCode || 'Assigned on Approval' }}</span>
              </div>
              <div class="bm-info-item">
                <span class="bm-info-label">Business Category</span>
                <span class="bm-info-val">{{ merchant()?.businessType }}</span>
              </div>
              <div class="bm-info-item">
                <span class="bm-info-label">District & State</span>
                <span class="bm-info-val">{{ merchant()?.district }}, {{ merchant()?.state }}</span>
              </div>
              <div class="bm-info-item">
                <span class="bm-info-label">Postal PIN</span>
                <span class="bm-info-val">{{ merchant()?.postalCode }}</span>
              </div>
              <div class="bm-info-item bm-col-2">
                <span class="bm-info-label">Full Street Address</span>
                <span class="bm-info-val">
                  {{ merchant()?.addressLine1 }}
                  @if (merchant()?.addressLine2) {
                    , {{ merchant()?.addressLine2 }}
                  }
                  , {{ merchant()?.city }}
                </span>
              </div>
              <div class="bm-info-item bm-col-2">
                <span class="bm-info-label">Store GPS Coordinates</span>
                <span class="bm-info-val bm-code">
                  Lat: {{ merchant()?.location?.latitude }} | Lng: {{ merchant()?.location?.longitude }}
                </span>
              </div>
            </div>
          </bm-card>

          <!-- Section 2: Store Photographs (3+ required for submission) -->
          <bm-card
            title="Store Photographs"
            [subtitle]="'Uploaded: ' + (merchant()?.photos?.length || 0) + ' / 10 (Minimum 3 required for review submission)'"
          >
            <!-- Photo Upload Row (if editable) -->
            @if (merchant()?.status === 'DRAFT' || merchant()?.status === 'REJECTED') {
              <form [formGroup]="photoForm" (ngSubmit)="onAddPhoto()" class="bm-inline-upload-form">
                <div class="bm-upload-input-wrap">
                  <div class="bm-upload-url-input">
                    <input
                      type="url"
                      formControlName="url"
                      placeholder="Enter image URL (e.g. https://images.unsplash.com/...)"
                      class="bm-text-input"
                    />
                  </div>
                  <div class="bm-upload-select-wrap">
                    <bm-select
                      formControlName="category"
                      [options]="photoCategoryOptions"
                      placeholder="Select category"
                      [searchable]="false"
                    ></bm-select>
                  </div>
                </div>
                <bm-button
                  type="submit"
                  variant="secondary"
                  size="md"
                  [loading]="isUploadingPhoto()"
                  [disabled]="photoForm.invalid || isUploadingPhoto()"
                >
                  <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
                  <span>Add Photo</span>
                </bm-button>
              </form>
            }

            <!-- Photo Gallery Grid -->
            @if (merchant()?.photos && merchant()!.photos.length > 0) {
              <div class="bm-photo-grid">
                @for (photo of merchant()!.photos; track photo.id) {
                  <div class="bm-photo-card">
                    <img [src]="photo.url" [alt]="photo.category" class="bm-photo-img" />
                    <div class="bm-photo-overlay">
                      <bm-badge variant="neutral" size="sm">{{ photo.category }}</bm-badge>
                      @if (merchant()?.status === 'DRAFT' || merchant()?.status === 'REJECTED') {
                        <button
                          type="button"
                          class="bm-photo-delete-btn"
                          (click)="onDeletePhoto(photo.id)"
                          title="Remove photo"
                        >
                          <lucide-icon [img]="TrashIcon" [size]="14"></lucide-icon>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <bm-empty-state
                title="No Photographs Uploaded Yet"
                description="Upload at least 3 photos (exterior storefront, interior layout, and display counter) so the administration team can verify the physical business."
              >
                <div bmEmptyIcon>
                  <lucide-icon [img]="CameraIcon" [size]="36"></lucide-icon>
                </div>
              </bm-empty-state>
            }
          </bm-card>

          <!-- Section 3: Business Documents (GST, PAN, Trade License) -->
          <bm-card title="Business KYC & Licensing Documents">
            @if (merchant()?.status === 'DRAFT' || merchant()?.status === 'REJECTED') {
              <form [formGroup]="docForm" (ngSubmit)="onAddDocument()" class="bm-inline-upload-form">
                <div class="bm-upload-input-wrap">
                  <div class="bm-upload-url-input">
                    <input
                      type="url"
                      formControlName="url"
                      placeholder="Enter document PDF or image URL"
                      class="bm-text-input"
                    />
                  </div>
                  <div class="bm-upload-select-wrap">
                    <bm-select
                      formControlName="type"
                      [options]="docTypeOptions"
                      placeholder="Select document type"
                      [searchable]="false"
                    ></bm-select>
                  </div>
                </div>
                <bm-button
                  type="submit"
                  variant="secondary"
                  size="md"
                  [loading]="isUploadingDoc()"
                  [disabled]="docForm.invalid || isUploadingDoc()"
                >
                  <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
                  <span>Attach Document</span>
                </bm-button>
              </form>
            }

            @if (merchant()?.documents && merchant()!.documents.length > 0) {
              <div class="bm-docs-list">
                @for (doc of merchant()!.documents; track doc.id) {
                  <div class="bm-doc-row">
                    <div class="bm-doc-icon">
                      <lucide-icon [img]="FileCheckIcon" [size]="18"></lucide-icon>
                    </div>
                    <div class="bm-doc-info">
                      <span class="bm-doc-type">{{ doc.type.replace('_', ' ') }}</span>
                      <a [href]="doc.url" target="_blank" rel="noopener noreferrer" class="bm-doc-url">
                        <span>View Document</span>
                        <lucide-icon [img]="ExternalLinkIcon" [size]="12"></lucide-icon>
                      </a>
                    </div>
                    <bm-badge variant="success" size="sm">Attached</bm-badge>
                  </div>
                }
              </div>
            } @else {
              <p class="bm-docs-empty-note">
                No KYC documents attached yet. While optional for draft creation, providing GST or Trade License speeds up administration approval.
              </p>
            }
          </bm-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .bm-store-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
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

    // Create store hero
    .bm-create-store-container {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
      width: 100%;
      margin: 0 auto;
    }

    .bm-create-hero {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-4);
      padding: var(--bm-space-5);
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
    }

    .bm-hero-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bm-create-title {
      font-size: var(--bm-font-size-lg);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-create-desc {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      margin: 4px 0 0 0;
      line-height: 1.5;
    }

    .bm-alert-banner {
      padding: var(--bm-space-3) var(--bm-space-4);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);

      &.bm-alert-danger {
        background-color: var(--bm-color-danger-bg);
        color: var(--bm-color-danger);
        border: 1px solid var(--bm-color-danger-border);
      }
    }

    .bm-store-form {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-4);

      @media (min-width: 640px) {
        grid-template-columns: 1fr 1fr;
      }
    }

    .bm-full-col {
      @media (min-width: 640px) {
        grid-column: span 2;
      }
    }

    .bm-select-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-field-label {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-select {
      height: 38px;
      padding: 0 var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-surface);
      color: var(--bm-color-text-primary);
      font-size: var(--bm-font-size-sm);
      outline: none;

      &:focus {
        border-color: var(--bm-color-primary);
        box-shadow: 0 0 0 3px var(--bm-color-primary-focus);
      }
    }

    .bm-coord-helper {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--bm-space-2);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      padding: var(--bm-space-3);
      background-color: var(--bm-color-surface-subtle);
      border-radius: var(--bm-radius-md);
    }

    .bm-pill-btn {
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-full);
      padding: 3px 8px;
      font-size: 11px;
      color: var(--bm-color-primary);
      cursor: pointer;

      &:hover {
        background-color: var(--bm-color-primary-soft);
      }
    }

    .bm-form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--bm-space-4);
      border-top: 1px solid var(--bm-color-border);
    }

    // Active store layout
    .bm-store-active-layout {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-store-status-banner {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      padding: var(--bm-space-4) var(--bm-space-5);
      border-radius: var(--bm-radius-lg);
      border: 1px solid var(--bm-color-border);
      background-color: var(--bm-color-surface);

      &.status-approved {
        border-left: 4px solid var(--bm-color-success);
        .bm-status-icon-wrap { color: var(--bm-color-success); }
      }

      &.status-pending_review {
        border-left: 4px solid var(--bm-color-warning);
        .bm-status-icon-wrap { color: var(--bm-color-warning); }
      }

      &.status-rejected {
        border-left: 4px solid var(--bm-color-danger);
        .bm-status-icon-wrap { color: var(--bm-color-danger); }
      }

      &.status-draft {
        border-left: 4px solid var(--bm-color-primary);
        .bm-status-icon-wrap { color: var(--bm-color-primary); }
      }
    }

    .bm-status-main {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-3);
    }

    .bm-status-icon-wrap {
      margin-top: 2px;
    }

    .bm-status-title-row {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-store-display-name {
      font-size: var(--bm-font-size-lg);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-status-subtitle {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 4px 0 0 0;
    }

    .bm-rejection-alert {
      padding: var(--bm-space-3);
      background-color: var(--bm-color-danger-bg);
      border: 1px solid var(--bm-color-danger-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-danger);
    }

    .bm-store-info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-4);

      @media (min-width: 640px) {
        grid-template-columns: 1fr 1fr;
      }
    }

    .bm-col-2 {
      @media (min-width: 640px) {
        grid-column: span 2;
      }
    }

    .bm-info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-info-label {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .bm-info-val {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-code {
      font-family: var(--bm-font-mono);
      font-size: var(--bm-font-size-xs);
      background-color: var(--bm-color-surface-subtle);
      padding: 2px 6px;
      border-radius: var(--bm-radius-sm);
      width: fit-content;
    }

    // Inline upload form
    .bm-inline-upload-form {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      margin-bottom: var(--bm-space-4);
      padding-bottom: var(--bm-space-4);
      border-bottom: 1px solid var(--bm-color-border);

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: flex-start;
      }
    }

    .bm-upload-input-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);

      @media (min-width: 640px) {
        flex-direction: row;
        align-items: flex-start;
      }
    }

    .bm-upload-url-input {
      flex: 1;
      width: 100%;
    }

    .bm-upload-select-wrap {
      width: 100%;

      @media (min-width: 640px) {
        width: 250px;
        flex-shrink: 0;
      }
    }

    .bm-text-input {
      width: 100%;
      height: 38px;
      padding: 0 var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      background-color: var(--bm-color-surface);
      outline: none;
      transition: border-color var(--bm-transition-fast), box-shadow var(--bm-transition-fast);

      &:focus {
        border-color: var(--bm-color-primary);
        box-shadow: 0 0 0 3px var(--bm-color-primary-focus);
      }
    }

    // Photo grid
    .bm-photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--bm-space-3);
    }

    .bm-photo-card {
      position: relative;
      height: 140px;
      border-radius: var(--bm-radius-md);
      overflow: hidden;
      border: 1px solid var(--bm-color-border);
    }

    .bm-photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-photo-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 6px 8px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-photo-delete-btn {
      background: rgba(220, 38, 38, 0.85);
      color: #FFFFFF;
      border: none;
      padding: 4px;
      border-radius: var(--bm-radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #DC2626;
      }
    }

    // Docs list
    .bm-docs-list {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-2);
    }

    .bm-doc-row {
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
      flex-shrink: 0;
    }

    .bm-doc-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--bm-space-4);
    }

    .bm-doc-type {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-doc-url {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--bm-color-primary);
    }

    .bm-docs-empty-note {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 0;
    }
  `],
})
export class MyStoreComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly merchantService = inject(MerchantService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly StoreIcon = Store;
  readonly SendIcon = Send;
  readonly CheckCircleIcon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly AlertCircleIcon = AlertCircle;
  readonly RefreshIcon = RefreshCw;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly CameraIcon = Camera;
  readonly FileCheckIcon = FileCheck2;
  readonly ExternalLinkIcon = ExternalLink;

  readonly keralaDistricts = KERALA_DISTRICTS;
  readonly businessTypes = BUSINESS_TYPES;

  readonly photoCategoryOptions = [
    { label: 'Exterior Storefront', value: 'EXTERIOR', description: 'Street view showing store entrance and board' },
    { label: 'Interior Store Layout', value: 'INTERIOR', description: 'Overview of retail space and shelves' },
    { label: 'Product Display Counter', value: 'DISPLAY_AREA', description: 'Main goods showcase and racks' },
    { label: 'Storage & Stockroom', value: 'STORAGE', description: 'Bulk storage or inventory area' },
    { label: 'Billing / POS Counter', value: 'BILLING_COUNTER', description: 'Customer checkout station' },
    { label: 'Other Verification Photo', value: 'OTHER', description: 'Supporting photo proof' },
  ];

  readonly docTypeOptions = [
    { label: 'GST Registration Certificate', value: 'GST_CERTIFICATE', description: 'Government GST document' },
    { label: 'Business PAN Card', value: 'PAN_CARD', description: 'Income tax permanent account number' },
    { label: 'Trade License / Local Permit', value: 'TRADE_LICENSE', description: 'Panchayath / Municipality permit' },
    { label: 'FSSAI Food Safety License', value: 'FSSAI_LICENSE', description: 'Food business operator registration' },
    { label: 'Store Lease / Rental Agreement', value: 'RENTAL_AGREEMENT', description: 'Storefront ownership or lease' },
    { label: 'Other Official Business Proof', value: 'OTHER', description: 'Supporting legal establishment document' },
  ];

  readonly merchant = signal<MerchantRecord | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isCreatingStore = signal<boolean>(false);
  readonly isUploadingPhoto = signal<boolean>(false);
  readonly isUploadingDoc = signal<boolean>(false);
  readonly isSubmittingReview = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Store creation form
  readonly createStoreForm: FormGroup = this.fb.group({
    storeName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.required]],
    businessType: [BUSINESS_TYPES[0], [Validators.required]],
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    city: ['', [Validators.required]],
    district: [KERALA_DISTRICTS[1], [Validators.required]], // Default Ernakulam
    state: ['Kerala', [Validators.required]],
    postalCode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
    latitude: [9.9312, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [76.2673, [Validators.required, Validators.min(-180), Validators.max(180)]],
  });

  // Photo form
  readonly photoForm: FormGroup = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    category: ['EXTERIOR', [Validators.required]],
  });

  // Document form
  readonly docForm: FormGroup = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    type: ['GST_CERTIFICATE', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadStore();
  }

  loadStore(): void {
    this.isLoading.set(true);
    this.merchantService.getMyMerchant().subscribe({
      next: (store) => {
        this.merchant.set(store);
        this.isLoading.set(false);
      },
      error: () => {
        this.merchant.set(null);
        this.isLoading.set(false);
      },
    });
  }

  setPresetCoords(lat: number, lng: number, city: string): void {
    this.createStoreForm.patchValue({
      latitude: lat,
      longitude: lng,
      city,
    });
  }

  getCreateError(fieldName: string): string | null {
    const control = this.createStoreForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return null;
    if (control.errors['required']) return 'This field is required';
    if (control.errors['pattern']) return 'Invalid 6-digit Indian PIN code';
    if (control.errors['min'] || control.errors['max']) return 'Coordinate out of valid range';
    return null;
  }

  onCreateStore(): void {
    if (this.createStoreForm.invalid || this.isCreatingStore()) {
      this.createStoreForm.markAllAsTouched();
      return;
    }

    this.isCreatingStore.set(true);
    this.errorMessage.set(null);

    const val = this.createStoreForm.value;
    const req: CreateMerchantRequest = {
      storeName: val.storeName.trim(),
      description: val.description.trim(),
      businessType: val.businessType,
      addressLine1: val.addressLine1.trim(),
      addressLine2: val.addressLine2 ? val.addressLine2.trim() : undefined,
      city: val.city.trim(),
      district: val.district,
      state: val.state.trim(),
      postalCode: val.postalCode.trim(),
      country: 'IN',
      latitude: Number(val.latitude),
      longitude: Number(val.longitude),
    };

    this.merchantService.createApplication(req).subscribe({
      next: (created) => {
        this.isCreatingStore.set(false);
        this.merchant.set(created);
        this.toast.success('Your merchant store draft has been created!');
      },
      error: (err: ApiError) => {
        this.isCreatingStore.set(false);
        this.errorMessage.set(err.message || 'Unable to create store application.');
      },
    });
  }

  onAddPhoto(): void {
    if (this.photoForm.invalid || this.isUploadingPhoto()) return;

    this.isUploadingPhoto.set(true);
    const { url, category } = this.photoForm.value;

    this.merchantService
      .uploadPhotos([{ url: url.trim(), category }])
      .subscribe({
        next: (updated) => {
          this.merchant.set(updated);
          this.photoForm.reset({ url: '', category: 'EXTERIOR' });
          this.isUploadingPhoto.set(false);
        },
        error: (err: ApiError) => {
          this.toast.danger(err.message || 'Failed to upload photo.');
          this.isUploadingPhoto.set(false);
        },
      });
  }

  onDeletePhoto(photoId: string): void {
    this.merchantService.deletePhoto(photoId).subscribe({
      next: (updated) => {
        this.merchant.set(updated);
      },
      error: (err: ApiError) => {
        this.toast.danger(err.message || 'Failed to delete photo.');
      },
    });
  }

  onAddDocument(): void {
    if (this.docForm.invalid || this.isUploadingDoc()) return;

    this.isUploadingDoc.set(true);
    const { url, type } = this.docForm.value;

    this.merchantService.uploadDocument({ url: url.trim(), type }).subscribe({
      next: (updated) => {
        this.merchant.set(updated);
        this.docForm.reset({ url: '', type: 'GST_CERTIFICATE' });
        this.isUploadingDoc.set(false);
      },
      error: (err: ApiError) => {
        this.toast.danger(err.message || 'Failed to attach document.');
        this.isUploadingDoc.set(false);
      },
    });
  }

  handleSubmitForReview(): void {
    const store = this.merchant();
    if (!store) return;

    if (!store.photos || store.photos.length < 3) {
      this.toast.warning('Please upload at least 3 store photographs before submitting for review.');
      return;
    }

    this.isSubmittingReview.set(true);
    this.merchantService.submitApplication().subscribe({
      next: (submitted) => {
        this.merchant.set(submitted);
        this.isSubmittingReview.set(false);
      },
      error: (err: ApiError) => {
        this.isSubmittingReview.set(false);
        this.toast.danger(err.message || 'Submission failed. Please check required fields.');
      },
    });
  }

  statusBadgeVariant(status?: string): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING_REVIEW': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  }
}
