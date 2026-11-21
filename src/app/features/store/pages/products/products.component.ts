import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  CloudUpload,
  Edit3,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import {
  CreateProductRequest,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  ProductImage,
  ProductRecord,
  ProductStatus,
  UpdateProductRequest,
} from '../../../../core/models/product.model';
import { ApiError } from '../../../../core/services/api-client.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'bm-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    PageHeaderComponent,
    SkeletonComponent,
    CardComponent,
    EmptyStateComponent,
    ButtonComponent,
    BadgeComponent,
    InputComponent,
    SelectComponent,
  ],
  template: `
    <div class="bm-products-page">
      <bm-page-header
        title="Product Catalogue"
        subtitle="Manage store inventory, regular retail pricing, and group-buying pool offerings"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Store Management', url: '/store/overview' },
          { label: 'Products' }
        ]"
      >
        <div bmHeaderActions class="bm-header-actions-group">
          <bm-button variant="outline" size="md" (btnClick)="loadProducts()">
            <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading></lucide-icon>
            <span>Refresh</span>
          </bm-button>

          @if (isStoreApproved()) {
            <a routerLink="/store/products/new">
              <bm-button variant="primary" size="md">
                <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
                <span>Add New Product</span>
              </bm-button>
            </a>
          }
        </div>
      </bm-page-header>

      <!-- Store Not Approved Notice -->
      @if (!isCheckingStore() && !isStoreApproved()) {
        <div class="bm-unapproved-banner" role="alert">
          <div class="bm-unapproved-content">
            <div class="bm-unapproved-icon">
              <lucide-icon [img]="ShieldAlertIcon" [size]="22"></lucide-icon>
            </div>
            <div class="bm-unapproved-text">
              <strong>Store Onboarding Approval Required</strong>
              <p>
                Your store <em>{{ authService.currentMerchant()?.storeName || 'application' }}</em> is in
                <strong>{{ authService.currentMerchant()?.status || 'PENDING' }}</strong> status.
                Products can be added and published as soon as the BuyMass territory administration approves your storefront.
              </p>
            </div>
          </div>
          <div class="bm-unapproved-actions">
            @if (authService.userRole() === 'ADMIN' && authService.currentMerchant()) {
              <a [routerLink]="['/admin/merchants', authService.currentMerchant()!.id]">
                <bm-button variant="primary" size="sm">
                  <lucide-icon [img]="ShieldCheckIcon" [size]="14" bmLeading></lucide-icon>
                  <span>Review & Approve Store (Admin)</span>
                </bm-button>
              </a>
            } @else {
              <a routerLink="/store/overview">
                <bm-button variant="outline" size="sm">
                  <span>View Store Details</span>
                  <lucide-icon [img]="ArrowRightIcon" [size]="14"></lucide-icon>
                </bm-button>
              </a>
            }
          </div>
        </div>
      }

      <!-- Status Filter Tabs -->
      <div class="bm-tabs-row">
        <div class="bm-filter-tabs">
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === undefined"
            (click)="onFilterStatus(undefined)"
          >
            <span>All Products</span>
            <span class="bm-count-pill">{{ totalCount() }}</span>
          </button>

          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'ACTIVE'"
            (click)="onFilterStatus('ACTIVE')"
          >
            <span>Active</span>
            <span class="bm-count-pill bm-count-success">{{ activeCount() }}</span>
          </button>

          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'DRAFT'"
            (click)="onFilterStatus('DRAFT')"
          >
            <span>Drafts</span>
            <span class="bm-count-pill bm-count-warning">{{ draftCount() }}</span>
          </button>

          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'ARCHIVED'"
            (click)="onFilterStatus('ARCHIVED')"
          >
            <span>Archived</span>
            <span class="bm-count-pill">{{ archivedCount() }}</span>
          </button>
        </div>

        <!-- Search & Category Filters -->
        <div class="bm-toolbar-filters">
          <div class="bm-search-wrap">
            <lucide-icon [img]="SearchIcon" [size]="16" class="bm-search-icon"></lucide-icon>
            <input
              type="text"
              placeholder="Search products by name, brand, SKU..."
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              class="bm-search-input"
            />
            @if (searchQuery()) {
              <button type="button" class="bm-clear-search" (click)="clearSearch()">
                <lucide-icon [img]="XIcon" [size]="14"></lucide-icon>
              </button>
            }
          </div>

          <div class="bm-category-filter-wrap">
            <bm-select
              [options]="categoryFilterOptions"
              [value]="selectedCategory()"
              (valueChange)="onCategoryFilterChange($event)"
              placeholder="All Categories"
              [searchable]="true"
            ></bm-select>
          </div>
        </div>
      </div>

      <!-- Main Products Card -->
      <bm-card>
        @if (isLoading()) {
          <div class="bm-skeleton-table-wrapper" aria-label="Loading products">
            <div class="bm-skeleton-table-header">
              <bm-skeleton width="140px" height="14px"></bm-skeleton>
              <bm-skeleton width="100px" height="14px"></bm-skeleton>
              <bm-skeleton width="90px" height="14px"></bm-skeleton>
              <bm-skeleton width="80px" height="14px"></bm-skeleton>
              <bm-skeleton width="60px" height="14px"></bm-skeleton>
            </div>
            <bm-skeleton variant="table-row" [count]="6" [columns]="6"></bm-skeleton>
          </div>
        } @else if (filteredProducts().length === 0) {
          <bm-empty-state
            [title]="emptyStateTitle()"
            [description]="emptyStateDescription()"
          >
            <div bmEmptyIcon>
              <lucide-icon [img]="ShoppingBagIcon" [size]="40"></lucide-icon>
            </div>
            @if (isStoreApproved()) {
              <div bmEmptyActions style="margin-top: 14px;">
                <a routerLink="/store/products/new">
                  <bm-button variant="primary" size="md">
                    <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
                    <span>Create First Product</span>
                  </bm-button>
                </a>
              </div>
            }
          </bm-empty-state>
        } @else {
          <!-- Products Table -->
          <div class="bm-table-wrapper">
            <table class="bm-table" aria-label="Products Catalogue Table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price / Unit</th>
                  <th>Status</th>
                  <th>Images</th>
                  <th>SKU / Brand</th>
                  <th class="bm-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of filteredProducts(); track prod.id) {
                  <tr class="bm-table-row">
                    <!-- Product Title, Image & Description -->
                    <td>
                      <div class="bm-product-meta-cell">
                        <a
                          [routerLink]="['/store/products', prod.id, 'edit']"
                          class="bm-product-thumb"
                          title="Manage product details & photos"
                        >
                          @if (prod.images && prod.images.length > 0) {
                            <img [src]="prod.images[0].url" [alt]="prod.name" class="bm-thumb-img" />
                            @if (prod.images.length > 1) {
                              <span class="bm-thumb-badge">{{ prod.images.length }}</span>
                            }
                          } @else {
                            <div class="bm-thumb-placeholder">
                              <lucide-icon [img]="ImageIcon" [size]="20"></lucide-icon>
                            </div>
                          }
                        </a>
                        <div class="bm-product-title-group">
                          <a [routerLink]="['/store/products', prod.id, 'edit']" class="bm-product-name-link">
                            <strong class="bm-product-name">{{ prod.name }}</strong>
                          </a>
                          <p class="bm-product-desc">{{ prod.description }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Category -->
                    <td>
                      <span class="bm-category-tag">{{ prod.category }}</span>
                    </td>

                    <!-- Price & Unit -->
                    <td>
                      <div class="bm-price-cell">
                        <span class="bm-price-val">₹{{ prod.price | number:'1.2-2' }}</span>
                        <span class="bm-price-unit">/ {{ prod.unit }}</span>
                      </div>
                    </td>

                    <!-- Status -->
                    <td>
                      <bm-badge [variant]="getStatusBadgeVariant(prod.status)" size="sm">
                        {{ prod.status }}
                      </bm-badge>
                    </td>

                    <!-- Image Count & Manage Images Link -->
                    <td>
                      <button
                        type="button"
                        class="bm-images-btn"
                        (click)="openMediaModal(prod)"
                        title="Add or remove photos for this product"
                      >
                        <lucide-icon [img]="CameraIcon" [size]="14"></lucide-icon>
                        <span>{{ prod.images.length || 0 }} Photo{{ (prod.images.length || 0) === 1 ? '' : 's' }}</span>
                      </button>
                    </td>

                    <!-- SKU / Brand -->
                    <td>
                      <div class="bm-sku-brand-cell">
                        @if (prod.sku) {
                          <span class="bm-sku-code">{{ prod.sku }}</span>
                        }
                        @if (prod.brand) {
                          <span class="bm-brand-subtext">{{ prod.brand }}</span>
                        }
                        @if (!prod.sku && !prod.brand) {
                          <span class="bm-muted-text">—</span>
                        }
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="bm-text-right">
                      <div class="bm-actions-cell">
                        <!-- Quick Status Toggle -->
                        @if (prod.status === 'DRAFT') {
                          <button
                            type="button"
                            class="bm-icon-action-btn bm-btn-activate"
                            (click)="toggleProductActive(prod)"
                            title="Publish product to Active"
                          >
                            <lucide-icon [img]="CheckCircleIcon" [size]="16"></lucide-icon>
                          </button>
                        } @else if (prod.status === 'ACTIVE') {
                          <button
                            type="button"
                            class="bm-icon-action-btn bm-btn-draft"
                            (click)="toggleProductDraft(prod)"
                            title="Return product to Draft"
                          >
                            <lucide-icon [img]="ClockIcon" [size]="16"></lucide-icon>
                          </button>
                        } @else if (prod.status === 'ARCHIVED') {
                          <button
                            type="button"
                            class="bm-icon-action-btn bm-btn-restore"
                            (click)="toggleProductDraft(prod)"
                            title="Restore product to Draft"
                          >
                            <lucide-icon [img]="RefreshIcon" [size]="16"></lucide-icon>
                          </button>
                        }

                        <!-- Edit Product -->
                        <a [routerLink]="['/store/products', prod.id, 'edit']" class="bm-icon-link">
                          <button
                            type="button"
                            class="bm-icon-action-btn"
                            title="Edit product details & photos"
                          >
                            <lucide-icon [img]="EditIcon" [size]="16"></lucide-icon>
                          </button>
                        </a>

                        <!-- Archive Product (if not already archived) -->
                        @if (prod.status !== 'ARCHIVED') {
                          <button
                            type="button"
                            class="bm-icon-action-btn bm-btn-danger"
                            (click)="openArchiveConfirm(prod)"
                            title="Archive this product"
                          >
                            <lucide-icon [img]="ArchiveIcon" [size]="16"></lucide-icon>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          @if (totalPages() > 1) {
            <div class="bm-pagination-footer">
              <span class="bm-page-info">
                Showing Page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong>
                ({{ totalCount() }} total products)
              </span>
              <div class="bm-pagination-controls">
                <bm-button
                  variant="outline"
                  size="sm"
                  [disabled]="currentPage() <= 1 || isLoading()"
                  (btnClick)="goToPage(currentPage() - 1)"
                >
                  Previous
                </bm-button>
                <bm-button
                  variant="outline"
                  size="sm"
                  [disabled]="currentPage() >= totalPages() || isLoading()"
                  (btnClick)="goToPage(currentPage() + 1)"
                >
                  Next
                </bm-button>
              </div>
            </div>
          }
        }
      </bm-card>

      <!-- ========================================================================= -->
      <!-- Create / Edit Product Modal -->
      <!-- ========================================================================= -->
      @if (showProductModal()) {
        <div class="bm-modal-backdrop" (click)="closeProductModal()">
          <div class="bm-modal-box bm-product-modal" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <div class="bm-modal-title-group">
                <div class="bm-modal-icon-badge">
                  <lucide-icon [img]="ShoppingBagIcon" [size]="20"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-modal-title">
                    {{ isEditing() ? 'Edit Product Details' : 'Add New Store Product' }}
                  </h3>
                  <p class="bm-modal-subtitle">
                    {{ isEditing() ? 'Update pricing, category, and specifications' : 'Create a draft catalog item to include in community group buys' }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="bm-modal-close-btn"
                (click)="closeProductModal()"
                aria-label="Close dialog"
              >
                <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <form [formGroup]="productForm" (ngSubmit)="onSaveProduct()" class="bm-modal-body">
              <div class="bm-form-grid">
                <!-- Product Name -->
                <div class="bm-col-2">
                  <bm-input
                    id="prod-name"
                    label="Product Name"
                    placeholder="e.g. Palakkadan Matta Rice (5 kg pack)"
                    [required]="true"
                    formControlName="name"
                    [error]="getFormError('name')"
                  ></bm-input>
                </div>

                <!-- Category -->
                <div>
                  <bm-select
                    id="prod-cat"
                    label="Product Category"
                    [required]="true"
                    [options]="categoryOptions"
                    placeholder="Select category"
                    [searchable]="true"
                    formControlName="category"
                    [error]="getFormError('category')"
                  ></bm-select>
                </div>

                <!-- Unit of Measure -->
                <div>
                  <bm-select
                    id="prod-unit"
                    label="Unit of Measurement"
                    [required]="true"
                    [options]="unitOptions"
                    placeholder="Select unit"
                    [searchable]="false"
                    formControlName="unit"
                    [error]="getFormError('unit')"
                  ></bm-select>
                </div>

                <!-- Regular Retail Price -->
                <div>
                  <bm-input
                    id="prod-price"
                    label="Regular Retail Price (₹)"
                    type="number"
                    placeholder="e.g. 350.00"
                    [required]="true"
                    formControlName="price"
                    [error]="getFormError('price')"
                  ></bm-input>
                </div>

                <!-- Brand (Optional) -->
                <div>
                  <bm-input
                    id="prod-brand"
                    label="Brand Name (Optional)"
                    placeholder="e.g. Nirapara, Eastern, Milma"
                    formControlName="brand"
                  ></bm-input>
                </div>

                <!-- SKU (Optional) -->
                <div>
                  <bm-input
                    id="prod-sku"
                    label="Stock Keeping Unit (SKU)"
                    placeholder="e.g. MATTA-5KG-01"
                    formControlName="sku"
                    [error]="getFormError('sku')"
                  ></bm-input>
                </div>

                <!-- Status Selector (Edit mode only) -->
                @if (isEditing()) {
                  <div>
                    <bm-select
                      id="prod-status"
                      label="Catalogue Status"
                      [options]="statusOptions"
                      placeholder="Select status"
                      [searchable]="false"
                      formControlName="status"
                    ></bm-select>
                  </div>
                }

                <!-- Full Description -->
                <div class="bm-col-2">
                  <div class="bm-textarea-group">
                    <label for="prod-desc" class="bm-field-label">
                      Product Description <span class="bm-req">*</span>
                    </label>
                    <textarea
                      id="prod-desc"
                      formControlName="description"
                      rows="3"
                      placeholder="Provide full description, origins, packaging details, and usage tips..."
                      class="bm-textarea"
                      [class.has-error]="!!getFormError('description')"
                    ></textarea>
                    @if (getFormError('description')) {
                      <span class="bm-error-text">{{ getFormError('description') }}</span>
                    }
                  </div>
                </div>
              </div>

              @if (modalErrorMessage()) {
                <div class="bm-modal-alert bm-alert-danger" role="alert">
                  <lucide-icon [img]="AlertCircleIcon" [size]="16"></lucide-icon>
                  <span>{{ modalErrorMessage() }}</span>
                </div>
              }

              <div class="bm-modal-actions">
                <bm-button
                  type="button"
                  variant="outline"
                  size="md"
                  [disabled]="isSaving()"
                  (btnClick)="closeProductModal()"
                >
                  Cancel
                </bm-button>
                <bm-button
                  type="submit"
                  variant="primary"
                  size="md"
                  [loading]="isSaving()"
                  [disabled]="productForm.invalid || isSaving()"
                >
                  <lucide-icon [img]="CheckCircleIcon" [size]="16" bmLeading></lucide-icon>
                  <span>{{ isEditing() ? 'Save Changes' : 'Create Product' }}</span>
                </bm-button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- Product Media / Cloudinary Image Manager Modal -->
      <!-- ========================================================================= -->
      @if (showMediaModal() && activeMediaProduct(); as activeProd) {
        <div class="bm-modal-backdrop" (click)="closeMediaModal()">
          <div class="bm-modal-box bm-media-modal" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <div class="bm-modal-title-group">
                <div class="bm-modal-icon-badge">
                  <lucide-icon [img]="CameraIcon" [size]="20"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-modal-title">Product Image Gallery</h3>
                  <p class="bm-modal-subtitle">{{ activeProd.name }}</p>
                </div>
              </div>
              <button
                type="button"
                class="bm-modal-close-btn"
                (click)="closeMediaModal()"
                aria-label="Close dialog"
              >
                <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <div class="bm-modal-body">
              <!-- Notice if no images and trying to activate -->
              @if (!activeProd.images || activeProd.images.length === 0) {
                <div class="bm-media-alert">
                  <lucide-icon [img]="AlertCircleIcon" [size]="16"></lucide-icon>
                  <span>At least 1 product photograph is required to publish this product to <strong>ACTIVE</strong> status.</span>
                </div>
              }

              <!-- Upload Area -->
              <div class="bm-media-upload-card">
                <!-- Mode Switcher -->
                <div class="bm-upload-mode-nav">
                  <button
                    type="button"
                    class="bm-mode-btn"
                    [class.bm-mode-active]="imageUploadMode() === 'FILE'"
                    (click)="imageUploadMode.set('FILE')"
                  >
                    <lucide-icon [img]="CloudUploadIcon" [size]="14"></lucide-icon>
                    <span>Upload File (Cloudinary)</span>
                  </button>
                  <button
                    type="button"
                    class="bm-mode-btn"
                    [class.bm-mode-active]="imageUploadMode() === 'URL'"
                    (click)="imageUploadMode.set('URL')"
                  >
                    <lucide-icon [img]="ExternalLinkIcon" [size]="14"></lucide-icon>
                    <span>Direct Image URL</span>
                  </button>
                </div>

                @if (imageUploadMode() === 'FILE') {
                  @if (!cloudinaryService.isConfigured()) {
                    <div class="bm-cloudinary-notice">
                      <lucide-icon [img]="AlertCircleIcon" [size]="16" class="bm-notice-icon"></lucide-icon>
                      <div class="bm-notice-text">
                        <strong>Cloudinary credentials not set in <code>.env</code>.</strong>
                        <span>Add <code>CLOUDINARY_CLOUD_NAME</code> and <code>CLOUDINARY_UPLOAD_PRESET</code> to your <code>.env</code> file. You can still switch to <strong>Direct Image URL</strong> to add images.</span>
                      </div>
                    </div>
                  }

                  @if (!selectedImageFile()) {
                    <!-- Dropzone -->
                    <div
                      class="bm-dropzone"
                      [class.bm-drag-active]="imageDragActive()"
                      (dragover)="onImageDragOver($event)"
                      (dragleave)="imageDragActive.set(false)"
                      (drop)="onImageDrop($event)"
                      (click)="imageFileInput.click()"
                    >
                      <input
                        #imageFileInput
                        type="file"
                        accept="image/*"
                        style="display: none;"
                        (change)="onImageFileSelected($event)"
                      />
                      <div class="bm-dropzone-icon-box">
                        <lucide-icon [img]="CloudUploadIcon" [size]="28"></lucide-icon>
                      </div>
                      <div class="bm-dropzone-text">
                        <span class="bm-dropzone-title">Click to choose image or drag & drop</span>
                        <span class="bm-dropzone-subtitle">JPEG, PNG, or WebP up to 10MB</span>
                      </div>
                    </div>
                  } @else {
                    <!-- Selected File Preview -->
                    <div class="bm-selected-image-card">
                      <div class="bm-selected-thumb">
                        @if (imagePreviewUrl()) {
                          <img [src]="imagePreviewUrl()" alt="Product image preview" class="bm-thumb-img" />
                        } @else {
                          <lucide-icon [img]="ImageIcon" [size]="24"></lucide-icon>
                        }
                      </div>
                      <div class="bm-selected-info">
                        <span class="bm-file-name" [title]="selectedImageFile()?.name">{{ selectedImageFile()?.name }}</span>
                        <span class="bm-file-size">{{ formatBytes(selectedImageFile()?.size || 0) }}</span>
                      </div>
                      <div class="bm-selected-actions">
                        <bm-button
                          type="button"
                          variant="primary"
                          size="sm"
                          [loading]="isUploadingImage()"
                          [disabled]="isUploadingImage()"
                          (btnClick)="onUploadImageFile(activeProd.id)"
                        >
                          <lucide-icon [img]="CloudUploadIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Upload & Save</span>
                        </bm-button>
                        <bm-button
                          type="button"
                          variant="ghost"
                          size="sm"
                          [disabled]="isUploadingImage()"
                          (btnClick)="clearSelectedImage()"
                        >
                          <lucide-icon [img]="XIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Cancel</span>
                        </bm-button>
                      </div>
                    </div>
                  }
                } @else {
                  <!-- Manual URL Input Form -->
                  <div class="bm-url-input-form">
                    <input
                      type="url"
                      placeholder="Paste image URL (e.g. https://res.cloudinary.com/... or https://images.unsplash.com/...)"
                      [(ngModel)]="manualImageUrl"
                      class="bm-text-input"
                    />
                    <bm-button
                      type="button"
                      variant="secondary"
                      size="md"
                      [loading]="isUploadingImage()"
                      [disabled]="!manualImageUrl.trim() || isUploadingImage()"
                      (btnClick)="onAddManualImageUrl(activeProd.id)"
                    >
                      <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
                      <span>Add Image URL</span>
                    </bm-button>
                  </div>
                }
              </div>

              <!-- Existing Images Grid -->
              <h4 class="bm-gallery-title">
                Attached Product Photos ({{ activeProd.images.length || 0 }})
              </h4>

              @if (activeProd.images && activeProd.images.length > 0) {
                <div class="bm-product-gallery-grid">
                  @for (img of activeProd.images; track img.id; let idx = $index) {
                    <div class="bm-gallery-item">
                      <img [src]="img.url" alt="Product photo" class="bm-gallery-img" />
                      @if (idx === 0) {
                        <span class="bm-primary-tag">Primary</span>
                      }
                      <button
                        type="button"
                        class="bm-gallery-delete-btn"
                        (click)="onDeleteProductImage(activeProd.id, img.id)"
                        title="Remove image"
                      >
                        <lucide-icon [img]="TrashIcon" [size]="14"></lucide-icon>
                      </button>
                    </div>
                  }
                </div>
              } @else {
                <div class="bm-gallery-empty">
                  <lucide-icon [img]="ImageIcon" [size]="32" class="bm-muted-icon"></lucide-icon>
                  <p>No photos attached to this product yet.</p>
                </div>
              }
            </div>

            <div class="bm-modal-actions">
              <bm-button variant="outline" size="md" (btnClick)="closeMediaModal()">
                Done
              </bm-button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- Archive Confirmation Modal -->
      <!-- ========================================================================= -->
      @if (productToArchive(); as prod) {
        <div class="bm-modal-backdrop" (click)="closeArchiveConfirm()">
          <div class="bm-modal-box bm-confirm-box" (click)="$event.stopPropagation()">
            <div class="bm-modal-header">
              <div class="bm-modal-title-group">
                <div class="bm-modal-icon-badge bm-danger-badge">
                  <lucide-icon [img]="ArchiveIcon" [size]="20"></lucide-icon>
                </div>
                <div>
                  <h3 class="bm-modal-title">Archive Product</h3>
                  <p class="bm-modal-subtitle">Confirm removal from regular catalogue</p>
                </div>
              </div>
              <button
                type="button"
                class="bm-modal-close-btn"
                (click)="closeArchiveConfirm()"
                aria-label="Close dialog"
              >
                <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
              </button>
            </div>

            <div class="bm-modal-body">
              <p class="bm-confirm-text">
                Are you sure you want to archive <strong>"{{ prod.name }}"</strong>?
              </p>
              <p class="bm-confirm-sub">
                Archiving removes the product from customer discovery and active group-buying pools. You can restore it to Draft status at any time.
              </p>
            </div>

            <div class="bm-modal-actions">
              <bm-button
                type="button"
                variant="outline"
                size="md"
                [disabled]="isArchiving()"
                (btnClick)="closeArchiveConfirm()"
              >
                Cancel
              </bm-button>
              <bm-button
                type="button"
                variant="danger"
                size="md"
                [loading]="isArchiving()"
                (btnClick)="confirmArchive(prod.id)"
              >
                <lucide-icon [img]="ArchiveIcon" [size]="16" bmLeading></lucide-icon>
                <span>Yes, Archive Product</span>
              </bm-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bm-products-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .bm-header-actions-group {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    // Unapproved Banner
    .bm-unapproved-banner {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      padding: var(--bm-space-4);
      background-color: #FEF3C7;
      border: 1px solid rgba(217, 119, 6, 0.3);
      border-radius: var(--bm-radius-md);

      @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .bm-unapproved-content {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-3);
    }

    .bm-unapproved-icon {
      color: #D97706;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .bm-unapproved-text {
      font-size: var(--bm-font-size-xs);
      color: #92400E;

      strong {
        font-size: var(--bm-font-size-sm);
        display: block;
        margin-bottom: 2px;
      }

      p {
        margin: 0;
        line-height: 1.5;
      }
    }

    .bm-unapproved-actions {
      flex-shrink: 0;
    }

    // Tabs & Filters Row
    .bm-tabs-row {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);

      @media (min-width: 1024px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .bm-filter-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      background-color: var(--bm-color-surface-subtle);
      padding: 4px;
      border-radius: var(--bm-radius-md);
      overflow-x: auto;
      border: 1px solid var(--bm-color-border);
    }

    .bm-tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: none;
      background: transparent;
      border-radius: var(--bm-radius-sm);
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--bm-transition-fast);

      &:hover {
        color: var(--bm-color-text-primary);
      }

      &.active {
        background-color: var(--bm-color-surface);
        color: var(--bm-color-primary);
        font-weight: var(--bm-font-weight-semibold);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }

    .bm-count-pill {
      background-color: var(--bm-color-surface-subtle);
      color: var(--bm-color-text-secondary);
      font-size: 11px;
      padding: 1px 6px;
      border-radius: var(--bm-radius-full);
      font-weight: var(--bm-font-weight-bold);
    }

    .bm-count-success {
      background-color: #E8F3ED;
      color: var(--bm-color-primary);
    }

    .bm-count-warning {
      background-color: #FEF3C7;
      color: #92400E;
    }

    // Toolbar Filters
    .bm-toolbar-filters {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-2);

      @media (min-width: 640px) {
        flex-direction: row;
        align-items: center;
      }
    }

    .bm-search-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;

      @media (min-width: 640px) {
        width: 280px;
      }
    }

    .bm-search-icon {
      position: absolute;
      left: 10px;
      color: var(--bm-color-text-muted);
      pointer-events: none;
    }

    .bm-search-input {
      width: 100%;
      height: 38px;
      padding: 0 28px 0 34px;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-primary);
      background-color: var(--bm-color-surface);
      outline: none;
      transition: border-color var(--bm-transition-fast);

      &:focus {
        border-color: var(--bm-color-primary);
      }

      &::placeholder {
        color: var(--bm-color-text-muted);
      }
    }

    .bm-clear-search {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: var(--bm-color-text-muted);
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: var(--bm-color-text-primary);
      }
    }

    .bm-category-filter-wrap {
      width: 100%;

      @media (min-width: 640px) {
        width: 220px;
      }
    }

    // Loading
    .bm-loading-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-8);
      color: var(--bm-color-text-secondary);
      font-size: var(--bm-font-size-sm);
    }

    .bm-skeleton-table-wrapper {
      padding: var(--bm-space-2);
    }

    .bm-skeleton-table-header {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background-color: var(--bm-color-surface-subtle, #f8fafc);
      border-bottom: 1px solid var(--bm-color-border, #e2e8f0);
      border-radius: var(--bm-radius-md, 8px) var(--bm-radius-md, 8px) 0 0;
    }

    .bm-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    // Table
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

    .bm-product-meta-cell {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      min-width: 240px;
    }

    .bm-product-thumb {
      position: relative;
      width: 52px;
      height: 52px;
      border-radius: var(--bm-radius-md);
      overflow: hidden;
      border: 1px solid var(--bm-color-border);
      background-color: var(--bm-color-surface-subtle);
      flex-shrink: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color var(--bm-transition-fast);

      &:hover {
        border-color: var(--bm-color-primary);
      }
    }

    .bm-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-thumb-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background-color: rgba(0, 0, 0, 0.75);
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 700;
      padding: 0 4px;
      border-radius: 3px;
    }

    .bm-thumb-placeholder {
      color: var(--bm-color-text-muted);
    }

    .bm-product-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .bm-product-name {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &:hover {
        color: var(--bm-color-primary);
        text-decoration: underline;
      }
    }

    .bm-product-desc {
      font-size: 11px;
      color: var(--bm-color-text-muted);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 260px;
    }

    .bm-category-tag {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      background-color: var(--bm-color-surface-subtle);
      padding: 2px 8px;
      border-radius: var(--bm-radius-full);
      white-space: nowrap;
      border: 1px solid var(--bm-color-border);
    }

    .bm-price-cell {
      display: flex;
      align-items: baseline;
      gap: 3px;
      white-space: nowrap;
    }

    .bm-price-val {
      font-family: var(--bm-font-mono);
      font-weight: var(--bm-font-weight-semibold);
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
    }

    .bm-price-unit {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-images-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      background: none;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-sm);
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      transition: all var(--bm-transition-fast);

      &:hover {
        border-color: var(--bm-color-primary);
        color: var(--bm-color-primary);
        background-color: #F4F9F6;
      }
    }

    .bm-sku-brand-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-sku-code {
      font-family: var(--bm-font-mono);
      font-size: 10px;
      background-color: var(--bm-color-surface-subtle);
      padding: 1px 5px;
      border-radius: 3px;
      color: var(--bm-color-text-primary);
      width: fit-content;
    }

    .bm-brand-subtext {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-muted-text {
      color: var(--bm-color-text-muted);
    }

    .bm-actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .bm-icon-action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--bm-radius-sm);
      border: 1px solid var(--bm-color-border);
      background-color: var(--bm-color-surface);
      color: var(--bm-color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--bm-transition-fast);

      &:hover {
        border-color: var(--bm-color-text-secondary);
        color: var(--bm-color-text-primary);
        background-color: var(--bm-color-surface-subtle);
      }
    }

    .bm-btn-activate:hover {
      border-color: var(--bm-color-success);
      color: var(--bm-color-success);
      background-color: #E8F3ED;
    }

    .bm-btn-draft:hover {
      border-color: var(--bm-color-warning);
      color: var(--bm-color-warning);
      background-color: #FEF3C7;
    }

    .bm-btn-restore:hover {
      border-color: var(--bm-color-primary);
      color: var(--bm-color-primary);
      background-color: #E8F3ED;
    }

    .bm-btn-danger:hover {
      border-color: var(--bm-color-danger);
      color: var(--bm-color-danger);
      background-color: #FEE2E2;
    }

    // Pagination
    .bm-pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--bm-space-3) var(--bm-space-4);
      border-top: 1px solid var(--bm-color-border);
      font-size: var(--bm-font-size-xs);
    }

    .bm-page-info {
      color: var(--bm-color-text-secondary);
    }

    .bm-pagination-controls {
      display: flex;
      gap: var(--bm-space-2);
    }

    // Modals
    .bm-modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--bm-space-4);
      animation: fadeIn 0.15s ease-out;
      overflow-y: auto;
    }

    .bm-modal-box {
      width: 100%;
      background-color: var(--bm-color-surface);
      border-radius: var(--bm-radius-lg);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
      border: 1px solid var(--bm-color-border);
      margin: auto;
      flex-shrink: 0;
    }

    .bm-product-modal {
      max-width: 640px;
    }

    .bm-media-modal {
      max-width: 680px;
    }

    .bm-confirm-box {
      max-width: 440px;
    }

    .bm-modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--bm-space-3);
      padding: var(--bm-space-4);
      border-bottom: 1px solid var(--bm-color-border);
      flex-shrink: 0;
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

    .bm-danger-badge {
      background-color: #FEE2E2;
      color: var(--bm-color-danger);
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

    .bm-modal-body {
      padding: var(--bm-space-4);
      overflow-y: auto;
      overscroll-behavior: contain;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
    }

    .bm-form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-3);

      @media (min-width: 600px) {
        grid-template-columns: 1fr 1fr;
      }
    }

    .bm-col-2 {
      @media (min-width: 600px) {
        grid-column: span 2;
      }
    }

    .bm-textarea-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bm-field-label {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-req {
      color: var(--bm-color-danger);
    }

    .bm-textarea {
      width: 100%;
      padding: var(--bm-space-2) var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-family: inherit;
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      outline: none;
      resize: vertical;
      transition: border-color var(--bm-transition-fast);

      &:focus {
        border-color: var(--bm-color-primary);
      }

      &.has-error {
        border-color: var(--bm-color-danger);
      }
    }

    .bm-error-text {
      font-size: 11px;
      color: var(--bm-color-danger);
    }

    .bm-modal-alert {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: var(--bm-space-3);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
    }

    .bm-alert-danger {
      background-color: #FEE2E2;
      border: 1px solid rgba(220, 38, 38, 0.2);
      color: #991B1B;
    }

    .bm-modal-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      border-top: 1px solid var(--bm-color-border);
      background-color: var(--bm-color-surface-subtle);
      flex-shrink: 0;
    }

    // Media Manager styles
    .bm-media-alert {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: var(--bm-space-3);
      background-color: #FEF3C7;
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: #92400E;
    }

    .bm-media-upload-card {
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: var(--bm-space-3);
      background-color: var(--bm-color-surface);
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

    .bm-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: var(--bm-space-5) var(--bm-space-4);
      border: 1.5px dashed var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-surface-subtle);
      cursor: pointer;
      text-align: center;
      transition: all var(--bm-transition-fast);

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
      width: 44px;
      height: 44px;
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

    .bm-selected-image-card {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-surface);
    }

    .bm-selected-thumb {
      width: 48px;
      height: 48px;
      border-radius: var(--bm-radius-sm);
      overflow: hidden;
      border: 1px solid var(--bm-color-border);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bm-color-surface-subtle);
    }

    .bm-selected-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-file-name {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bm-file-size {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-selected-actions {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      flex-shrink: 0;
    }

    .bm-url-input-form {
      display: flex;
      gap: var(--bm-space-2);
    }

    .bm-text-input {
      flex: 1;
      height: 38px;
      padding: 0 var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-primary);
      outline: none;

      &:focus {
        border-color: var(--bm-color-primary);
      }
    }

    .bm-gallery-title {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: var(--bm-space-2) 0 0 0;
    }

    .bm-product-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: var(--bm-space-3);
    }

    .bm-gallery-item {
      position: relative;
      height: 110px;
      border-radius: var(--bm-radius-md);
      overflow: hidden;
      border: 1px solid var(--bm-color-border);
    }

    .bm-gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-primary-tag {
      position: absolute;
      top: 4px;
      left: 4px;
      background-color: var(--bm-color-primary);
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: var(--bm-radius-full);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .bm-gallery-delete-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 26px;
      height: 26px;
      border-radius: var(--bm-radius-full);
      background-color: rgba(220, 38, 38, 0.9);
      color: #FFFFFF;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color var(--bm-transition-fast);

      &:hover {
        background-color: #B91C1C;
      }
    }

    .bm-gallery-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: var(--bm-space-6);
      background-color: var(--bm-color-surface-subtle);
      border-radius: var(--bm-radius-md);
      color: var(--bm-color-text-muted);
      font-size: var(--bm-font-size-xs);
    }

    .bm-muted-icon {
      color: var(--bm-color-text-muted);
    }

    .bm-product-name-link {
      text-decoration: none;
      color: inherit;
      display: block;

      &:hover .bm-product-name {
        color: var(--bm-color-primary);
        text-decoration: underline;
      }
    }

    .bm-icon-link {
      text-decoration: none;
      display: inline-flex;
    }

    .bm-confirm-text {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-confirm-sub {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 6px 0 0 0;
      line-height: 1.5;
    }
  `],
})
export class ProductsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);
  readonly cloudinaryService = inject(CloudinaryService);
  private readonly toast = inject(ToastService);

  readonly ShoppingBagIcon = ShoppingBag;
  readonly PlusIcon = Plus;
  readonly RefreshIcon = RefreshCw;
  readonly SearchIcon = Search;
  readonly EditIcon = Edit3;
  readonly ArchiveIcon = Archive;
  readonly TrashIcon = Trash2;
  readonly CameraIcon = Camera;
  readonly ImageIcon = ImageIcon;
  readonly CheckCircleIcon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly AlertCircleIcon = AlertCircle;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ArrowRightIcon = ArrowRight;
  readonly CloudUploadIcon = CloudUpload;
  readonly ExternalLinkIcon = ExternalLink;
  readonly XIcon = X;

  readonly categoryOptions = PRODUCT_CATEGORIES;
  readonly unitOptions = PRODUCT_UNITS;
  readonly statusOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Active', value: 'ACTIVE' },
  ];

  readonly categoryFilterOptions = [
    { label: 'All Categories', value: '' },
    ...PRODUCT_CATEGORIES.map((cat) => ({ label: cat, value: cat })),
  ];

  readonly isCheckingStore = signal<boolean>(!this.authService.currentMerchant());

  readonly isStoreApproved = computed(() => {
    return this.authService.currentMerchant()?.status === 'APPROVED';
  });

  // State signals
  readonly products = signal<ProductRecord[]>([]);
  readonly allLoadedProducts = signal<ProductRecord[]>([]);
  readonly selectedStatus = signal<ProductStatus | undefined>(undefined);
  readonly selectedCategory = signal<string>('');
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isArchiving = signal<boolean>(false);

  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);
  readonly activeCount = signal<number>(0);
  readonly draftCount = signal<number>(0);
  readonly archivedCount = signal<number>(0);

  // Modal states
  readonly showProductModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingProductId = signal<string | null>(null);
  readonly modalErrorMessage = signal<string | null>(null);

  readonly showMediaModal = signal<boolean>(false);
  readonly activeMediaProduct = signal<ProductRecord | null>(null);
  readonly imageUploadMode = signal<'FILE' | 'URL'>('FILE');
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageDragActive = signal<boolean>(false);
  readonly isUploadingImage = signal<boolean>(false);
  manualImageUrl: string = '';

  readonly productToArchive = signal<ProductRecord | null>(null);

  // Form
  readonly productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    category: [PRODUCT_CATEGORIES[0], [Validators.required]],
    price: [null, [Validators.required, Validators.min(0.01)]],
    unit: ['piece', [Validators.required]],
    brand: [''],
    sku: [''],
    status: ['DRAFT'],
  });

  // Filtered products signal with live search & category filter
  readonly filteredProducts = computed(() => {
    let list = this.products();
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory().trim().toLowerCase();

    if (cat) {
      list = list.filter((p) => p.category.toLowerCase() === cat);
    }

    if (query) {
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const skuMatch = p.sku?.toLowerCase().includes(query);
        const brandMatch = p.brand?.toLowerCase().includes(query);
        const descMatch = p.description.toLowerCase().includes(query);
        return nameMatch || skuMatch || brandMatch || descMatch;
      });
    }

    return list;
  });

  ngOnInit(): void {
    if (!this.authService.currentMerchant()) {
      this.isCheckingStore.set(true);
      this.authService.loadCurrentMerchantProfile().subscribe({
        next: (merchant) => {
          this.isCheckingStore.set(false);
          if (merchant?.status === 'APPROVED') {
            this.loadProducts();
          }
        },
        error: () => {
          this.isCheckingStore.set(false);
        },
      });
    } else {
      this.isCheckingStore.set(false);
    }

    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService
      .listProducts({
        page: this.currentPage(),
        limit: 25,
        status: this.selectedStatus(),
        category: this.selectedCategory() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.totalCount.set(res.pagination.total);
          this.totalPages.set(res.pagination.totalPages);
          this.isLoading.set(false);
          this.updateCounts();
        },
        error: (err: ApiError) => {
          this.isLoading.set(false);
          // If 403 or unapproved store, silently handle
          if (err.status !== 403) {
            this.toast.danger(err.message || 'Failed to load store products.');
          }
        },
      });
  }

  private updateCounts(): void {
    // Also fetch counts across all statuses
    this.productService.listProducts({ limit: 100 }).subscribe({
      next: (allRes) => {
        this.allLoadedProducts.set(allRes.data);
        const items = allRes.data;
        this.activeCount.set(items.filter((p) => p.status === 'ACTIVE').length);
        this.draftCount.set(items.filter((p) => p.status === 'DRAFT').length);
        this.archivedCount.set(items.filter((p) => p.status === 'ARCHIVED').length);
      },
    });
  }

  onFilterStatus(status: ProductStatus | undefined): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onCategoryFilterChange(cat: any): void {
    this.selectedCategory.set(cat || '');
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  // =========================================================================
  // Product Creation & Editing
  // =========================================================================

  openCreateModal(): void {
    this.router.navigate(['/store/products/new']);
  }

  openEditModal(product: ProductRecord): void {
    this.router.navigate(['/store/products', product.id, 'edit']);
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
    this.modalErrorMessage.set(null);
  }

  onSaveProduct(): void {
    if (this.productForm.invalid || this.isSaving()) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.modalErrorMessage.set(null);

    const val = this.productForm.value;
    const priceNum = Number(val.price);

    if (this.isEditing() && this.editingProductId()) {
      const id = this.editingProductId()!;
      const dto: UpdateProductRequest = {
        name: val.name.trim(),
        description: val.description.trim(),
        category: val.category,
        price: priceNum,
        unit: val.unit,
        brand: val.brand ? val.brand.trim() : undefined,
        sku: val.sku ? val.sku.trim() : undefined,
        status: val.status,
      };

      this.productService.updateProduct(id, dto).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.closeProductModal();
          this.loadProducts();
        },
        error: (err: ApiError) => {
          this.isSaving.set(false);
          this.modalErrorMessage.set(err.message || 'Failed to update product details.');
        },
      });
    } else {
      const dto: CreateProductRequest = {
        name: val.name.trim(),
        description: val.description.trim(),
        category: val.category,
        price: priceNum,
        unit: val.unit,
        brand: val.brand ? val.brand.trim() : undefined,
        sku: val.sku ? val.sku.trim() : undefined,
      };

      this.productService.createProduct(dto).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.closeProductModal();
          this.loadProducts();
          // Prompt user to attach images right after creation
          this.openMediaModal(created);
        },
        error: (err: ApiError) => {
          this.isSaving.set(false);
          this.modalErrorMessage.set(err.message || 'Failed to create product.');
        },
      });
    }
  }

  getFormError(field: string): string | null {
    const ctrl = this.productForm.get(field);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return null;

    if (ctrl.errors['required']) return `${field} is required.`;
    if (ctrl.errors['minlength']) return `Must be at least ${ctrl.errors['minlength'].requiredLength} characters.`;
    if (ctrl.errors['maxlength']) return `Cannot exceed ${ctrl.errors['maxlength'].requiredLength} characters.`;
    if (ctrl.errors['min']) return 'Price must be greater than zero.';
    return 'Invalid value.';
  }

  // =========================================================================
  // Quick Status Toggles (Activate, Draft, Restore)
  // =========================================================================

  toggleProductActive(product: ProductRecord): void {
    if (!product.images || product.images.length === 0) {
      this.toast.warning(`Cannot activate '${product.name}'. At least 1 product image must be uploaded first.`);
      this.openMediaModal(product);
      return;
    }

    this.productService.updateProduct(product.id, { status: 'ACTIVE' }).subscribe({
      next: () => this.loadProducts(),
      error: (err: ApiError) => this.toast.danger(err.message || 'Failed to activate product.'),
    });
  }

  toggleProductDraft(product: ProductRecord): void {
    this.productService.updateProduct(product.id, { status: 'DRAFT' }).subscribe({
      next: () => this.loadProducts(),
      error: (err: ApiError) => this.toast.danger(err.message || 'Failed to move product to draft.'),
    });
  }

  // =========================================================================
  // Archiving
  // =========================================================================

  openArchiveConfirm(product: ProductRecord): void {
    this.productToArchive.set(product);
  }

  closeArchiveConfirm(): void {
    this.productToArchive.set(null);
  }

  confirmArchive(productId: string): void {
    this.isArchiving.set(true);
    this.productService.archiveProduct(productId).subscribe({
      next: () => {
        this.isArchiving.set(false);
        this.closeArchiveConfirm();
        this.loadProducts();
      },
      error: (err: ApiError) => {
        this.isArchiving.set(false);
        this.toast.danger(err.message || 'Failed to archive product.');
      },
    });
  }

  // =========================================================================
  // Media / Cloudinary Image Manager
  // =========================================================================

  openMediaModal(product: ProductRecord): void {
    this.activeMediaProduct.set(product);
    this.clearSelectedImage();
    this.manualImageUrl = '';
    this.imageUploadMode.set('FILE');
    this.showMediaModal.set(true);
  }

  closeMediaModal(): void {
    this.showMediaModal.set(false);
    this.activeMediaProduct.set(null);
    this.clearSelectedImage();
    this.loadProducts();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

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

  onUploadImageFile(productId: string): void {
    const file = this.selectedImageFile();
    if (!file || this.isUploadingImage()) return;

    this.isUploadingImage.set(true);
    this.cloudinaryService.uploadImage(file, 'buymass/products').subscribe({
      next: (uploadRes) => {
        this.productService
          .uploadImages(productId, [{ url: uploadRes.url }])
          .subscribe({
            next: (updatedProduct) => {
              this.activeMediaProduct.set(updatedProduct);
              this.clearSelectedImage();
              this.isUploadingImage.set(false);
              this.toast.success('Product image uploaded and saved successfully!');
            },
            error: (err: ApiError) => {
              this.isUploadingImage.set(false);
              this.toast.danger(err.message || 'Failed to attach image to product.');
            },
          });
      },
      error: (err: Error) => {
        this.isUploadingImage.set(false);
        this.toast.danger(err.message || 'Cloudinary upload failed.');
      },
    });
  }

  onAddManualImageUrl(productId: string): void {
    const url = this.manualImageUrl.trim();
    if (!url || this.isUploadingImage()) return;

    this.isUploadingImage.set(true);
    this.productService.uploadImages(productId, [{ url }]).subscribe({
      next: (updatedProduct) => {
        this.activeMediaProduct.set(updatedProduct);
        this.manualImageUrl = '';
        this.isUploadingImage.set(false);
        this.toast.success('Product image URL attached successfully!');
      },
      error: (err: ApiError) => {
        this.isUploadingImage.set(false);
        this.toast.danger(err.message || 'Failed to attach image URL.');
      },
    });
  }

  onDeleteProductImage(productId: string, imageId: string): void {
    this.productService.deleteImage(productId, imageId).subscribe({
      next: (updatedProduct) => {
        this.activeMediaProduct.set(updatedProduct);
        this.toast.info('Product image removed.');
      },
      error: (err: ApiError) => {
        this.toast.danger(err.message || 'Failed to delete product image.');
      },
    });
  }

  // =========================================================================
  // UI Helpers
  // =========================================================================

  emptyStateTitle(): string {
    if (!this.isStoreApproved()) {
      return 'Store Not Yet Approved';
    }
    const s = this.selectedStatus();
    if (s === 'ACTIVE') return 'No Active Products in Catalogue';
    if (s === 'DRAFT') return 'No Draft Products';
    if (s === 'ARCHIVED') return 'No Archived Products';
    if (this.searchQuery() || this.selectedCategory()) return 'No Matching Products Found';
    return 'Your Product Catalogue is Empty';
  }

  emptyStateDescription(): string {
    if (!this.isStoreApproved()) {
      return 'Complete your merchant onboarding and submit for review. Products can be added once verified.';
    }
    if (this.searchQuery() || this.selectedCategory()) {
      return 'Try adjusting your search keywords or clear the category filter to see more products.';
    }
    return 'Start by creating your first store product. You can set prices, assign SKU codes, and upload product photos.';
  }

  getStatusBadgeVariant(status: ProductStatus): 'success' | 'warning' | 'neutral' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'warning';
      case 'ARCHIVED': return 'neutral';
    }
  }
}
