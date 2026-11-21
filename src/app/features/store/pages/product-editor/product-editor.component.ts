import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Save,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-angular';
import { ApiError } from '../../../../core/services/api-client.service';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  ProductImage,
  ProductRecord,
  ProductStatus,
} from '../../../../core/models/product.model';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { BreadcrumbItem, PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'bm-product-editor',
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
    SkeletonComponent,
  ],
  template: `
    <div class="bm-product-editor-page">
      <!-- Breadcrumbs & Page Header -->
      <bm-page-header
        [breadcrumbs]="breadcrumbs()"
        [title]="isEditing() ? (productNameHeader() || 'Edit Product') : 'Create New Product'"
        [subtitle]="isEditing() ? 'Manage product specifications, pricing, images, and catalog status' : 'Add a new grocery, staple, or fresh item to your store catalogue'"
      >
        <div bmHeaderActions class="bm-header-actions-group">
          <!-- Back to Catalogue -->
          <a routerLink="/store/products">
            <bm-button variant="outline" size="md">
              <lucide-icon [img]="ArrowLeftIcon" [size]="16" bmLeading></lucide-icon>
              <span>View All Products</span>
            </bm-button>
          </a>

          @if (isEditing()) {
            <!-- Archive / Delete button -->
            @if (productStatus() !== 'ARCHIVED') {
              <bm-button variant="danger" size="md" (btnClick)="openArchiveModal()" [disabled]="isSaving()">
                <lucide-icon [img]="ArchiveIcon" [size]="16" bmLeading></lucide-icon>
                <span>Archive</span>
              </bm-button>
            }
          }

          <!-- Save as Draft -->
          <bm-button
            variant="outline"
            size="md"
            (btnClick)="saveProduct('DRAFT')"
            [disabled]="isSaving() || isLoadingProduct()"
          >
            <lucide-icon [img]="ClockIcon" [size]="16" bmLeading></lucide-icon>
            <span>Save as Draft</span>
          </bm-button>

          <!-- Publish / Save Active -->
          <bm-button
            variant="primary"
            size="md"
            (btnClick)="saveProduct('ACTIVE')"
            [disabled]="isSaving() || isLoadingProduct()"
          >
            @if (isSaving()) {
              <lucide-icon [img]="RefreshIcon" [size]="16" class="bm-spin" bmLeading></lucide-icon>
            } @else {
              <lucide-icon [img]="SaveIcon" [size]="16" bmLeading></lucide-icon>
            }
            <span>{{ isEditing() ? 'Update & Publish' : 'Publish Product' }}</span>
          </bm-button>
        </div>
      </bm-page-header>

      <!-- Loading Skeleton for Edit Mode -->
      @if (isLoadingProduct()) {
        <div class="bm-skeleton-container" aria-label="Loading product details">
          <bm-skeleton variant="text" width="60%" height="28px"></bm-skeleton>
          <div class="bm-skeleton-grid">
            <bm-skeleton variant="card" height="340px"></bm-skeleton>
            <bm-skeleton variant="card" height="340px"></bm-skeleton>
          </div>
        </div>
      } @else {
        <!-- Main Form Grid -->
        <div class="bm-editor-layout">
          <!-- Left Main Column: Form Inputs & Photos -->
          <div class="bm-editor-main">
            <!-- Global Error Banner -->
            @if (errorMessage()) {
              <div class="bm-alert-banner bm-alert-danger" role="alert">
                <lucide-icon [img]="AlertCircleIcon" [size]="18"></lucide-icon>
                <span>{{ errorMessage() }}</span>
                <button type="button" class="bm-alert-close" (click)="errorMessage.set(null)">
                  <lucide-icon [img]="XIcon" [size]="14"></lucide-icon>
                </button>
              </div>
            }

            <form [formGroup]="productForm" class="bm-product-form" (ngSubmit)="saveProduct()">
              <!-- SECTION 1: BASIC INFORMATION -->
              <bm-card title="Basic Information" subtitle="Name, brand, category, and catalog identifiers">
                <div class="bm-form-grid">
                  <!-- Product Name -->
                  <div class="bm-form-col-full">
                    <label class="bm-label" for="prod-name">
                      Product Name <span class="bm-required">*</span>
                    </label>
                    <input
                      id="prod-name"
                      type="text"
                      class="bm-input"
                      [class.bm-input-invalid]="isFieldInvalid('name')"
                      formControlName="name"
                      placeholder="e.g. Kerala Matta Rice (Palakkadan Vadi), Milma Ghee 500ml"
                      maxlength="120"
                    />
                    <div class="bm-field-meta">
                      <span class="bm-error-text" *ngIf="getFieldError('name') as err">{{ err }}</span>
                      <span class="bm-char-count">{{ productForm.get('name')?.value?.length || 0 }}/120</span>
                    </div>
                  </div>

                  <!-- Category Selection -->
                  <div class="bm-form-col-half">
                    <label class="bm-label" for="prod-category">
                      Category <span class="bm-required">*</span>
                    </label>
                    <select
                      id="prod-category"
                      class="bm-select"
                      [class.bm-input-invalid]="isFieldInvalid('category')"
                      formControlName="category"
                    >
                      @for (cat of categories; track cat) {
                        <option [value]="cat">{{ cat }}</option>
                      }
                    </select>
                    <span class="bm-error-text" *ngIf="getFieldError('category') as err">{{ err }}</span>
                  </div>

                  <!-- Brand / Producer -->
                  <div class="bm-form-col-half">
                    <label class="bm-label" for="prod-brand">
                      Brand / Manufacturer <span class="bm-optional">(Optional)</span>
                    </label>
                    <input
                      id="prod-brand"
                      type="text"
                      class="bm-input"
                      formControlName="brand"
                      placeholder="e.g. Milma, Eastern, Nirapara, Double Horse"
                      maxlength="60"
                    />
                    <!-- Quick Brand Suggestion Pills -->
                    <div class="bm-brand-pills">
                      @for (sug of brandSuggestions; track sug) {
                        <button type="button" class="bm-brand-pill" (click)="setBrand(sug)">
                          + {{ sug }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- SKU / Barcode -->
                  <div class="bm-form-col-full">
                    <div class="bm-label-row">
                      <label class="bm-label" for="prod-sku">
                        SKU / Internal Barcode <span class="bm-optional">(Optional)</span>
                      </label>
                      <button type="button" class="bm-link-btn" (click)="generateRandomSku()">
                        <lucide-icon [img]="SparklesIcon" [size]="12"></lucide-icon>
                        <span>Generate SKU</span>
                      </button>
                    </div>
                    <input
                      id="prod-sku"
                      type="text"
                      class="bm-input bm-mono-input"
                      formControlName="sku"
                      placeholder="e.g. BM-RIC-MATTA-01"
                      maxlength="40"
                    />
                    <span class="bm-hint">Unique identifier for shelf tracking and counter order pickups</span>
                  </div>
                </div>
              </bm-card>

              <!-- SECTION 2: PRICING & INVENTORY UNIT -->
              <bm-card title="Pricing & Sale Unit" subtitle="Configure group-buy selling price and packaging measure">
                <div class="bm-form-grid">
                  <!-- Group Buying Selling Price -->
                  <div class="bm-form-col-half">
                    <label class="bm-label" for="prod-price">
                      Selling Price (₹ INR) <span class="bm-required">*</span>
                    </label>
                    <div class="bm-input-affix-wrap">
                      <span class="bm-input-prefix">₹</span>
                      <input
                        id="prod-price"
                        type="number"
                        step="0.01"
                        min="1"
                        class="bm-input bm-input-affixed"
                        [class.bm-input-invalid]="isFieldInvalid('price')"
                        formControlName="price"
                        placeholder="0.00"
                      />
                    </div>
                    <span class="bm-error-text" *ngIf="getFieldError('price') as err">{{ err }}</span>
                    <span class="bm-hint">Final standard price charged to customers before group pool discounts</span>
                  </div>

                  <!-- Sale Unit Measure -->
                  <div class="bm-form-col-half">
                    <label class="bm-label" for="prod-unit">
                      Unit of Measure <span class="bm-required">*</span>
                    </label>
                    <select
                      id="prod-unit"
                      class="bm-select"
                      [class.bm-input-invalid]="isFieldInvalid('unit')"
                      formControlName="unit"
                    >
                      @for (u of units; track u.value) {
                        <option [value]="u.value">{{ u.label }}</option>
                      }
                    </select>
                    <span class="bm-error-text" *ngIf="getFieldError('unit') as err">{{ err }}</span>
                    <span class="bm-hint">Pricing will be displayed as ₹{{ productForm.get('price')?.value || 0 }} / {{ productForm.get('unit')?.value || 'unit' }}</span>
                  </div>
                </div>
              </bm-card>

              <!-- SECTION 3: DETAILED DESCRIPTION -->
              <bm-card title="Description & Specifications" subtitle="Provide customer details, origin, and storage guidelines">
                <div class="bm-form-grid">
                  <div class="bm-form-col-full">
                    <label class="bm-label" for="prod-desc">
                      Detailed Description <span class="bm-required">*</span>
                    </label>
                    <textarea
                      id="prod-desc"
                      rows="5"
                      class="bm-textarea"
                      [class.bm-input-invalid]="isFieldInvalid('description')"
                      formControlName="description"
                      placeholder="Describe the product quality, source/origin in Kerala, packaging specifications, expiration/shelf life, or dietary tags..."
                      maxlength="2000"
                    ></textarea>
                    <div class="bm-field-meta">
                      <span class="bm-error-text" *ngIf="getFieldError('description') as err">{{ err }}</span>
                      <span class="bm-char-count">{{ productForm.get('description')?.value?.length || 0 }}/2000</span>
                    </div>
                  </div>
                </div>
              </bm-card>
            </form>

            <!-- SECTION 4: PHOTO UPLOAD & MEDIA GALLERY -->
            <bm-card
              title="Product Photos & Gallery"
              subtitle="High-quality storefront images (At least 1 image is required for ACTIVE catalogue status)"
            >
              <!-- Cloudinary Configuration Notice if unconfigured -->
              @if (!cloudinaryService.isConfigured()) {
                <div class="bm-cloudinary-notice" role="alert">
                  <lucide-icon [img]="AlertTriangleIcon" [size]="18" class="text-warning"></lucide-icon>
                  <div>
                    <strong>Cloudinary Direct Upload Not Configured</strong>
                    <p>
                      You can paste external image URLs below, or configure <code>CLOUDINARY_CLOUD_NAME</code>
                      and <code>CLOUDINARY_UPLOAD_PRESET</code> in your <code>.env</code> file.
                    </p>
                  </div>
                </div>
              }

              <!-- Upload Drag & Drop Zone -->
              <div
                class="bm-dropzone"
                [class.bm-dropzone-active]="imageDragActive()"
                [class.bm-dropzone-disabled]="isUploadingImage()"
                (dragover)="onImageDragOver($event)"
                (dragleave)="imageDragActive.set(false)"
                (drop)="onImageDrop($event)"
              >
                <input
                  #fileInput
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="bm-file-hidden"
                  (change)="onImageFileSelected($event)"
                  [disabled]="isUploadingImage()"
                />

                <div class="bm-dropzone-content">
                  <div class="bm-dropzone-icon">
                    @if (isUploadingImage()) {
                      <lucide-icon [img]="RefreshIcon" [size]="32" class="bm-spin text-primary"></lucide-icon>
                    } @else {
                      <lucide-icon [img]="UploadIcon" [size]="32" class="text-primary"></lucide-icon>
                    }
                  </div>
                  <div class="bm-dropzone-text">
                    <strong>{{ isUploadingImage() ? 'Uploading image to Cloudinary...' : 'Click to upload or drag & drop product photos' }}</strong>
                    <p>PNG, JPG, or WebP up to 10MB (recommended 800×800 square or 4:3 ratio)</p>
                  </div>
                  <div class="bm-dropzone-buttons">
                    <bm-button
                      variant="outline"
                      size="sm"
                      (btnClick)="fileInput.click()"
                      [disabled]="isUploadingImage()"
                    >
                      <lucide-icon [img]="ImageIcon" [size]="14" bmLeading></lucide-icon>
                      <span>Select Photo from Device</span>
                    </bm-button>
                  </div>
                </div>
              </div>

              <!-- Selected File Staging Bar (if selected before upload) -->
              @if (selectedImageFile()) {
                <div class="bm-staged-upload-bar">
                  <div class="bm-staged-preview-wrap">
                    @if (imagePreviewUrl()) {
                      <img [src]="imagePreviewUrl()" alt="Preview" class="bm-staged-img" />
                    }
                    <div class="bm-staged-details">
                      <span class="bm-staged-name">{{ selectedImageFile()!.name }}</span>
                      <span class="bm-staged-size">{{ formatBytes(selectedImageFile()!.size) }}</span>
                    </div>
                  </div>
                  <div class="bm-staged-actions">
                    <bm-button variant="outline" size="sm" (btnClick)="clearSelectedImage()" [disabled]="isUploadingImage()">
                      <span>Cancel</span>
                    </bm-button>
                    <bm-button variant="primary" size="sm" (btnClick)="uploadSelectedImage()" [disabled]="isUploadingImage()">
                      <lucide-icon [img]="UploadIcon" [size]="14" bmLeading></lucide-icon>
                      <span>{{ isUploadingImage() ? 'Uploading...' : 'Confirm Upload' }}</span>
                    </bm-button>
                  </div>
                </div>
              }

              <!-- Direct URL Fallback Accordion / Input -->
              <div class="bm-url-upload-section">
                <span class="bm-url-divider">OR PASTE DIRECT IMAGE URL</span>
                <div class="bm-url-input-row">
                  <input
                    type="url"
                    class="bm-input"
                    [(ngModel)]="manualImageUrl"
                    placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                    [disabled]="isUploadingImage()"
                  />
                  <bm-button
                    variant="outline"
                    size="md"
                    (btnClick)="addManualImageUrl()"
                    [disabled]="!manualImageUrl.trim() || isUploadingImage()"
                  >
                    <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
                    <span>Attach URL</span>
                  </bm-button>
                </div>
              </div>

              <!-- Attached Photos Gallery -->
              <div class="bm-gallery-section">
                <div class="bm-gallery-header">
                  <h4 class="bm-gallery-title">
                    Attached Product Images ({{ currentImages().length }})
                  </h4>
                  @if (currentImages().length === 0) {
                    <span class="bm-gallery-warn">
                      <lucide-icon [img]="AlertTriangleIcon" [size]="14"></lucide-icon>
                      No photos attached yet
                    </span>
                  }
                </div>

                @if (currentImages().length === 0) {
                  <div class="bm-empty-gallery">
                    <lucide-icon [img]="ImageIcon" [size]="36" class="text-muted"></lucide-icon>
                    <p>No photos attached to this product yet.</p>
                    <span class="text-muted">Upload an image above to showcase your product in the storefront.</span>
                  </div>
                } @else {
                  <div class="bm-images-grid">
                    @for (img of currentImages(); track img.id || img.url; let idx = $index) {
                      <div class="bm-image-card" [class.bm-image-cover]="idx === 0">
                        <div class="bm-img-thumbnail-wrap">
                          <img [src]="img.url" [alt]="productForm.get('name')?.value || 'Product Image'" class="bm-img-thumbnail" />
                          @if (idx === 0) {
                            <span class="bm-cover-badge">Primary Cover</span>
                          }
                        </div>
                        <div class="bm-img-card-actions">
                          @if (idx > 0) {
                            <button
                              type="button"
                              class="bm-img-btn"
                              (click)="setAsPrimaryImage(idx)"
                              title="Set as primary cover image"
                            >
                              <lucide-icon [img]="SparklesIcon" [size]="13"></lucide-icon>
                              <span>Set as Cover</span>
                            </button>
                          }
                          <button
                            type="button"
                            class="bm-img-btn bm-img-btn-danger"
                            (click)="deleteProductImage(img, idx)"
                            title="Delete this image"
                          >
                            <lucide-icon [img]="Trash2Icon" [size]="13"></lucide-icon>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </bm-card>

            <!-- Bottom Actions Bar -->
            <div class="bm-form-bottom-actions">
              <div class="bm-bottom-left">
                <a routerLink="/store/products">
                  <bm-button variant="outline" size="md">
                    <span>Back to Products</span>
                  </bm-button>
                </a>
              </div>
              <div class="bm-bottom-right">
                <bm-button
                  variant="outline"
                  size="md"
                  (btnClick)="saveProduct('DRAFT')"
                  [disabled]="isSaving() || isLoadingProduct()"
                >
                  <lucide-icon [img]="ClockIcon" [size]="16" bmLeading></lucide-icon>
                  <span>Save as Draft</span>
                </bm-button>

                <bm-button
                  variant="primary"
                  size="md"
                  (btnClick)="saveProduct('ACTIVE')"
                  [disabled]="isSaving() || isLoadingProduct()"
                >
                  @if (isSaving()) {
                    <lucide-icon [img]="RefreshIcon" [size]="16" class="bm-spin" bmLeading></lucide-icon>
                  } @else {
                    <lucide-icon [img]="SaveIcon" [size]="16" bmLeading></lucide-icon>
                  }
                  <span>{{ isEditing() ? 'Save & Make Active' : 'Create & Publish' }}</span>
                </bm-button>
              </div>
            </div>
          </div>

          <!-- Right Sticky Column: Live Product Preview Card & Status Lifecycle -->
          <div class="bm-editor-sidebar">
            <!-- 1. LIVE STORE PREVIEW -->
            <bm-card title="Live Storefront Preview" subtitle="How this item appears to customers in store & group buying pools">
              <div class="bm-preview-card">
                <!-- Preview Thumbnail / Hero Image -->
                <div class="bm-preview-img-wrap">
                  @if (coverImageUrl()) {
                    <img [src]="coverImageUrl()" [alt]="previewTitle()" class="bm-preview-img" />
                  } @else {
                    <div class="bm-preview-placeholder">
                      <lucide-icon [img]="ShoppingBagIcon" [size]="48" class="text-muted"></lucide-icon>
                      <span>No image uploaded</span>
                    </div>
                  }
                  <div class="bm-preview-status-pill">
                    <bm-badge [variant]="getStatusBadgeVariant(previewStatus())" size="sm">
                      {{ previewStatus() }}
                    </bm-badge>
                  </div>
                </div>

                <!-- Preview Content -->
                <div class="bm-preview-body">
                  <div class="bm-preview-tags">
                    <span class="bm-preview-category">{{ previewCategory() }}</span>
                    @if (previewBrand()) {
                      <span class="bm-preview-brand">• {{ previewBrand() }}</span>
                    }
                  </div>

                  <h3 class="bm-preview-title">{{ previewTitle() }}</h3>

                  <div class="bm-preview-pricing">
                    <div class="bm-preview-price-box">
                      <span class="bm-preview-currency">₹</span>
                      <span class="bm-preview-amount">{{ previewPrice() }}</span>
                      <span class="bm-preview-unit">/ {{ previewUnit() }}</span>
                    </div>
                    @if (productForm.get('sku')?.value) {
                      <span class="bm-preview-sku">SKU: {{ productForm.get('sku')?.value }}</span>
                    }
                  </div>

                  <p class="bm-preview-desc">
                    {{ previewDescription() }}
                  </p>

                  <div class="bm-preview-footer">
                    <div class="bm-pool-ready-badge">
                      <lucide-icon [img]="ZapIcon" [size]="14"></lucide-icon>
                      <span>Group-Buy Pool Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </bm-card>

            <!-- 2. CATALOG STATUS & LIFECYCLE MANAGEMENT -->
            <bm-card title="Catalogue Lifecycle" subtitle="Control storefront visibility and customer discovery">
              <div class="bm-lifecycle-content">
                <div class="bm-lifecycle-row">
                  <span class="bm-lifecycle-label">Current State:</span>
                  <bm-badge [variant]="getStatusBadgeVariant(productStatus())" size="md">
                    {{ productStatus() }}
                  </bm-badge>
                </div>

                <div class="bm-status-explanation">
                  @if (productStatus() === 'ACTIVE') {
                    <p class="text-success">
                      <lucide-icon [img]="CheckCircle2Icon" [size]="14"></lucide-icon>
                      <strong>Active in Store:</strong> Customers can view this item in your store catalogue, add it to carts, and include it in group buying pools.
                    </p>
                  } @else if (productStatus() === 'DRAFT') {
                    <p class="text-secondary">
                      <lucide-icon [img]="ClockIcon" [size]="14"></lucide-icon>
                      <strong>Draft State:</strong> This product is saved privately. It will not be shown in customer searches until you publish it as Active.
                    </p>
                  } @else {
                    <p class="text-muted">
                      <lucide-icon [img]="ArchiveIcon" [size]="14"></lucide-icon>
                      <strong>Archived:</strong> Soft-deleted from public catalogue. You can restore it to Draft or Active at any time.
                    </p>
                  }
                </div>

                <div class="bm-lifecycle-actions">
                  @if (isEditing()) {
                    @if (productStatus() === 'ACTIVE') {
                      <button
                        type="button"
                        class="bm-action-pill-btn"
                        (click)="quickStatusChange('DRAFT')"
                        [disabled]="isSaving()"
                      >
                        <lucide-icon [img]="ClockIcon" [size]="14"></lucide-icon>
                        <span>Move Back to Draft</span>
                      </button>
                    } @else {
                      <button
                        type="button"
                        class="bm-action-pill-btn active-state"
                        (click)="quickStatusChange('ACTIVE')"
                        [disabled]="isSaving()"
                      >
                        <lucide-icon [img]="CheckCircle2Icon" [size]="14"></lucide-icon>
                        <span>Activate Product Now</span>
                      </button>
                    }
                  }
                </div>
              </div>
            </bm-card>

            <!-- 3. KERALA STORE RECOMMENDATIONS -->
            <bm-card title="Listing Guidelines" subtitle="Tips for maximum group-buy participation">
              <ul class="bm-guideline-list">
                <li>
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-success"></lucide-icon>
                  <span>Include standard Malayalam/Kerala local names (e.g. Palakkadan Matta, Nadan Velichenna)</span>
                </li>
                <li>
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-success"></lucide-icon>
                  <span>Attach at least 1 crisp photo showing actual packaging for quick counter pickup verification</span>
                </li>
                <li>
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-success"></lucide-icon>
                  <span>Ensure your base price is competitive to attract group pooling discounts</span>
                </li>
              </ul>
            </bm-card>
          </div>
        </div>
      }

      <!-- ARCHIVE CONFIRMATION MODAL -->
      @if (showArchiveModal()) {
        <div class="bm-modal-backdrop" (click)="closeArchiveModal()">
          <div class="bm-modal-box" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <div class="bm-modal-title-group">
                <div class="bm-modal-icon-badge danger">
                  <lucide-icon [img]="ArchiveIcon" [size]="20"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-modal-title">Archive Product</h3>
                  <p class="bm-modal-subtitle">Soft-delete item from your active store catalogue</p>
                </div>
              </div>
              <button type="button" class="bm-modal-close-btn" (click)="closeArchiveModal()">
                <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <div class="bm-modal-body">
              <p>
                Are you sure you want to archive <strong>{{ productForm.get('name')?.value || 'this product' }}</strong>?
              </p>
              <div class="bm-confirm-callout">
                <lucide-icon [img]="AlertTriangleIcon" [size]="18"></lucide-icon>
                <p>
                  Archiving removes the product from customer storefront discovery and active cart submissions. Existing confirmed orders will not be affected. You can restore this product at any time.
                </p>
              </div>
            </div>

            <div class="bm-modal-footer">
              <bm-button variant="outline" size="md" (btnClick)="closeArchiveModal()" [disabled]="isSaving()">
                <span>Cancel</span>
              </bm-button>
              <bm-button variant="danger" size="md" (btnClick)="confirmArchive()" [disabled]="isSaving()">
                @if (isSaving()) {
                  <lucide-icon [img]="RefreshIcon" [size]="16" class="bm-spin" bmLeading></lucide-icon>
                } @else {
                  <lucide-icon [img]="ArchiveIcon" [size]="16" bmLeading></lucide-icon>
                }
                <span>Confirm Archive</span>
              </bm-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bm-product-editor-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6, 24px);
    }

    .bm-header-actions-group {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3, 12px);
      flex-wrap: wrap;
    }

    // Skeleton
    .bm-skeleton-container {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6, 24px);
    }

    .bm-skeleton-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--bm-space-6, 24px);
    }

    // Alert Banner
    .bm-alert-banner {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3, 12px);
      padding: var(--bm-space-3, 12px) var(--bm-space-4, 16px);
      border-radius: var(--bm-radius-md, 8px);
      font-size: var(--bm-font-size-sm, 13px);
      margin-bottom: var(--bm-space-4, 16px);

      &.bm-alert-danger {
        background-color: #FEF2F2;
        border: 1px solid #FEE2E2;
        color: #991B1B;
      }

      span {
        flex: 1;
      }

      .bm-alert-close {
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 4px;
      }
    }

    // Editor 2-Column Layout
    .bm-editor-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-6, 24px);

      @media (min-width: 1024px) {
        grid-template-columns: 2fr 1fr;
        align-items: start;
      }
    }

    .bm-editor-main {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6, 24px);
    }

    .bm-editor-sidebar {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6, 24px);
      position: sticky;
      top: 80px;
    }

    // Form Grid
    .bm-product-form {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6, 24px);
    }

    .bm-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--bm-space-4, 16px);
    }

    .bm-form-col-full {
      grid-column: span 2;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-form-col-half {
      grid-column: span 2;
      display: flex;
      flex-direction: column;
      gap: 6px;

      @media (min-width: 640px) {
        grid-column: span 1;
      }
    }

    .bm-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-label {
      font-size: var(--bm-font-size-xs, 12px);
      font-weight: var(--bm-font-weight-semibold, 600);
      color: var(--bm-color-text-primary, #111827);
    }

    .bm-required {
      color: var(--bm-color-danger, #EF4444);
    }

    .bm-optional {
      font-size: 11px;
      font-weight: 400;
      color: var(--bm-color-text-muted, #9CA3AF);
    }

    .bm-input,
    .bm-select,
    .bm-textarea {
      width: 100%;
      padding: 9px 13px;
      border: 1px solid var(--bm-color-border, #E5E7EB);
      border-radius: var(--bm-radius-md, 8px);
      background-color: var(--bm-color-surface, #FFFFFF);
      color: var(--bm-color-text-primary, #111827);
      font-size: var(--bm-font-size-sm, 13px);
      font-family: inherit;
      transition: border-color var(--bm-transition-fast, 150ms), box-shadow var(--bm-transition-fast, 150ms);
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: var(--bm-color-primary, #176B50);
        box-shadow: 0 0 0 3px rgba(23, 107, 80, 0.12);
      }

      &.bm-input-invalid {
        border-color: var(--bm-color-danger, #EF4444);
        background-color: #FEF2F2;

        &:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
        }
      }
    }

    .bm-mono-input {
      font-family: var(--bm-font-mono, monospace);
      letter-spacing: 0.05em;
    }

    .bm-input-affix-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .bm-input-prefix {
      position: absolute;
      left: 12px;
      font-weight: 600;
      color: var(--bm-color-text-secondary, #4B5563);
      font-size: 14px;
      pointer-events: none;
    }

    .bm-input-affixed {
      padding-left: 28px;
    }

    .bm-textarea {
      resize: vertical;
      line-height: 1.5;
    }

    .bm-field-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
    }

    .bm-error-text {
      color: var(--bm-color-danger, #EF4444);
      font-size: 11px;
    }

    .bm-char-count {
      color: var(--bm-color-text-muted, #9CA3AF);
      font-size: 11px;
      margin-left: auto;
    }

    .bm-hint {
      font-size: 11px;
      color: var(--bm-color-text-muted, #9CA3AF);
    }

    .bm-link-btn {
      background: transparent;
      border: none;
      padding: 0;
      color: var(--bm-color-primary, #176B50);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover {
        text-decoration: underline;
      }
    }

    .bm-brand-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .bm-brand-pill {
      background: var(--bm-color-surface-subtle, #F9FAFB);
      border: 1px solid var(--bm-color-border, #E5E7EB);
      border-radius: 9999px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 500;
      color: var(--bm-color-text-secondary, #4B5563);
      cursor: pointer;
      transition: all var(--bm-transition-fast, 150ms);

      &:hover {
        background: #E6F4ED;
        border-color: var(--bm-color-primary, #176B50);
        color: var(--bm-color-primary, #176B50);
      }
    }

    // Photos & Media Manager
    .bm-cloudinary-notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: var(--bm-radius-md, 8px);
      font-size: 12px;
      color: #92400E;
      margin-bottom: 16px;

      code {
        font-family: var(--bm-font-mono, monospace);
        background: #FEF3C7;
        padding: 1px 4px;
        border-radius: 4px;
      }
    }

    .bm-dropzone {
      border: 2px dashed var(--bm-color-border, #E5E7EB);
      border-radius: var(--bm-radius-lg, 12px);
      padding: 28px 20px;
      text-align: center;
      background: var(--bm-color-surface-subtle, #F9FAFB);
      transition: all var(--bm-transition-fast, 150ms);
      cursor: pointer;

      &:hover,
      &.bm-dropzone-active {
        border-color: var(--bm-color-primary, #176B50);
        background: #F0FDF4;
      }

      &.bm-dropzone-disabled {
        opacity: 0.6;
        pointer-events: none;
      }
    }

    .bm-file-hidden {
      display: none;
    }

    .bm-dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .bm-dropzone-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #E6F4ED;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bm-dropzone-text {
      strong {
        display: block;
        font-size: var(--bm-font-size-sm, 13px);
        color: var(--bm-color-text-primary, #111827);
        margin-bottom: 2px;
      }

      p {
        font-size: 11px;
        color: var(--bm-color-text-muted, #9CA3AF);
        margin: 0;
      }
    }

    .bm-staged-upload-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: #E6F4ED;
      border: 1px solid #A7F3D0;
      border-radius: var(--bm-radius-md, 8px);
      margin-top: 14px;
    }

    .bm-staged-preview-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bm-staged-img {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid #10B981;
    }

    .bm-staged-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-staged-name {
      font-size: 12px;
      font-weight: 600;
      color: #065F46;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bm-staged-size {
      font-size: 11px;
      color: #047857;
    }

    .bm-staged-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    // URL Upload
    .bm-url-upload-section {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--bm-color-border, #E5E7EB);
    }

    .bm-url-divider {
      display: block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--bm-color-text-muted, #9CA3AF);
      margin-bottom: 8px;
    }

    .bm-url-input-row {
      display: flex;
      gap: 8px;
    }

    // Gallery
    .bm-gallery-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--bm-color-border, #E5E7EB);
    }

    .bm-gallery-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .bm-gallery-title {
      font-size: var(--bm-font-size-sm, 13px);
      font-weight: 600;
      color: var(--bm-color-text-primary, #111827);
      margin: 0;
    }

    .bm-gallery-warn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #D97706;
    }

    .bm-empty-gallery {
      padding: 24px 16px;
      text-align: center;
      background: var(--bm-color-surface-subtle, #F9FAFB);
      border-radius: var(--bm-radius-md, 8px);
      border: 1px dashed var(--bm-color-border, #E5E7EB);

      p {
        font-size: 12px;
        font-weight: 500;
        margin: 6px 0 2px 0;
        color: var(--bm-color-text-secondary, #4B5563);
      }

      span {
        font-size: 11px;
      }
    }

    .bm-images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
    }

    .bm-image-card {
      border: 1px solid var(--bm-color-border, #E5E7EB);
      border-radius: var(--bm-radius-md, 8px);
      overflow: hidden;
      background: var(--bm-color-surface, #FFFFFF);
      display: flex;
      flex-direction: column;
      transition: all var(--bm-transition-fast, 150ms);

      &.bm-image-cover {
        border-color: var(--bm-color-primary, #176B50);
        box-shadow: 0 0 0 2px rgba(23, 107, 80, 0.15);
      }
    }

    .bm-img-thumbnail-wrap {
      position: relative;
      aspect-ratio: 1;
      background: #F3F4F6;
    }

    .bm-img-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-cover-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      background: var(--bm-color-primary, #176B50);
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .bm-img-card-actions {
      display: flex;
      flex-direction: column;
      padding: 6px;
      gap: 4px;
      background: var(--bm-color-surface, #FFFFFF);
    }

    .bm-img-btn {
      background: transparent;
      border: 1px solid var(--bm-color-border, #E5E7EB);
      border-radius: 4px;
      padding: 3px 6px;
      font-size: 10px;
      font-weight: 500;
      color: var(--bm-color-text-secondary, #4B5563);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all var(--bm-transition-fast, 150ms);

      &:hover {
        background: var(--bm-color-surface-subtle, #F9FAFB);
        color: var(--bm-color-text-primary, #111827);
      }

      &.bm-img-btn-danger {
        color: var(--bm-color-danger, #EF4444);

        &:hover {
          background: #FEF2F2;
          border-color: #FCA5A5;
        }
      }
    }

    // Bottom Actions
    .bm-form-bottom-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--bm-color-border, #E5E7EB);
      flex-wrap: wrap;
    }

    .bm-bottom-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    // SIDEBAR PREVIEW CARD
    .bm-preview-card {
      border: 1px solid var(--bm-color-border, #E5E7EB);
      border-radius: var(--bm-radius-lg, 12px);
      overflow: hidden;
      background: var(--bm-color-surface, #FFFFFF);
    }

    .bm-preview-img-wrap {
      position: relative;
      aspect-ratio: 16 / 10;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bm-preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-preview-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      span {
        font-size: 11px;
        color: var(--bm-color-text-muted, #9CA3AF);
      }
    }

    .bm-preview-status-pill {
      position: absolute;
      top: 10px;
      right: 10px;
    }

    .bm-preview-body {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bm-preview-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--bm-color-text-muted, #9CA3AF);
    }

    .bm-preview-category {
      font-weight: 600;
      color: var(--bm-color-primary, #176B50);
    }

    .bm-preview-brand {
      color: var(--bm-color-text-secondary, #4B5563);
    }

    .bm-preview-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--bm-color-text-primary, #111827);
      margin: 0;
      line-height: 1.35;
    }

    .bm-preview-pricing {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .bm-preview-price-box {
      display: flex;
      align-items: baseline;
      gap: 2px;
      color: var(--bm-color-text-primary, #111827);
    }

    .bm-preview-currency {
      font-size: 14px;
      font-weight: 600;
    }

    .bm-preview-amount {
      font-size: 20px;
      font-weight: 700;
    }

    .bm-preview-unit {
      font-size: 12px;
      color: var(--bm-color-text-secondary, #4B5563);
      margin-left: 3px;
    }

    .bm-preview-sku {
      font-family: var(--bm-font-mono, monospace);
      font-size: 10px;
      color: var(--bm-color-text-muted, #9CA3AF);
    }

    .bm-preview-desc {
      font-size: 12px;
      color: var(--bm-color-text-secondary, #4B5563);
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .bm-preview-footer {
      padding-top: 10px;
      border-top: 1px solid var(--bm-color-border, #E5E7EB);
    }

    .bm-pool-ready-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #176B50;
      background: #E6F4ED;
      padding: 4px 8px;
      border-radius: 6px;
    }

    // Lifecycle Card
    .bm-lifecycle-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bm-lifecycle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-lifecycle-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--bm-color-text-secondary, #4B5563);
    }

    .bm-status-explanation {
      font-size: 12px;
      line-height: 1.45;

      p {
        margin: 0;
        display: flex;
        align-items: flex-start;
        gap: 6px;
      }
    }

    .bm-lifecycle-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bm-action-pill-btn {
      width: 100%;
      padding: 8px 12px;
      border-radius: var(--bm-radius-md, 8px);
      border: 1px solid var(--bm-color-border, #E5E7EB);
      background: var(--bm-color-surface, #FFFFFF);
      color: var(--bm-color-text-primary, #111827);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all var(--bm-transition-fast, 150ms);

      &:hover {
        background: var(--bm-color-surface-subtle, #F9FAFB);
      }

      &.active-state {
        background: #E6F4ED;
        border-color: #A7F3D0;
        color: #065F46;

        &:hover {
          background: #D1FAE5;
        }
      }
    }

    .bm-guideline-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 12px;
        color: var(--bm-color-text-secondary, #4B5563);
        line-height: 1.4;
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
      padding: var(--bm-space-4, 16px);
      overflow-y: auto;
    }

    .bm-modal-box {
      background: #FFFFFF;
      border-radius: var(--bm-radius-xl, 12px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 500px;
      overflow: hidden;
      margin: auto;
    }

    .bm-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--bm-color-border, #E5E7EB);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-modal-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bm-modal-icon-badge {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #E6F4ED;
      color: #176B50;

      &.danger {
        background: #FEF2F2;
        color: #DC2626;
      }
    }

    .bm-modal-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      color: var(--bm-color-text-primary, #111827);
    }

    .bm-modal-subtitle {
      font-size: 12px;
      color: var(--bm-color-text-muted, #9CA3AF);
      margin: 2px 0 0 0;
    }

    .bm-modal-close-btn {
      background: transparent;
      border: none;
      color: var(--bm-color-text-muted, #9CA3AF);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        background: var(--bm-color-surface-subtle, #F9FAFB);
        color: var(--bm-color-text-primary, #111827);
      }
    }

    .bm-modal-body {
      padding: 20px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--bm-color-text-secondary, #4B5563);
    }

    .bm-confirm-callout {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 8px;
      color: #92400E;
      font-size: 12px;
      margin-top: 12px;

      p {
        margin: 0;
      }
    }

    .bm-modal-footer {
      padding: 14px 20px;
      background: var(--bm-color-surface-subtle, #F9FAFB);
      border-top: 1px solid var(--bm-color-border, #E5E7EB);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
  `],
})
export class ProductEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  readonly cloudinaryService = inject(CloudinaryService);

  // Lucide Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly SaveIcon = Save;
  readonly UploadIcon = Upload;
  readonly Trash2Icon = Trash2;
  readonly ImageIcon = ImageIcon;
  readonly ShoppingBagIcon = ShoppingBag;
  readonly SparklesIcon = Sparkles;
  readonly CheckIcon = Check;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly AlertCircleIcon = AlertCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly XIcon = X;
  readonly ExternalLinkIcon = ExternalLink;
  readonly LayersIcon = Layers;
  readonly TagIcon = Tag;
  readonly EyeIcon = Eye;
  readonly RefreshIcon = RefreshCw;
  readonly PlusIcon = Plus;
  readonly ArchiveIcon = Archive;
  readonly ClockIcon = Clock;
  readonly ZapIcon = Zap;

  // Constants
  readonly categories = PRODUCT_CATEGORIES;
  readonly units = PRODUCT_UNITS;
  readonly brandSuggestions = ['Milma', 'Eastern', 'Nirapara', 'Double Horse', 'Kitchen Treasures', 'Brahmins', 'Kera'];

  // State Signals
  readonly isEditing = signal<boolean>(false);
  readonly productId = signal<string | null>(null);
  readonly isLoadingProduct = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly productStatus = signal<ProductStatus>('DRAFT');
  readonly currentImages = signal<ProductImage[]>([]);

  // Media upload state
  readonly isUploadingImage = signal<boolean>(false);
  readonly imageDragActive = signal<boolean>(false);
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  manualImageUrl = '';

  // Archive modal
  readonly showArchiveModal = signal<boolean>(false);

  // Form definition
  readonly productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    category: [PRODUCT_CATEGORIES[0], [Validators.required]],
    brand: ['', [Validators.maxLength(60)]],
    sku: ['', [Validators.maxLength(40)]],
    price: [null, [Validators.required, Validators.min(1)]],
    unit: ['piece', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(2000)]],
  });

  // Breadcrumbs
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const list: BreadcrumbItem[] = [
      { label: 'Dashboard', url: '/dashboard' },
      { label: 'Products', url: '/store/products' },
    ];
    if (this.isEditing()) {
      const name = this.productForm.get('name')?.value || 'Edit Product';
      list.push({ label: name });
    } else {
      list.push({ label: 'New Product' });
    }
    return list;
  });

  // Preview Card computeds
  readonly productNameHeader = computed(() => this.productForm.get('name')?.value);
  readonly previewTitle = computed(() => this.productForm.get('name')?.value || 'Untitled Product');
  readonly previewCategory = computed(() => this.productForm.get('category')?.value || 'Grocery');
  readonly previewBrand = computed(() => this.productForm.get('brand')?.value);
  readonly previewPrice = computed(() => {
    const val = this.productForm.get('price')?.value;
    return val !== null && val !== undefined && val !== '' ? Number(val).toFixed(2) : '0.00';
  });
  readonly previewUnit = computed(() => this.productForm.get('unit')?.value || 'piece');
  readonly previewDescription = computed(() => {
    return this.productForm.get('description')?.value || 'Enter a product description to see how it looks to customers...';
  });
  readonly previewStatus = computed(() => this.productStatus());
  readonly coverImageUrl = computed(() => {
    const imgs = this.currentImages();
    if (imgs.length > 0) return imgs[0].url;
    return null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditing.set(true);
      this.productId.set(id);
      this.loadProductDetails(id);
    } else {
      this.isEditing.set(false);
      this.productStatus.set('DRAFT');
    }
  }

  // =========================================================================
  // Data Loading
  // =========================================================================

  private loadProductDetails(id: string): void {
    this.isLoadingProduct.set(true);
    this.errorMessage.set(null);

    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.isLoadingProduct.set(false);
        this.productStatus.set(product.status);
        this.currentImages.set(product.images || []);

        this.productForm.patchValue({
          name: product.name,
          category: product.category,
          brand: product.brand || '',
          sku: product.sku || '',
          price: product.price,
          unit: product.unit,
          description: product.description,
        });
      },
      error: (err: ApiError) => {
        this.isLoadingProduct.set(false);
        this.errorMessage.set(err.message || 'Failed to load product details from server.');
        this.toast.danger('Product not found or failed to load.');
      },
    });
  }

  // =========================================================================
  // Save & Publish
  // =========================================================================

  saveProduct(targetStatus?: ProductStatus): void {
    if (this.productForm.invalid || this.isSaving()) {
      this.productForm.markAllAsTouched();
      this.errorMessage.set('Please resolve all validation errors before saving.');
      return;
    }

    const desiredStatus = targetStatus || this.productStatus();

    // Validation: Active status requires at least 1 image
    if (desiredStatus === 'ACTIVE' && this.currentImages().length === 0) {
      this.errorMessage.set('Cannot set product status to ACTIVE: At least 1 product photo must be uploaded first.');
      this.toast.warning('Please upload at least 1 photo before activating this product.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formVal = this.productForm.value;
    const priceNum = Number(formVal.price);

    if (this.isEditing() && this.productId()) {
      const id = this.productId()!;
      this.productService
        .updateProduct(id, {
          name: formVal.name.trim(),
          description: formVal.description.trim(),
          category: formVal.category,
          price: priceNum,
          unit: formVal.unit,
          brand: formVal.brand ? formVal.brand.trim() : undefined,
          sku: formVal.sku ? formVal.sku.trim() : undefined,
          status: desiredStatus,
        })
        .subscribe({
          next: (updated) => {
            this.isSaving.set(false);
            this.productStatus.set(updated.status);
            this.toast.success(`Product '${updated.name}' updated successfully.`);
            this.router.navigate(['/store/products']);
          },
          error: (err: ApiError) => {
            this.isSaving.set(false);
            this.errorMessage.set(err.message || 'Failed to update product details.');
          },
        });
    } else {
      this.productService
        .createProduct({
          name: formVal.name.trim(),
          description: formVal.description.trim(),
          category: formVal.category,
          price: priceNum,
          unit: formVal.unit,
          brand: formVal.brand ? formVal.brand.trim() : undefined,
          sku: formVal.sku ? formVal.sku.trim() : undefined,
        })
        .subscribe({
          next: (created) => {
            // If images were staged/uploaded prior to creation, attach them now
            const stagedImages = this.currentImages();
            if (stagedImages.length > 0) {
              this.productService
                .uploadImages(created.id, stagedImages.map((img) => ({ url: img.url })))
                .subscribe({
                  next: () => {
                    if (desiredStatus === 'ACTIVE') {
                      this.productService.updateProduct(created.id, { status: 'ACTIVE' }).subscribe({
                        next: () => {
                          this.isSaving.set(false);
                          this.router.navigate(['/store/products']);
                        },
                        error: () => {
                          this.isSaving.set(false);
                          this.router.navigate(['/store/products']);
                        },
                      });
                    } else {
                      this.isSaving.set(false);
                      this.router.navigate(['/store/products']);
                    }
                  },
                  error: () => {
                    this.isSaving.set(false);
                    this.router.navigate(['/store/products']);
                  },
                });
            } else {
              this.isSaving.set(false);
              this.router.navigate(['/store/products']);
            }
          },
          error: (err: ApiError) => {
            this.isSaving.set(false);
            this.errorMessage.set(err.message || 'Failed to create product.');
          },
        });
    }
  }

  // =========================================================================
  // Quick Status Actions
  // =========================================================================

  quickStatusChange(status: ProductStatus): void {
    if (!this.productId()) {
      this.productStatus.set(status);
      return;
    }

    if (status === 'ACTIVE' && this.currentImages().length === 0) {
      this.toast.warning('Cannot activate product. Please upload at least 1 photo first.');
      return;
    }

    this.isSaving.set(true);
    this.productService.updateProduct(this.productId()!, { status }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.productStatus.set(res.status);
        this.toast.success(`Product status changed to ${res.status}.`);
      },
      error: (err: ApiError) => {
        this.isSaving.set(false);
        this.toast.danger(err.message || 'Failed to update product status.');
      },
    });
  }

  // =========================================================================
  // Archive Modal Actions
  // =========================================================================

  openArchiveModal(): void {
    this.showArchiveModal.set(true);
  }

  closeArchiveModal(): void {
    this.showArchiveModal.set(false);
  }

  confirmArchive(): void {
    if (!this.productId()) return;
    this.isSaving.set(true);

    this.productService.archiveProduct(this.productId()!).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeArchiveModal();
        this.toast.info('Product archived successfully.');
        this.router.navigate(['/store/products']);
      },
      error: (err: ApiError) => {
        this.isSaving.set(false);
        this.toast.danger(err.message || 'Failed to archive product.');
      },
    });
  }

  // =========================================================================
  // Photo & Image Management
  // =========================================================================

  onImageDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.imageDragActive.set(true);
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.imageDragActive.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleImageFile(files[0]);
    }
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleImageFile(input.files[0]);
    }
  }

  private handleImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toast.danger('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toast.danger('Image size exceeds 10MB limit.');
      return;
    }
    this.selectedImageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  clearSelectedImage(): void {
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
  }

  uploadSelectedImage(): void {
    const file = this.selectedImageFile();
    if (!file || this.isUploadingImage()) return;

    this.isUploadingImage.set(true);

    this.cloudinaryService.uploadImage(file, 'buymass/products').subscribe({
      next: (uploadRes) => {
        const newImg: ProductImage = {
          id: 'temp-' + Date.now(),
          url: uploadRes.secure_url || uploadRes.url,
          uploadedAt: new Date(),
        };

        if (this.isEditing() && this.productId()) {
          // Attach directly to saved product
          this.productService
            .uploadImages(this.productId()!, [{ url: newImg.url }])
            .subscribe({
              next: (updatedProduct) => {
                this.currentImages.set(updatedProduct.images || []);
                this.clearSelectedImage();
                this.isUploadingImage.set(false);
                this.toast.success('Product image uploaded and saved!');
              },
              error: (err: ApiError) => {
                this.isUploadingImage.set(false);
                this.toast.danger(err.message || 'Failed to attach image to product.');
              },
            });
        } else {
          // Staged image for new product
          this.currentImages.update((imgs) => [...imgs, newImg]);
          this.clearSelectedImage();
          this.isUploadingImage.set(false);
          this.toast.success('Photo ready. It will be saved when creating the product.');
        }
      },
      error: (err: Error) => {
        this.isUploadingImage.set(false);
        this.toast.danger(err.message || 'Cloudinary upload failed.');
      },
    });
  }

  addManualImageUrl(): void {
    const url = this.manualImageUrl.trim();
    if (!url || this.isUploadingImage()) return;

    if (this.isEditing() && this.productId()) {
      this.isUploadingImage.set(true);
      this.productService.uploadImages(this.productId()!, [{ url }]).subscribe({
        next: (updated) => {
          this.currentImages.set(updated.images || []);
          this.manualImageUrl = '';
          this.isUploadingImage.set(false);
          this.toast.success('Image URL attached successfully!');
        },
        error: (err: ApiError) => {
          this.isUploadingImage.set(false);
          this.toast.danger(err.message || 'Failed to attach image URL.');
        },
      });
    } else {
      const newImg: ProductImage = {
        id: 'temp-' + Date.now(),
        url,
        uploadedAt: new Date(),
      };
      this.currentImages.update((imgs) => [...imgs, newImg]);
      this.manualImageUrl = '';
      this.toast.success('Photo URL added to draft gallery.');
    }
  }

  deleteProductImage(img: ProductImage, idx: number): void {
    if (this.isEditing() && this.productId() && img.id && !img.id.startsWith('temp-')) {
      this.productService.deleteImage(this.productId()!, img.id).subscribe({
        next: (updated) => {
          this.currentImages.set(updated.images || []);
          this.toast.info('Product image removed.');
        },
        error: (err: ApiError) => {
          this.toast.danger(err.message || 'Failed to delete product image.');
        },
      });
    } else {
      this.currentImages.update((imgs) => imgs.filter((_, i) => i !== idx));
      this.toast.info('Photo removed from staging.');
    }
  }

  setAsPrimaryImage(idx: number): void {
    this.currentImages.update((imgs) => {
      if (idx <= 0 || idx >= imgs.length) return imgs;
      const copy = [...imgs];
      const selected = copy.splice(idx, 1)[0];
      return [selected, ...copy];
    });
    this.toast.info('Cover photo updated.');
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  setBrand(brandName: string): void {
    this.productForm.patchValue({ brand: brandName });
  }

  generateRandomSku(): void {
    const cat = this.productForm.get('category')?.value || 'GEN';
    const prefix = cat.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.productForm.patchValue({ sku: `BM-${prefix}-${rand}` });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.productForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty));
  }

  getFieldError(field: string): string | null {
    const ctrl = this.productForm.get(field);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return null;

    if (ctrl.errors['required']) return 'This field is required.';
    if (ctrl.errors['minlength']) return `Must be at least ${ctrl.errors['minlength'].requiredLength} characters.`;
    if (ctrl.errors['maxlength']) return `Cannot exceed ${ctrl.errors['maxlength'].requiredLength} characters.`;
    if (ctrl.errors['min']) return 'Price must be greater than zero.';
    return 'Invalid value.';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getStatusBadgeVariant(status: ProductStatus): 'success' | 'warning' | 'neutral' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'warning';
      case 'ARCHIVED': return 'neutral';
    }
  }
}
