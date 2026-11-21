import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  CloudUpload,
  ExternalLink,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Lock,
  LucideAngularModule,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import {
  BusinessDocumentType,
  CreateMerchantRequest,
  MERCHANT_BUSINESS_TYPES,
  MerchantRecord,
  PhotoCategory,
  UpdateMerchantRequest,
} from '../../../../core/models/merchant.model';
import { ApiError } from '../../../../core/services/api-client.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { MerchantService } from '../../../../core/services/merchant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { GeoCoordinates, LocationPickerComponent } from '../../../../shared/ui/location-picker/location-picker.component';
import { OtpInputComponent } from '../../../../shared/ui/otp-input/otp-input.component';

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

export const BUSINESS_TYPES = [...MERCHANT_BUSINESS_TYPES];

@Component({
  selector: 'bm-my-store',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    LocationPickerComponent,
    OtpInputComponent,
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
              <div class="bm-alert-content">
                <lucide-icon [img]="AlertCircleIcon" [size]="18" class="bm-alert-icon"></lucide-icon>
                <div class="bm-alert-text">
                  <span class="bm-alert-title">{{ isPhoneError() ? 'Phone Verification Required' : 'Application Submission Error' }}</span>
                  <span class="bm-alert-desc">{{ errorMessage() }}</span>
                </div>
              </div>
              @if (isPhoneError()) {
                <bm-button
                  type="button"
                  variant="primary"
                  size="sm"
                  (btnClick)="openPhoneVerificationModal()"
                >
                  <lucide-icon [img]="ShieldCheckIcon" [size]="14" bmLeading></lucide-icon>
                  <span>Verify Phone Number</span>
                </bm-button>
              }
            </div>
          } @else if (!authService.currentUser()?.isPhoneVerified) {
            <div class="bm-alert-banner bm-alert-warning" role="status">
              <div class="bm-alert-content">
                <lucide-icon [img]="PhoneIcon" [size]="18" class="bm-alert-icon text-warning"></lucide-icon>
                <div class="bm-alert-text">
                  <span class="bm-alert-title">WhatsApp Phone Verification Required</span>
                  <span class="bm-alert-desc">
                    Your phone number must be verified via WhatsApp OTP before creating your merchant store.
                  </span>
                </div>
              </div>
              <bm-button
                type="button"
                variant="outline"
                size="sm"
                (btnClick)="openPhoneVerificationModal()"
              >
                <lucide-icon [img]="ShieldCheckIcon" [size]="14" bmLeading></lucide-icon>
                <span>Verify Phone</span>
              </bm-button>
            </div>
          }

          <bm-card title="Store Identification & Location">
            <form [formGroup]="createStoreForm" (ngSubmit)="onCreateStore()" class="bm-store-form">
              <div class="bm-form-grid">
                <!-- Store Name -->
                <bm-input
                  id="store-name"
                  label="Dealership / Showroom Name"
                  placeholder="e.g. Apex Motors & Two-Wheelers"
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
                  placeholder="Select vehicle dealership category"
                  formControlName="businessType"
                  [error]="getCreateError('businessType')"
                ></bm-select>

                <!-- Description -->
                <div class="bm-full-col">
                  <bm-input
                    id="store-desc"
                    label="Showroom Description & Vehicle Brands"
                    placeholder="Briefly describe your showroom, vehicle brands (Cars & Bikes), and delivery/pickup facilities"
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

                <!-- Interactive Google Map Location Picker -->
                <div class="bm-full-col">
                  <bm-location-picker
                    [latitude]="createStoreForm.get('latitude')?.value"
                    [longitude]="createStoreForm.get('longitude')?.value"
                    (coordinatesChange)="onCoordinatesSelected($event)"
                  ></bm-location-picker>
                </div>

                <!-- Coordinates Numeric Inputs -->
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
              @if (merchant()?.location?.latitude && merchant()?.location?.longitude) {
                <div class="bm-info-item bm-col-2" style="margin-top: 8px;">
                  <bm-location-picker
                    [latitude]="merchant()!.location.latitude"
                    [longitude]="merchant()!.location.longitude"
                    [readonly]="true"
                  ></bm-location-picker>
                </div>
              }
            </div>
          </bm-card>

          <!-- Section 2: Store Photographs (3+ required for submission) -->
          <bm-card
            title="Store Photographs"
            [subtitle]="'Uploaded: ' + (merchant()?.photos?.length || 0) + ' / 10 (Minimum 3 required for review submission)'"
          >
            <!-- Photo Upload Area (if editable) -->
            @if (merchant()?.status === 'DRAFT' || merchant()?.status === 'REJECTED') {
              <div class="bm-upload-panel">
                <div class="bm-upload-mode-nav">
                  <button
                    type="button"
                    class="bm-mode-btn"
                    [class.bm-mode-active]="photoUploadMode() === 'FILE'"
                    (click)="photoUploadMode.set('FILE')"
                  >
                    <lucide-icon [img]="CloudUploadIcon" [size]="14"></lucide-icon>
                    <span>Upload File (Cloudinary)</span>
                  </button>
                  <button
                    type="button"
                    class="bm-mode-btn"
                    [class.bm-mode-active]="photoUploadMode() === 'URL'"
                    (click)="photoUploadMode.set('URL')"
                  >
                    <lucide-icon [img]="ExternalLinkIcon" [size]="14"></lucide-icon>
                    <span>Direct Image URL</span>
                  </button>
                </div>

                @if (photoUploadMode() === 'FILE') {
                  @if (!cloudinaryService.isConfigured()) {
                    <div class="bm-cloudinary-notice">
                      <lucide-icon [img]="AlertCircleIcon" [size]="16" class="bm-notice-icon"></lucide-icon>
                      <div class="bm-notice-text">
                        <strong>Cloudinary credentials not set in <code>.env</code>.</strong>
                        <span>Add <code>CLOUDINARY_CLOUD_NAME</code> and <code>CLOUDINARY_UPLOAD_PRESET</code> to your <code>.env</code> file. You can still switch to <strong>Direct Image URL</strong> to add photos.</span>
                      </div>
                    </div>
                  }

                  @if (!selectedPhotoFile()) {
                    <div
                      class="bm-dropzone"
                      [class.bm-drag-active]="photoDragActive()"
                      (dragover)="onPhotoDragOver($event)"
                      (dragleave)="photoDragActive.set(false)"
                      (drop)="onPhotoDrop($event)"
                      (click)="photoFileInput.click()"
                    >
                      <input
                        #photoFileInput
                        type="file"
                        accept="image/*"
                        style="display: none;"
                        (change)="onPhotoFileSelected($event)"
                      />
                      <div class="bm-dropzone-icon-box">
                        <lucide-icon [img]="CloudUploadIcon" [size]="28"></lucide-icon>
                      </div>
                      <div class="bm-dropzone-text">
                        <span class="bm-dropzone-title">Click to choose photo or drag & drop</span>
                        <span class="bm-dropzone-subtitle">JPEG, PNG, or WebP up to 10MB</span>
                      </div>
                    </div>
                  } @else {
                    <div class="bm-selected-file-card">
                      <div class="bm-file-thumb">
                        @if (photoPreviewUrl()) {
                          <img [src]="photoPreviewUrl()" alt="Store photo preview" class="bm-thumb-img" />
                        } @else {
                          <lucide-icon [img]="ImageIcon" [size]="24"></lucide-icon>
                        }
                      </div>
                      <div class="bm-file-details">
                        <span class="bm-file-name" [title]="selectedPhotoFile()?.name">{{ selectedPhotoFile()?.name }}</span>
                        <span class="bm-file-size">{{ formatBytes(selectedPhotoFile()?.size || 0) }}</span>
                      </div>
                      <div class="bm-file-select-wrap">
                        <bm-select
                          [options]="photoCategoryOptions"
                          [value]="selectedPhotoCategory()"
                          (valueChange)="onPhotoCategoryChanged($event)"
                          placeholder="Select category"
                          [searchable]="false"
                        ></bm-select>
                      </div>
                      <div class="bm-file-actions">
                        <bm-button
                          type="button"
                          variant="primary"
                          size="sm"
                          [loading]="isUploadingPhoto()"
                          [disabled]="isUploadingPhoto()"
                          (btnClick)="onUploadPhotoFile()"
                        >
                          <lucide-icon [img]="CloudUploadIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Upload & Save</span>
                        </bm-button>
                        <bm-button
                          type="button"
                          variant="ghost"
                          size="sm"
                          [disabled]="isUploadingPhoto()"
                          (btnClick)="clearSelectedPhoto()"
                        >
                          <lucide-icon [img]="XIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Cancel</span>
                        </bm-button>
                      </div>
                    </div>
                  }
                } @else {
                  <form [formGroup]="photoForm" (ngSubmit)="onAddPhoto()" class="bm-inline-upload-form">
                    <div class="bm-upload-input-wrap">
                      <div class="bm-upload-url-input">
                        <input
                          type="url"
                          formControlName="url"
                          placeholder="Enter image URL (e.g. https://res.cloudinary.com/... or https://images.unsplash.com/...)"
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
              </div>
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
              <div class="bm-upload-panel">
                <div class="bm-upload-mode-nav">
                  <button
                    type="button"
                    class="bm-mode-btn"
                    [class.bm-mode-active]="docUploadMode() === 'FILE'"
                    (click)="docUploadMode.set('FILE')"
                  >
                    <lucide-icon [img]="CloudUploadIcon" [size]="14"></lucide-icon>
                    <span>Upload Document File (Cloudinary)</span>
                  </button>
                  <button
                    type="button"
                    class="bm-mode-btn"
                    [class.bm-mode-active]="docUploadMode() === 'URL'"
                    (click)="docUploadMode.set('URL')"
                  >
                    <lucide-icon [img]="ExternalLinkIcon" [size]="14"></lucide-icon>
                    <span>Direct Document URL</span>
                  </button>
                </div>

                @if (docUploadMode() === 'FILE') {
                  @if (!cloudinaryService.isConfigured()) {
                    <div class="bm-cloudinary-notice">
                      <lucide-icon [img]="AlertCircleIcon" [size]="16" class="bm-notice-icon"></lucide-icon>
                      <div class="bm-notice-text">
                        <strong>Cloudinary credentials not set in <code>.env</code>.</strong>
                        <span>Add <code>CLOUDINARY_CLOUD_NAME</code> and <code>CLOUDINARY_UPLOAD_PRESET</code> to your <code>.env</code> file. You can still switch to <strong>Direct Document URL</strong> to attach documents.</span>
                      </div>
                    </div>
                  }

                  @if (!selectedDocFile()) {
                    <div
                      class="bm-dropzone"
                      [class.bm-drag-active]="docDragActive()"
                      (dragover)="onDocDragOver($event)"
                      (dragleave)="docDragActive.set(false)"
                      (drop)="onDocDrop($event)"
                      (click)="docFileInput.click()"
                    >
                      <input
                        #docFileInput
                        type="file"
                        accept=".pdf,image/*"
                        style="display: none;"
                        (change)="onDocFileSelected($event)"
                      />
                      <div class="bm-dropzone-icon-box">
                        <lucide-icon [img]="CloudUploadIcon" [size]="28"></lucide-icon>
                      </div>
                      <div class="bm-dropzone-text">
                        <span class="bm-dropzone-title">Click to choose document or drag & drop</span>
                        <span class="bm-dropzone-subtitle">PDF, JPEG, PNG, or WebP up to 15MB</span>
                      </div>
                    </div>
                  } @else {
                    <div class="bm-selected-file-card">
                      <div class="bm-file-thumb bm-doc-thumb">
                        <lucide-icon [img]="FileTextIcon" [size]="24"></lucide-icon>
                      </div>
                      <div class="bm-file-details">
                        <span class="bm-file-name" [title]="selectedDocFile()?.name">{{ selectedDocFile()?.name }}</span>
                        <span class="bm-file-size">{{ formatBytes(selectedDocFile()?.size || 0) }}</span>
                      </div>
                      <div class="bm-file-select-wrap">
                        <bm-select
                          [options]="docTypeOptions"
                          [value]="selectedDocType()"
                          (valueChange)="onDocTypeChanged($event)"
                          placeholder="Select document type"
                          [searchable]="false"
                        ></bm-select>
                      </div>
                      <div class="bm-file-actions">
                        <bm-button
                          type="button"
                          variant="primary"
                          size="sm"
                          [loading]="isUploadingDoc()"
                          [disabled]="isUploadingDoc()"
                          (btnClick)="onUploadDocFile()"
                        >
                          <lucide-icon [img]="CloudUploadIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Upload & Attach</span>
                        </bm-button>
                        <bm-button
                          type="button"
                          variant="ghost"
                          size="sm"
                          [disabled]="isUploadingDoc()"
                          (btnClick)="clearSelectedDoc()"
                        >
                          <lucide-icon [img]="XIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Cancel</span>
                        </bm-button>
                      </div>
                    </div>
                  }
                } @else {
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
              </div>
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

      <!-- In-Context Phone Verification Modal -->
      @if (showPhoneModal()) {
        <div class="bm-modal-backdrop" (click)="closePhoneModal()">
          <div class="bm-modal-box" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <div class="bm-modal-title-group">
                <div class="bm-modal-icon-badge">
                  <lucide-icon [img]="PhoneIcon" [size]="20"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-modal-title">Verify WhatsApp Phone Number</h3>
                  <p class="bm-modal-subtitle">Required to create your store and release customer pickup OTPs</p>
                </div>
              </div>
              <button type="button" class="bm-modal-close-btn" (click)="closePhoneModal()" aria-label="Close dialog">
                <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <div class="bm-modal-body">
              <!-- Profile Registered Phone Display (Non-editable / Locked to account profile) -->
              <div class="bm-registered-phone-card">
                <div class="bm-phone-row">
                  <div class="bm-phone-text-group">
                    <span class="bm-phone-badge-label">Registered Account Phone</span>
                    <span class="bm-phone-value">{{ formattedRegisteredPhone() || 'No phone registered in profile' }}</span>
                  </div>
                  <div class="bm-phone-lock-tag" title="Phone is linked to your user profile and cannot be modified here">
                    <lucide-icon [img]="LockIcon" [size]="13"></lucide-icon>
                    <span>Profile Bound</span>
                  </div>
                </div>
                <p class="bm-phone-help">
                  Verification OTP is dispatched exclusively to your registered account phone via WhatsApp.
                </p>
              </div>

              @if (phoneSendError()) {
                <div class="bm-alert-banner bm-alert-danger" role="alert" style="margin-bottom: 12px;">
                  <span>{{ phoneSendError() }}</span>
                </div>
              }

              @if (phoneVerifyError()) {
                <div class="bm-alert-banner bm-alert-danger" role="alert" style="margin-bottom: 12px;">
                  <span>{{ phoneVerifyError() }}</span>
                </div>
              }

              @if (phoneModalStep() === 'PHONE') {
                <div class="bm-modal-actions" style="margin-top: 16px;">
                  <bm-button
                    type="button"
                    variant="outline"
                    size="md"
                    (btnClick)="closePhoneModal()"
                  >
                    <span>Cancel</span>
                  </bm-button>

                  <bm-button
                    type="button"
                    variant="primary"
                    size="md"
                    [loading]="isSendingOtp()"
                    [disabled]="!formattedRegisteredPhone() || isSendingOtp()"
                    (btnClick)="sendVerificationOtp()"
                  >
                    <lucide-icon [img]="SendIcon" [size]="16" bmLeading></lucide-icon>
                    <span>Send WhatsApp OTP</span>
                  </bm-button>
                </div>
              } @else {
                <!-- OTP Entry Step with dedicated 6-box OTP Component -->
                <div class="bm-otp-section">
                  <div class="bm-otp-sent-banner">
                    <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-success"></lucide-icon>
                    <span>6-digit OTP code dispatched to <strong>{{ formattedRegisteredPhone() }}</strong> via WhatsApp</span>
                  </div>

                  <div class="bm-otp-input-area">
                    <label class="bm-otp-field-label">Enter 6-Digit WhatsApp Code</label>
                    <bm-otp-input
                      [length]="6"
                      [hasError]="!!phoneVerifyError()"
                      [(ngModel)]="verificationOtp"
                      (otpComplete)="onOtpAutoCompleted($event)"
                    ></bm-otp-input>
                    <span class="bm-otp-hint">Type each digit or paste the full 6-digit code</span>
                  </div>

                  <div class="bm-resend-row">
                    @if (resendCooldown() > 0) {
                      <span class="bm-cooldown-text">Resend WhatsApp code in {{ resendCooldown() }}s</span>
                    } @else {
                      <button
                        type="button"
                        class="bm-resend-btn"
                        [disabled]="isSendingOtp()"
                        (click)="sendVerificationOtp()"
                      >
                        Resend WhatsApp OTP
                      </button>
                    }
                  </div>

                  <div class="bm-modal-actions">
                    <bm-button
                      type="button"
                      variant="outline"
                      size="md"
                      (btnClick)="closePhoneModal()"
                    >
                      <span>Cancel</span>
                    </bm-button>

                    <bm-button
                      type="button"
                      variant="primary"
                      size="md"
                      [loading]="isVerifyingOtp()"
                      [disabled]="verificationOtp.length < 6 || isVerifyingOtp()"
                      (btnClick)="verifyOtpAndSubmitStore()"
                    >
                      <lucide-icon [img]="ShieldCheckIcon" [size]="16" bmLeading></lucide-icon>
                      <span>Verify & Submit Store</span>
                    </bm-button>
                  </div>
                </div>
              }
            </div>
          </div>
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
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);

      &.bm-alert-danger {
        background-color: var(--bm-color-danger-bg);
        color: var(--bm-color-danger);
        border: 1px solid var(--bm-color-danger-border);
      }

      &.bm-alert-warning {
        background-color: #FEF3C7;
        color: #92400E;
        border: 1px solid #FDE68A;
      }
    }

    .bm-alert-content {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      flex: 1;
      min-width: 240px;
    }

    .bm-alert-icon {
      flex-shrink: 0;
    }

    .bm-alert-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-alert-title {
      font-weight: var(--bm-font-weight-semibold);
      font-size: var(--bm-font-size-xs);
    }

    .bm-alert-desc {
      margin: 0;
      font-size: 11px;
      line-height: 1.4;
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

    // Upload panel and mode navigation
    .bm-upload-panel {
      margin-bottom: var(--bm-space-4);
      padding-bottom: var(--bm-space-4);
      border-bottom: 1px solid var(--bm-color-border);
    }

    .bm-upload-mode-nav {
      display: inline-flex;
      background-color: var(--bm-color-surface-subtle);
      padding: 3px;
      border-radius: var(--bm-radius-md);
      gap: 3px;
      margin-bottom: var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
    }

    .bm-mode-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: none;
      background: transparent;
      border-radius: var(--bm-radius-sm);
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      transition: all var(--bm-transition-fast);

      &:hover {
        color: var(--bm-color-text-primary);
      }

      &.bm-mode-active {
        background-color: var(--bm-color-surface);
        color: var(--bm-color-primary);
        font-weight: var(--bm-font-weight-semibold);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }

    .bm-cloudinary-notice {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-2);
      padding: var(--bm-space-3);
      background-color: #FEF3C7;
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: #92400E;
      margin-bottom: var(--bm-space-3);

      code {
        font-family: var(--bm-font-mono);
        background-color: rgba(0, 0, 0, 0.06);
        padding: 1px 4px;
        border-radius: 3px;
      }
    }

    .bm-notice-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }

    // Dropzone
    .bm-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: var(--bm-space-6) var(--bm-space-4);
      border: 1.5px dashed var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      background-color: var(--bm-color-surface-subtle);
      cursor: pointer;
      text-align: center;
      transition: border-color var(--bm-transition-fast), background-color var(--bm-transition-fast);

      &:hover {
        border-color: var(--bm-color-primary);
        background-color: #F4F9F6;
      }

      &.bm-drag-active {
        border-color: var(--bm-color-primary);
        background-color: #E8F3ED;
      }
    }

    .bm-dropzone-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--bm-radius-full);
      background-color: #E8F3ED;
      color: var(--bm-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bm-dropzone-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-dropzone-title {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-dropzone-subtitle {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-muted);
    }

    // Selected file card
    .bm-selected-file-card {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-surface);

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
      }
    }

    .bm-file-thumb {
      width: 56px;
      height: 56px;
      border-radius: var(--bm-radius-sm);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bm-color-surface-subtle);
      flex-shrink: 0;
      border: 1px solid var(--bm-color-border);
    }

    .bm-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-doc-thumb {
      background-color: #E8F3ED;
      color: var(--bm-color-primary);
    }

    .bm-file-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-file-name {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bm-file-size {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-muted);
    }

    .bm-file-select-wrap {
      width: 100%;

      @media (min-width: 768px) {
        width: 240px;
        flex-shrink: 0;
      }
    }

    .bm-file-actions {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      flex-shrink: 0;
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

    // Phone Verification Modal
    .bm-modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: var(--bm-space-4);
      animation: fadeIn 150ms ease-out;
    }

    .bm-modal-box {
      width: 100%;
      max-width: 460px;
      background-color: var(--bm-color-surface);
      border-radius: var(--bm-radius-lg);
      border: 1px solid var(--bm-color-border);
      box-shadow: var(--bm-shadow-lg);
      padding: var(--bm-space-6);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
      animation: modalSlideUp 180ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalSlideUp {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .bm-modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--bm-space-3);
      padding-bottom: var(--bm-space-3);
      border-bottom: 1px solid var(--bm-color-border);
    }

    .bm-modal-title-group {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-modal-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bm-modal-title {
      font-size: var(--bm-font-size-base);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-modal-subtitle {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 2px 0 0 0;
    }

    .bm-modal-close-btn {
      background: transparent;
      border: none;
      color: var(--bm-color-text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--bm-radius-sm);

      &:hover {
        background-color: var(--bm-color-surface-subtle);
        color: var(--bm-color-text-primary);
      }
    }

    // Registered phone card
    .bm-registered-phone-card {
      background-color: var(--bm-color-surface-subtle);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: var(--bm-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-2);
      margin-bottom: var(--bm-space-4);
    }

    .bm-phone-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--bm-space-3);
    }

    .bm-phone-text-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-phone-badge-label {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .bm-phone-value {
      font-family: var(--bm-font-mono);
      font-size: var(--bm-font-size-base);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-primary);
    }

    .bm-phone-lock-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-full);
      font-size: 11px;
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-secondary);
    }

    .bm-phone-help {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    // OTP section
    .bm-otp-section {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
    }

    .bm-otp-sent-banner {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: var(--bm-space-3);
      background-color: #E8F3ED;
      border: 1px solid rgba(23, 107, 80, 0.2);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-primary);
    }

    .bm-otp-input-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .bm-otp-field-label {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      text-align: center;
    }

    .bm-otp-hint {
      font-size: 11px;
      color: var(--bm-color-text-muted);
      text-align: center;
    }

    .bm-resend-row {
      display: flex;
      justify-content: center;
      margin-top: 2px;
    }

    .bm-cooldown-text {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-resend-btn {
      background: none;
      border: none;
      color: var(--bm-color-primary);
      font-size: 11px;
      font-weight: var(--bm-font-weight-medium);
      cursor: pointer;
      padding: 0;

      &:hover {
        text-decoration: underline;
      }
    }

    .bm-modal-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--bm-space-3);
      margin-top: var(--bm-space-4);
      padding-top: var(--bm-space-4);
      border-top: 1px solid var(--bm-color-border);
    }
  `],
})
export class MyStoreComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly merchantService = inject(MerchantService);
  readonly authService = inject(AuthService);
  readonly cloudinaryService = inject(CloudinaryService);
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
  readonly PhoneIcon = Phone;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly LockIcon = Lock;
  readonly XIcon = X;
  readonly CloudUploadIcon = CloudUpload;
  readonly FileTextIcon = FileText;
  readonly ImageIcon = ImageIcon;

  readonly photoUploadMode = signal<'FILE' | 'URL'>('FILE');
  readonly selectedPhotoFile = signal<File | null>(null);
  readonly photoPreviewUrl = signal<string | null>(null);
  readonly selectedPhotoCategory = signal<PhotoCategory>('EXTERIOR');
  readonly photoDragActive = signal<boolean>(false);

  readonly docUploadMode = signal<'FILE' | 'URL'>('FILE');
  readonly selectedDocFile = signal<File | null>(null);
  readonly selectedDocType = signal<BusinessDocumentType>('GST_CERTIFICATE');
  readonly docDragActive = signal<boolean>(false);

  readonly showPhoneModal = signal<boolean>(false);
  readonly phoneModalStep = signal<'PHONE' | 'OTP'>('PHONE');
  readonly isSendingOtp = signal<boolean>(false);
  readonly isVerifyingOtp = signal<boolean>(false);
  readonly phoneSendError = signal<string | null>(null);
  readonly phoneVerifyError = signal<string | null>(null);
  readonly resendCooldown = signal<number>(0);

  verificationOtp: string = '';
  private cooldownInterval: any = null;

  readonly formattedRegisteredPhone = computed(() => {
    const raw = this.authService.currentUser()?.phone?.trim() || '';
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    if (raw.startsWith('91') && raw.length === 12) return `+${raw}`;
    return `+91${raw}`;
  });

  readonly isPhoneError = computed(() => {
    const msg = (this.errorMessage() || '').toLowerCase();
    return msg.includes('phone') || msg.includes('verification');
  });

  readonly keralaDistricts = KERALA_DISTRICTS;
  readonly businessTypes = BUSINESS_TYPES;

  readonly photoCategoryOptions = [
    { label: 'Exterior Showroom & Entrance', value: 'EXTERIOR', description: 'Street view showing showroom facade and brand signage' },
    { label: 'Showroom Floor & Display Area', value: 'INTERIOR', description: 'Overview of cars/bikes display area and customer lounge' },
    { label: 'Vehicle Display Bays', value: 'DISPLAY_AREA', description: 'Close-up of vehicles on display or demo units' },
    { label: 'Pre-Delivery & Stockyard', value: 'STORAGE', description: 'Pre-delivery inspection (PDI) bay or vehicle stockyard' },
    { label: 'Sales & Customer Booking Counter', value: 'BILLING_COUNTER', description: 'Sales consultant desk and customer booking counter' },
    { label: 'Other Verification Photo', value: 'OTHER', description: 'Supporting dealership or franchise proof' },
  ];

  readonly docTypeOptions = [
    { label: 'GST Registration Certificate', value: 'GST_CERTIFICATE', description: 'Government GST document' },
    { label: 'Business PAN Card', value: 'PAN_CARD', description: 'Dealership / corporate PAN' },
    { label: 'Trade License / Local Permit', value: 'TRADE_LICENSE', description: 'Panchayath / Municipality permit' },
    { label: 'Dealership / Franchise License', value: 'FSSAI_LICENSE', description: 'Authorized OEM brand dealership or distribution license' },
    { label: 'Showroom Lease / Rental Agreement', value: 'RENTAL_AGREEMENT', description: 'Showroom ownership or commercial lease deed' },
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

  onCoordinatesSelected(coords: GeoCoordinates): void {
    this.createStoreForm.patchValue({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    this.createStoreForm.get('latitude')?.markAsDirty();
    this.createStoreForm.get('longitude')?.markAsDirty();
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

  openPhoneVerificationModal(): void {
    this.verificationOtp = '';
    this.phoneSendError.set(null);
    this.phoneVerifyError.set(null);
    this.phoneModalStep.set('PHONE');
    this.showPhoneModal.set(true);
  }

  closePhoneModal(): void {
    this.showPhoneModal.set(false);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.resendCooldown.set(0);
    }
  }

  sendVerificationOtp(): void {
    const phone = this.formattedRegisteredPhone();
    if (!phone) {
      this.phoneSendError.set('No registered phone number found on your account. Please check your profile.');
      return;
    }

    this.isSendingOtp.set(true);
    this.phoneSendError.set(null);
    this.phoneVerifyError.set(null);

    this.authService.sendPhoneOtp(phone).subscribe({
      next: () => {
        this.isSendingOtp.set(false);
        this.phoneModalStep.set('OTP');
        this.startCooldown();
        this.toast.success(`6-digit WhatsApp OTP sent to ${phone}!`);
      },
      error: (err: ApiError) => {
        this.isSendingOtp.set(false);
        this.phoneSendError.set(err.message || 'Failed to send WhatsApp verification code. Please try again.');
      },
    });
  }

  verifyOtpAndSubmitStore(): void {
    const phone = this.formattedRegisteredPhone();
    const otp = this.verificationOtp.trim();

    if (!otp || otp.length < 6) {
      this.phoneVerifyError.set('Please enter the complete 6-digit OTP received via WhatsApp.');
      return;
    }

    this.isVerifyingOtp.set(true);
    this.phoneVerifyError.set(null);

    this.authService.verifyPhone(phone, otp).subscribe({
      next: () => {
        this.isVerifyingOtp.set(false);
        this.closePhoneModal();
        this.errorMessage.set(null);
        this.toast.success('Phone verified successfully! Submitting your store application...');

        // Resumes and automatically submits store creation flow with existing form values
        this.onCreateStore();
      },
      error: (err: ApiError) => {
        this.isVerifyingOtp.set(false);
        this.phoneVerifyError.set(err.message || 'Invalid or expired OTP. Please check the code and try again.');
      },
    });
  }

  onOtpAutoCompleted(code: string): void {
    this.verificationOtp = code;
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        clearInterval(this.cooldownInterval);
        this.resendCooldown.set(0);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onCreateStore(): void {
    if (this.createStoreForm.invalid || this.isCreatingStore()) {
      this.createStoreForm.markAllAsTouched();
      return;
    }

    if (!this.authService.currentUser()?.isPhoneVerified) {
      this.errorMessage.set('Phone verification is required before initiating merchant onboarding.');
      this.openPhoneVerificationModal();
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
        if (err.status === 403 || (err.message && err.message.toLowerCase().includes('phone'))) {
          this.openPhoneVerificationModal();
        }
      },
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  onPhotoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.photoDragActive.set(true);
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.photoDragActive.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handlePhotoFile(files[0]);
    }
  }

  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handlePhotoFile(input.files[0]);
    }
  }

  private handlePhotoFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toast.danger('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toast.danger('Photo size exceeds 10MB limit.');
      return;
    }
    this.selectedPhotoFile.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  clearSelectedPhoto(): void {
    this.selectedPhotoFile.set(null);
    this.photoPreviewUrl.set(null);
  }

  onPhotoCategoryChanged(cat: any): void {
    if (cat) {
      this.selectedPhotoCategory.set(cat as PhotoCategory);
    }
  }

  onDocTypeChanged(type: any): void {
    if (type) {
      this.selectedDocType.set(type as BusinessDocumentType);
    }
  }

  onUploadPhotoFile(): void {
    const file = this.selectedPhotoFile();
    if (!file || this.isUploadingPhoto()) return;

    this.isUploadingPhoto.set(true);
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (res) => {
        this.merchantService
          .uploadPhotos([{ url: res.url, category: this.selectedPhotoCategory() }])
          .subscribe({
            next: (updated) => {
              this.merchant.set(updated);
              this.clearSelectedPhoto();
              this.isUploadingPhoto.set(false);
              this.toast.success('Store photograph uploaded and saved successfully!');
            },
            error: (err: ApiError) => {
              this.isUploadingPhoto.set(false);
              this.toast.danger(err.message || 'Failed to save uploaded photo to store.');
            },
          });
      },
      error: (err: Error) => {
        this.isUploadingPhoto.set(false);
        this.toast.danger(err.message || 'Cloudinary photo upload failed.');
      },
    });
  }

  onDocDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.docDragActive.set(true);
  }

  onDocDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.docDragActive.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleDocFile(files[0]);
    }
  }

  onDocFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleDocFile(input.files[0]);
    }
  }

  private handleDocFile(file: File): void {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) && !file.type.startsWith('image/')) {
      this.toast.danger('Please select a PDF or image file (PDF, JPG, PNG).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      this.toast.danger('Document size exceeds 15MB limit.');
      return;
    }
    this.selectedDocFile.set(file);
  }

  clearSelectedDoc(): void {
    this.selectedDocFile.set(null);
  }

  onUploadDocFile(): void {
    const file = this.selectedDocFile();
    if (!file || this.isUploadingDoc()) return;

    this.isUploadingDoc.set(true);
    this.cloudinaryService.uploadDocument(file).subscribe({
      next: (res) => {
        this.merchantService
          .uploadDocument({ url: res.url, type: this.selectedDocType() })
          .subscribe({
            next: (updated) => {
              this.merchant.set(updated);
              this.clearSelectedDoc();
              this.isUploadingDoc.set(false);
              this.toast.success('Business document uploaded and attached successfully!');
            },
            error: (err: ApiError) => {
              this.isUploadingDoc.set(false);
              this.toast.danger(err.message || 'Failed to attach uploaded document.');
            },
          });
      },
      error: (err: Error) => {
        this.isUploadingDoc.set(false);
        this.toast.danger(err.message || 'Cloudinary document upload failed.');
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
