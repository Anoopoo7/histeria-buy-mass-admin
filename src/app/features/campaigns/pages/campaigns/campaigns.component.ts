import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  Eye,
  Layers,
  LucideAngularModule,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import {
  CreatePoolRequest,
  MerchantParticipantSummary,
  PoolRecord,
  PoolStatus,
  PoolTier,
  UpdatePoolRequest,
} from '../../../../core/models/pool.model';
import { ProductRecord } from '../../../../core/models/product.model';
import { ApiError } from '../../../../core/services/api-client.service';
import { PoolService } from '../../../../core/services/pool.service';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'bm-campaigns',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    EmptyStateComponent,
    ButtonComponent,
    InputComponent,
  ],
  template: `
    <div class="bm-pools-page">
      <!-- Page Header -->
      <bm-page-header
        title="Group-Buying Campaigns & Pools"
        subtitle="Coordinate community volume purchasing, tier discounts, and automated pool lifecycle"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Campaigns & Pools' }
        ]"
      >
        <div bmHeaderActions class="bm-header-actions-group">
          <!-- Lifecycle Sync / Auto-Start Batch (Available for Admins & quick maintenance) -->
          @if (isAdmin()) {
            <bm-button
              variant="outline"
              size="md"
              [disabled]="isSyncing()"
              (btnClick)="onTriggerLifecycleSync()"
              title="Promote scheduled pools whose start time has arrived to ACTIVE, and finalize completed pools"
            >
              <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading [class.bm-spin]="isSyncing()"></lucide-icon>
              <span>{{ isSyncing() ? 'Syncing...' : 'Auto-Start / Sync Batch' }}</span>
            </bm-button>
          }

          <bm-button variant="outline" size="md" (btnClick)="loadPools()">
            <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading></lucide-icon>
            <span>Refresh</span>
          </bm-button>

          @if (isStoreApproved()) {
            <bm-button variant="primary" size="md" (btnClick)="openCreateModal()">
              <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
              <span>Create New Pool</span>
            </bm-button>
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
                Your storefront <em>{{ authService.currentMerchant()?.storeName || 'application' }}</em> is in
                <strong>{{ authService.currentMerchant()?.status || 'PENDING' }}</strong> status.
                Group-buying campaigns and community pools can be scheduled once your physical storefront is approved by territory administrators.
              </p>
            </div>
          </div>
          <div class="bm-unapproved-actions">
            @if (isAdmin() && authService.currentMerchant()) {
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

      <!-- Admin Scope Toggle -->
      @if (isAdmin()) {
        <div class="bm-scope-banner">
          <div class="bm-scope-info">
            <lucide-icon [img]="ShieldCheckIcon" [size]="18" class="bm-admin-icon"></lucide-icon>
            <span>Administrator View:</span>
          </div>
          <div class="bm-scope-buttons">
            <button
              type="button"
              class="bm-scope-btn"
              [class.active]="viewScope() === 'MERCHANT'"
              (click)="setViewScope('MERCHANT')"
            >
              My Store Pools
            </button>
            <button
              type="button"
              class="bm-scope-btn"
              [class.active]="viewScope() === 'ADMIN'"
              (click)="setViewScope('ADMIN')"
            >
              All Platform Pools (Admin Review)
            </button>
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
            (click)="onSelectStatus(undefined)"
          >
            <span>All Pools</span>
            <span class="bm-tab-count">{{ totalCount() }}</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'ACTIVE'"
            (click)="onSelectStatus('ACTIVE')"
          >
            <span class="bm-status-dot active"></span>
            <span>Active</span>
            <span class="bm-tab-count">{{ activeCount() }}</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'SCHEDULED'"
            (click)="onSelectStatus('SCHEDULED')"
          >
            <span class="bm-status-dot scheduled"></span>
            <span>Scheduled</span>
            <span class="bm-tab-count">{{ scheduledCount() }}</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'PENDING_REVIEW'"
            (click)="onSelectStatus('PENDING_REVIEW')"
          >
            <span class="bm-status-dot pending"></span>
            <span>Pending Review</span>
            <span class="bm-tab-count">{{ pendingReviewCount() }}</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'DRAFT'"
            (click)="onSelectStatus('DRAFT')"
          >
            <span class="bm-status-dot draft"></span>
            <span>Draft</span>
            <span class="bm-tab-count">{{ draftCount() }}</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'COMPLETED'"
            (click)="onSelectStatus('COMPLETED')"
          >
            <span>Completed</span>
            <span class="bm-tab-count">{{ completedCount() }}</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'REJECTED'"
            (click)="onSelectStatus('REJECTED')"
          >
            <span>Rejected</span>
            <span class="bm-tab-count">{{ rejectedCount() }}</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'PAUSED'"
            (click)="onSelectStatus('PAUSED')"
          >
            <span>Paused</span>
          </button>
          <button
            type="button"
            class="bm-tab-btn"
            [class.active]="selectedStatus() === 'CANCELLED'"
            (click)="onSelectStatus('CANCELLED')"
          >
            <span>Cancelled</span>
          </button>
        </div>
      </div>

      <!-- Toolbar / Search -->
      <div class="bm-toolbar-card">
        <div class="bm-search-wrap">
          <lucide-icon [img]="SearchIcon" [size]="16" class="bm-search-icon"></lucide-icon>
          <input
            type="text"
            class="bm-search-input"
            placeholder="Search pools by title, product, or pool ID..."
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
          @if (searchQuery()) {
            <button type="button" class="bm-search-clear" (click)="searchQuery.set('')" title="Clear search">
              <lucide-icon [img]="XIcon" [size]="14"></lucide-icon>
            </button>
          }
        </div>
      </div>

      <!-- Pools Data Display -->
      <bm-card>
        @if (isLoading()) {
          <div class="bm-loading-state">
            <lucide-icon [img]="RefreshIcon" [size]="28" class="bm-spin"></lucide-icon>
            <p>Loading community group-buying pools...</p>
          </div>
        } @else if (filteredPools().length === 0) {
          <bm-empty-state
            [title]="getEmptyStateTitle()"
            [description]="getEmptyStateDescription()"
          >
            <div bmEmptyIcon>
              <lucide-icon [img]="LayersIcon" [size]="42"></lucide-icon>
            </div>
            <div bmEmptyAction>
              @if (searchQuery()) {
                <bm-button variant="outline" size="sm" (btnClick)="searchQuery.set('')">
                  <span>Clear Search Filters</span>
                </bm-button>
              } @else if (isStoreApproved()) {
                <bm-button variant="primary" size="md" (btnClick)="openCreateModal()">
                  <lucide-icon [img]="PlusIcon" [size]="16" bmLeading></lucide-icon>
                  <span>Launch Your First Pool</span>
                </bm-button>
              }
            </div>
          </bm-empty-state>
        } @else {
          <div class="bm-pools-list">
            @for (pool of filteredPools(); track pool.id) {
              <div class="bm-pool-card" [class.bm-pool-card-active]="pool.status === 'ACTIVE'">
                <!-- Top Row: Title, Status Badge, Admin info -->
                <div class="bm-pool-header-row">
                  <div class="bm-pool-title-group">
                    <div class="bm-title-badge-wrap">
                      <h3 class="bm-pool-title">{{ pool.title }}</h3>
                      <span class="bm-status-pill" [attr.data-status]="pool.status">
                        {{ formatStatusLabel(pool.status) }}
                      </span>
                    </div>

                    @if (pool.description) {
                      <p class="bm-pool-desc">{{ pool.description }}</p>
                    }
                  </div>

                  <!-- Quick Stats Pill (Participants & Target) -->
                  <div class="bm-pool-stat-pills">
                    @if (pool.status === 'ACTIVE' || pool.status === 'COMPLETED') {
                      <div class="bm-stat-chip">
                        <lucide-icon [img]="UsersIcon" [size]="14"></lucide-icon>
                        <span>{{ pool.finalParticipantCount ?? 'Active' }} Shoppers</span>
                      </div>
                    }

                    <div class="bm-stat-chip">
                      <lucide-icon [img]="TagIcon" [size]="14"></lucide-icon>
                      <span>Up to {{ getMaxDiscount(pool) }}% OFF</span>
                    </div>
                  </div>
                </div>

                <!-- Rejection Notice (if rejected) -->
                @if (pool.status === 'REJECTED' && pool.rejectionReason) {
                  <div class="bm-rejection-banner">
                    <lucide-icon [img]="AlertTriangleIcon" [size]="16"></lucide-icon>
                    <div>
                      <strong>Administration Rejection Reason:</strong>
                      <span>{{ pool.rejectionReason }}</span>
                    </div>
                  </div>
                }

                <!-- Middle: Discount Tiers & Timeline Grid -->
                <div class="bm-pool-body-grid">
                  <!-- Tiers Visualization -->
                  <div class="bm-body-col">
                    <span class="bm-col-label">Volume Target & Discount Tiers</span>
                    <div class="bm-tiers-track">
                      @for (tier of pool.tiers; track tier.targetAmount; let idx = $index) {
                        <div class="bm-tier-node">
                          <span class="bm-tier-num">Tier {{ idx + 1 }}</span>
                          <span class="bm-tier-amount">₹{{ tier.targetAmount | number }}</span>
                          <span class="bm-tier-disc">{{ tier.discountPercentage }}% Discount</span>
                        </div>
                        @if (idx < pool.tiers.length - 1) {
                          <div class="bm-tier-arrow">
                            <lucide-icon [img]="ChevronRightIcon" [size]="14"></lucide-icon>
                          </div>
                        }
                      }
                    </div>
                  </div>

                  <!-- Schedule & Timing -->
                  <div class="bm-body-col">
                    <span class="bm-col-label">Timeline & Schedule</span>
                    <div class="bm-schedule-info">
                      <div class="bm-schedule-item">
                        <lucide-icon [img]="CalendarIcon" [size]="14"></lucide-icon>
                        <span>Starts: <strong>{{ pool.startsAt | date:'medium' }}</strong></span>
                      </div>
                      <div class="bm-schedule-item">
                        <lucide-icon [img]="ClockIcon" [size]="14"></lucide-icon>
                        <span>Duration: <strong>{{ formatDuration(pool.durationMinutes) }}</strong></span>
                      </div>
                      <div class="bm-schedule-item">
                        <lucide-icon [img]="ClockIcon" [size]="14"></lucide-icon>
                        <span>Ends: <strong>{{ pool.endsAt | date:'medium' }}</strong></span>
                      </div>
                    </div>
                  </div>

                  <!-- Products Included -->
                  <div class="bm-body-col">
                    <span class="bm-col-label">Included Products ({{ pool.productIds.length }})</span>
                    <div class="bm-products-chips">
                      @for (pId of pool.productIds; track pId; let pIdx = $index) {
                        @if (pIdx < 3) {
                          <span class="bm-product-chip" [title]="getProductName(pId)">
                            <lucide-icon [img]="ShoppingBagIcon" [size]="12"></lucide-icon>
                            <span>{{ getProductName(pId) }}</span>
                          </span>
                        }
                      }
                      @if (pool.productIds.length > 3) {
                        <span class="bm-product-chip bm-chip-more">
                          +{{ pool.productIds.length - 3 }} more
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Footer: Actions Toolbar -->
                <div class="bm-pool-footer">
                  <div class="bm-footer-left">
                    <span class="bm-pool-id">Pool ID: <code>{{ pool.id }}</code></span>
                    @if (pool.minParticipants) {
                      <span class="bm-min-part">Min: {{ pool.minParticipants }} participants</span>
                    }
                  </div>

                  <div class="bm-footer-actions">
                    <!-- Participant Summary Button (Active / Completed) -->
                    @if (pool.status === 'ACTIVE' || pool.status === 'COMPLETED' || pool.status === 'PAUSED') {
                      <bm-button variant="outline" size="sm" (btnClick)="openSummaryModal(pool)">
                        <lucide-icon [img]="UsersIcon" [size]="14" bmLeading></lucide-icon>
                        <span>View Participation</span>
                      </bm-button>
                    }

                    <!-- DRAFT / REJECTED Actions -->
                    @if (pool.status === 'DRAFT' || pool.status === 'REJECTED') {
                      <bm-button variant="outline" size="sm" (btnClick)="openEditModal(pool)">
                        <lucide-icon [img]="EditIcon" [size]="14" bmLeading></lucide-icon>
                        <span>Edit Configuration</span>
                      </bm-button>

                      <bm-button variant="primary" size="sm" (btnClick)="onSubmitForReview(pool)">
                        <lucide-icon [img]="SendIcon" [size]="14" bmLeading></lucide-icon>
                        <span>Submit for Admin Approval</span>
                      </bm-button>

                      <bm-button variant="outline" size="sm" (btnClick)="openCancelModal(pool)">
                        <lucide-icon [img]="TrashIcon" [size]="14" bmLeading></lucide-icon>
                        <span>Cancel</span>
                      </bm-button>
                    }

                    <!-- PENDING_REVIEW Actions for Admin -->
                    @if (isAdmin() && (pool.status === 'PENDING_REVIEW' || pool.status === 'UNDER_REVIEW')) {
                      <bm-button variant="outline" size="sm" (btnClick)="openRejectModal(pool)">
                        <lucide-icon [img]="XIcon" [size]="14" bmLeading></lucide-icon>
                        <span>Reject Pool</span>
                      </bm-button>

                      <bm-button variant="primary" size="sm" (btnClick)="openApproveModal(pool)">
                        <lucide-icon [img]="CheckCircleIcon" [size]="14" bmLeading></lucide-icon>
                        <span>Approve & Schedule</span>
                      </bm-button>
                    }

                    <!-- SCHEDULED Actions -->
                    @if (pool.status === 'SCHEDULED') {
                      @if (isAdmin()) {
                        <bm-button variant="outline" size="sm" (btnClick)="onTriggerLifecycleSync()" title="Auto-start if time is reached">
                          <lucide-icon [img]="PlayIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Auto-Start Sync</span>
                        </bm-button>
                        <bm-button variant="outline" size="sm" (btnClick)="onPausePool(pool)">
                          <lucide-icon [img]="PauseIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Pause</span>
                        </bm-button>
                      }
                      <bm-button variant="outline" size="sm" (btnClick)="openCancelModal(pool)">
                        <lucide-icon [img]="TrashIcon" [size]="14" bmLeading></lucide-icon>
                        <span>Cancel Pool</span>
                      </bm-button>
                    }

                    <!-- ACTIVE Actions -->
                    @if (pool.status === 'ACTIVE') {
                      @if (isAdmin()) {
                        <bm-button variant="outline" size="sm" (btnClick)="onPausePool(pool)">
                          <lucide-icon [img]="PauseIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Pause</span>
                        </bm-button>
                      }
                      <bm-button variant="outline" size="sm" (btnClick)="openCancelModal(pool)">
                        <span>Cancel Pool</span>
                      </bm-button>
                    }

                    <!-- PAUSED Actions -->
                    @if (pool.status === 'PAUSED' && isAdmin()) {
                      <bm-button variant="primary" size="sm" (btnClick)="openApproveModal(pool)">
                        <lucide-icon [img]="PlayIcon" [size]="14" bmLeading></lucide-icon>
                        <span>Resume Pool</span>
                      </bm-button>
                      <bm-button variant="outline" size="sm" (btnClick)="openCancelModal(pool)">
                        <span>Cancel</span>
                      </bm-button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Pagination Bar -->
          <div class="bm-pagination-bar">
            <span class="bm-page-info">
              Showing page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong>
              ({{ totalCount() }} total campaigns)
            </span>
            <div class="bm-pagination-buttons">
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
      </bm-card>
    </div>

    <!-- ========================================== -->
    <!-- Create / Edit Pool Modal Dialog            -->
    <!-- ========================================== -->
    @if (showPoolModal()) {
      <div class="bm-modal-backdrop" (click)="closePoolModal()">
        <div class="bm-modal-container bm-pool-modal" (click)="$event.stopPropagation()">
          <div class="bm-modal-header">
            <div>
              <h3 class="bm-modal-title">
                {{ isEditing() ? 'Edit Group-Buying Pool' : 'Create New Group-Buying Pool' }}
              </h3>
              <p class="bm-modal-subtitle">
                Configure community volume thresholds, tiers, duration, and eligible store products.
              </p>
            </div>
            <button type="button" class="bm-close-btn" (click)="closePoolModal()" title="Close dialog">
              <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
            </button>
          </div>

          <form [formGroup]="poolForm" (ngSubmit)="onSavePool()" class="bm-modal-form">
            <div class="bm-modal-body">
              @if (modalErrorMessage()) {
                <div class="bm-form-error-alert" role="alert">
                  <lucide-icon [img]="AlertCircleIcon" [size]="16"></lucide-icon>
                  <span>{{ modalErrorMessage() }}</span>
                </div>
              }

              <!-- Section: Basic Information -->
              <div class="bm-form-section">
                <h4 class="bm-section-heading">1. Campaign Title & Narrative</h4>
                <div class="bm-form-grid">
                  <div class="bm-field-col-full">
                    <bm-input
                      label="Pool Title"
                      formControlName="title"
                      placeholder="e.g. Malabar Black Pepper & Cardamom Harvest Pool"
                      [required]="true"
                      [error]="getFieldError('title')"
                      hint="Clear, compelling title between 3 and 120 characters."
                    ></bm-input>
                  </div>

                  <div class="bm-field-col-full">
                    <label class="bm-label">Campaign Narrative / Description (Optional)</label>
                    <textarea
                      class="bm-textarea"
                      formControlName="description"
                      rows="3"
                      placeholder="Explain the provenance, quality, and group-buying value for your community shoppers..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Section: Products Selection -->
              <div class="bm-form-section">
                <div class="bm-section-header-row">
                  <h4 class="bm-section-heading">2. Eligible Store Products</h4>
                  <span class="bm-selected-count">
                    {{ selectedProductIds().length }} product(s) selected
                  </span>
                </div>

                @if (storeProducts().length === 0) {
                  <div class="bm-no-products-alert">
                    <lucide-icon [img]="AlertCircleIcon" [size]="16"></lucide-icon>
                    <span>No active store products available. Please add and activate products before creating a pool.</span>
                  </div>
                } @else {
                  <div class="bm-product-picker-grid">
                    @for (prod of storeProducts(); track prod.id) {
                      <label
                        class="bm-product-pick-card"
                        [class.selected]="isProductSelected(prod.id)"
                      >
                        <input
                          type="checkbox"
                          class="bm-checkbox"
                          [checked]="isProductSelected(prod.id)"
                          (change)="toggleProductSelection(prod.id)"
                        />
                        <div class="bm-pick-thumb">
                          @if (prod.images && prod.images.length > 0) {
                            <img [src]="prod.images[0].url" alt="Product" class="bm-pick-img" />
                          } @else {
                            <lucide-icon [img]="ShoppingBagIcon" [size]="18" class="bm-muted-icon"></lucide-icon>
                          }
                        </div>
                        <div class="bm-pick-details">
                          <span class="bm-pick-name">{{ prod.name }}</span>
                          <span class="bm-pick-price">₹{{ prod.price | number }} / {{ prod.unit }}</span>
                        </div>
                      </label>
                    }
                  </div>
                }
              </div>

              <!-- Section: Schedule & Duration -->
              <div class="bm-form-section">
                <h4 class="bm-section-heading">3. Schedule & Duration</h4>
                <div class="bm-form-grid-2">
                  <div class="bm-field-col">
                    <label class="bm-label required">Start Date & Time (IST)</label>
                    <input
                      type="datetime-local"
                      class="bm-datetime-input"
                      formControlName="startsAt"
                    />
                    <span class="bm-field-hint">Must be scheduled in the future.</span>
                  </div>

                  <div class="bm-field-col">
                    <label class="bm-label required">Pool Duration</label>
                    <div class="bm-duration-picker">
                      <select class="bm-select-native" formControlName="durationPreset" (change)="onDurationPresetChange()">
                        <option [value]="120">2 Hours (Flash Pool)</option>
                        <option [value]="360">6 Hours</option>
                        <option [value]="720">12 Hours</option>
                        <option [value]="1440">24 Hours (1 Day)</option>
                        <option [value]="2880">48 Hours (2 Days)</option>
                        <option [value]="4320">72 Hours (3 Days)</option>
                        <option [value]="10080">7 Days (Full Week)</option>
                        <option value="custom">Custom Duration (Minutes)</option>
                      </select>

                      @if (poolForm.get('durationPreset')?.value === 'custom') {
                        <input
                          type="number"
                          class="bm-duration-number"
                          formControlName="durationMinutes"
                          placeholder="Minutes"
                          min="15"
                          max="10080"
                        />
                      }
                    </div>
                    <span class="bm-field-hint">Calculated End: {{ getCalculatedEndTime() }}</span>
                  </div>

                  <div class="bm-field-col">
                    <bm-input
                      label="Minimum Participants (Optional)"
                      type="number"
                      formControlName="minParticipants"
                      placeholder="e.g. 5"
                      hint="Minimum community participants required for fulfillment."
                    ></bm-input>
                  </div>
                </div>
              </div>

              <!-- Section: Volume Tiers Configuration -->
              <div class="bm-form-section">
                <div class="bm-section-header-row">
                  <div>
                    <h4 class="bm-section-heading">4. Target Volume & Discount Tiers</h4>
                    <p class="bm-section-sub">
                      Progressive community milestones. Higher total cart value unlocks higher discounts.
                    </p>
                  </div>
                  <bm-button variant="outline" size="sm" type="button" (btnClick)="addTier()">
                    <lucide-icon [img]="PlusIcon" [size]="14" bmLeading></lucide-icon>
                    <span>Add Tier</span>
                  </bm-button>
                </div>

                <div class="bm-tiers-builder">
                  <div class="bm-tier-header">
                    <span>Milestone #</span>
                    <span>Target Combined Cart Value (₹)</span>
                    <span>Customer Discount (%)</span>
                    <span>Action</span>
                  </div>

                  <div formArrayName="tiers" class="bm-tiers-rows">
                    @for (tierCtrl of tiersArray.controls; track $index; let idx = $index) {
                      <div [formGroupName]="idx" class="bm-tier-row">
                        <span class="bm-tier-index-badge">Tier {{ idx + 1 }}</span>
                        <div class="bm-tier-input-wrap">
                          <input
                            type="number"
                            class="bm-tier-input"
                            formControlName="targetAmount"
                            placeholder="e.g. 5000"
                            min="100"
                          />
                        </div>
                        <div class="bm-tier-input-wrap">
                          <input
                            type="number"
                            class="bm-tier-input"
                            formControlName="discountPercentage"
                            placeholder="e.g. 15"
                            min="1"
                            max="90"
                          />
                        </div>
                        <div class="bm-tier-action">
                          @if (tiersArray.length > 1) {
                            <button
                              type="button"
                              class="bm-tier-del-btn"
                              (click)="removeTier(idx)"
                              title="Delete tier"
                            >
                              <lucide-icon [img]="TrashIcon" [size]="14"></lucide-icon>
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="bm-modal-actions">
              <bm-button variant="outline" size="md" type="button" (btnClick)="closePoolModal()">
                Cancel
              </bm-button>
              <bm-button variant="primary" size="md" type="submit" [disabled]="isSaving()">
                <span>{{ isSaving() ? 'Saving...' : (isEditing() ? 'Save Changes' : 'Create Draft Pool') }}</span>
              </bm-button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ========================================== -->
    <!-- Participant Summary Modal Dialog           -->
    <!-- ========================================== -->
    @if (showSummaryModal()) {
      <div class="bm-modal-backdrop" (click)="showSummaryModal.set(false)">
        <div class="bm-modal-container bm-summary-modal" (click)="$event.stopPropagation()">
          <div class="bm-modal-header">
            <div>
              <h3 class="bm-modal-title">Live Pool Participation Summary</h3>
              <p class="bm-modal-subtitle">{{ activeSummaryPool()?.title }}</p>
            </div>
            <button type="button" class="bm-close-btn" (click)="showSummaryModal.set(false)">
              <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
            </button>
          </div>

          <div class="bm-modal-body">
            @if (isLoadingSummary()) {
              <div class="bm-loading-state">
                <lucide-icon [img]="RefreshIcon" [size]="28" class="bm-spin"></lucide-icon>
                <p>Retrieving aggregated community participation...</p>
              </div>
            } @else if (participantSummary()) {
              <!-- Metrics Cards Row -->
              <div class="bm-summary-metrics-row">
                <div class="bm-metric-card">
                  <div class="bm-metric-icon">
                    <lucide-icon [img]="UsersIcon" [size]="20"></lucide-icon>
                  </div>
                  <div class="bm-metric-content">
                    <span class="bm-metric-value">{{ participantSummary()!.totalParticipants }}</span>
                    <span class="bm-metric-label">Community Shoppers</span>
                  </div>
                </div>

                <div class="bm-metric-card">
                  <div class="bm-metric-icon">
                    <lucide-icon [img]="DollarSignIcon" [size]="20"></lucide-icon>
                  </div>
                  <div class="bm-metric-content">
                    <span class="bm-metric-value">₹{{ participantSummary()!.combinedEligibleCartValue | number }}</span>
                    <span class="bm-metric-label">Combined Eligible Cart Value</span>
                  </div>
                </div>

                <div class="bm-metric-card">
                  <div class="bm-metric-icon">
                    <lucide-icon [img]="TagIcon" [size]="20"></lucide-icon>
                  </div>
                  <div class="bm-metric-content">
                    <span class="bm-metric-value">
                      {{ participantSummary()!.currentTier ? participantSummary()!.currentTier!.discountPercentage + '%' : '0%' }}
                    </span>
                    <span class="bm-metric-label">Current Unlocked Discount</span>
                  </div>
                </div>
              </div>

              <!-- Product Quantity Demands -->
              <div class="bm-demand-section">
                <h4 class="bm-section-heading">Aggregated Product Quantities</h4>
                @if (participantSummary()!.productQuantities.length === 0) {
                  <p class="bm-empty-text">No carts currently checked into this pool.</p>
                } @else {
                  <div class="bm-demand-table-wrap">
                    <table class="bm-demand-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Demanded Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of participantSummary()!.productQuantities; track item.productId) {
                          <tr>
                            <td>
                              <div class="bm-demand-item">
                                <lucide-icon [img]="ShoppingBagIcon" [size]="14"></lucide-icon>
                                <span>{{ item.productName || item.productId }}</span>
                              </div>
                            </td>
                            <td>
                              <span class="bm-qty-badge">{{ item.quantity }} units</span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }
          </div>

          <div class="bm-modal-actions">
            <bm-button variant="outline" size="md" (btnClick)="showSummaryModal.set(false)">
              Close
            </bm-button>
          </div>
        </div>
      </div>
    }

    <!-- ========================================== -->
    <!-- Admin Review Modal (Approve / Reject)      -->
    <!-- ========================================== -->
    @if (showReviewModal()) {
      <div class="bm-modal-backdrop" (click)="closeReviewModal()">
        <div class="bm-modal-container" (click)="$event.stopPropagation()">
          <div class="bm-modal-header">
            <div>
              <h3 class="bm-modal-title">
                {{ reviewAction() === 'APPROVE' ? 'Approve Group-Buying Pool' : 'Reject Group-Buying Pool' }}
              </h3>
              <p class="bm-modal-subtitle">{{ activeReviewPool()?.title }}</p>
            </div>
            <button type="button" class="bm-close-btn" (click)="closeReviewModal()">
              <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
            </button>
          </div>

          <div class="bm-modal-body">
            @if (reviewAction() === 'REJECT') {
              <div class="bm-field-col-full">
                <label class="bm-label required">Rejection Feedback for Merchant</label>
                <textarea
                  class="bm-textarea"
                  [(ngModel)]="rejectionReasonText"
                  rows="3"
                  placeholder="Explain why the pool cannot be approved (e.g. Target threshold too high, duration too short)..."
                ></textarea>
                <span class="bm-field-hint">The merchant will see this reason on their dashboard to revise the pool.</span>
              </div>
            }

            <div class="bm-field-col-full">
              <label class="bm-label">Internal Administration Notes (Optional)</label>
              <textarea
                class="bm-textarea"
                [(ngModel)]="adminNotesText"
                rows="2"
                placeholder="Internal verification notes..."
              ></textarea>
            </div>
          </div>

          <div class="bm-modal-actions">
            <bm-button variant="outline" size="md" (btnClick)="closeReviewModal()">
              Cancel
            </bm-button>
            <bm-button
              [variant]="reviewAction() === 'APPROVE' ? 'primary' : 'danger'"
              size="md"
              [disabled]="reviewAction() === 'REJECT' && !rejectionReasonText.trim()"
              (btnClick)="confirmReviewAction()"
            >
              <span>{{ reviewAction() === 'APPROVE' ? 'Confirm Approval & Schedule' : 'Confirm Rejection' }}</span>
            </bm-button>
          </div>
        </div>
      </div>
    }

    <!-- ========================================== -->
    <!-- Cancel Confirmation Modal                  -->
    <!-- ========================================== -->
    @if (poolToCancel()) {
      <div class="bm-modal-backdrop" (click)="poolToCancel.set(null)">
        <div class="bm-modal-container bm-modal-sm" (click)="$event.stopPropagation()">
          <div class="bm-modal-header">
            <h3 class="bm-modal-title">Cancel Group-Buying Pool</h3>
            <button type="button" class="bm-close-btn" (click)="poolToCancel.set(null)">
              <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
            </button>
          </div>
          <div class="bm-modal-body">
            <p>
              Are you sure you want to cancel <strong>"{{ poolToCancel()?.title }}"</strong>?
              If the pool is active, existing customer cart submissions will be unlocked back to their carts.
            </p>
          </div>
          <div class="bm-modal-actions">
            <bm-button variant="outline" size="md" (btnClick)="poolToCancel.set(null)">
              Keep Pool
            </bm-button>
            <bm-button variant="danger" size="md" (btnClick)="confirmCancelPool()">
              Confirm Cancellation
            </bm-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .bm-pools-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-header-actions-group {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    /* Unapproved Banner */
    .bm-unapproved-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--bm-space-4);
      padding: var(--bm-space-4) var(--bm-space-5);
      background-color: #FEF3C7;
      border: 1px solid #FCD34D;
      border-radius: var(--bm-radius-lg);
    }

    .bm-unapproved-content {
      display: flex;
      align-items: flex-start;
      gap: var(--bm-space-3);
    }

    .bm-unapproved-icon {
      color: #D97706;
      margin-top: 2px;
    }

    .bm-unapproved-text strong {
      display: block;
      color: #92400E;
      font-size: 0.9375rem;
      margin-bottom: 2px;
    }

    .bm-unapproved-text p {
      margin: 0;
      color: #B45309;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    /* Admin Scope Banner */
    .bm-scope-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--bm-space-3) var(--bm-space-4);
      background-color: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: var(--bm-radius-md);
    }

    .bm-scope-info {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      font-weight: 600;
      font-size: 0.875rem;
      color: #1E40AF;
    }

    .bm-scope-buttons {
      display: flex;
      gap: var(--bm-space-2);
    }

    .bm-scope-btn {
      padding: 4px 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      border: 1px solid #93C5FD;
      background: #FFFFFF;
      color: #1E40AF;
      border-radius: var(--bm-radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;

      &.active {
        background: #1E40AF;
        color: #FFFFFF;
        border-color: #1E40AF;
      }
    }

    /* Status Filter Tabs */
    .bm-tabs-row {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--bm-color-border);
      overflow-x: auto;
    }

    .bm-filter-tabs {
      display: flex;
      gap: var(--bm-space-2);
      padding-bottom: 2px;
    }

    .bm-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--bm-color-text-secondary);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;

      &:hover {
        color: var(--bm-color-text-primary);
      }

      &.active {
        color: var(--bm-color-primary);
        font-weight: 600;
        border-bottom-color: var(--bm-color-primary);
      }
    }

    .bm-tab-count {
      display: inline-flex;
      padding: 1px 6px;
      font-size: 0.75rem;
      border-radius: var(--bm-radius-full);
      background: #F1F5F9;
      color: var(--bm-color-text-secondary);
    }

    .bm-tab-btn.active .bm-tab-count {
      background: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
    }

    .bm-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.active { background: #16A34A; }
      &.scheduled { background: #2563EB; }
      &.pending { background: #D97706; }
      &.draft { background: #64748B; }
    }

    /* Toolbar */
    .bm-toolbar-card {
      display: flex;
      background: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      padding: var(--bm-space-3);
    }

    .bm-search-wrap {
      position: relative;
      flex: 1;
      max-width: 480px;
      display: flex;
      align-items: center;
    }

    .bm-search-icon {
      position: absolute;
      left: 12px;
      color: var(--bm-color-text-muted);
      pointer-events: none;
    }

    .bm-search-input {
      width: 100%;
      height: 38px;
      padding-left: 36px;
      padding-right: 32px;
      font-size: 0.875rem;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      background: #FFFFFF;
      color: var(--bm-color-text-primary);

      &:focus {
        outline: none;
        border-color: var(--bm-color-primary);
        box-shadow: 0 0 0 2px var(--bm-color-primary-soft);
      }
    }

    .bm-search-clear {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--bm-color-text-muted);
      cursor: pointer;
    }

    /* Pools List Cards */
    .bm-pools-list {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
    }

    .bm-pool-card {
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      padding: var(--bm-space-5);
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        border-color: #CBD5E1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      }

      &.bm-pool-card-active {
        border-left: 4px solid #16A34A;
      }
    }

    .bm-pool-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--bm-space-4);
    }

    .bm-title-badge-wrap {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-pool-title {
      margin: 0;
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--bm-color-text-primary);
    }

    .bm-pool-desc {
      margin: var(--bm-space-1) 0 0;
      font-size: 0.875rem;
      color: var(--bm-color-text-secondary);
    }

    .bm-status-pill {
      display: inline-flex;
      padding: 3px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--bm-radius-full);
      text-transform: uppercase;
      letter-spacing: 0.03em;

      &[data-status="ACTIVE"] { background: #DCFCE7; color: #15803D; }
      &[data-status="SCHEDULED"] { background: #DBEAFE; color: #1D4ED8; }
      &[data-status="PENDING_REVIEW"], &[data-status="UNDER_REVIEW"] { background: #FEF3C7; color: #B45309; }
      &[data-status="DRAFT"] { background: #F1F5F9; color: #475569; }
      &[data-status="COMPLETED"] { background: #F3E8FF; color: #7E22CE; }
      &[data-status="REJECTED"] { background: #FEE2E2; color: #B91C1C; }
      &[data-status="PAUSED"] { background: #FFEDD5; color: #C2410C; }
      &[data-status="CANCELLED"] { background: #F3F4F6; color: #6B7280; }
    }

    .bm-pool-stat-pills {
      display: flex;
      gap: var(--bm-space-2);
    }

    .bm-stat-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      background: #F8FAFC;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--bm-color-text-primary);
    }

    /* Rejection Banner */
    .bm-rejection-banner {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: var(--bm-space-2) var(--bm-space-3);
      background: #FEF2F2;
      border: 1px solid #FCA5A5;
      border-radius: var(--bm-radius-md);
      color: #991B1B;
      font-size: 0.875rem;
    }

    /* Body Grid */
    .bm-pool-body-grid {
      display: grid;
      grid-template-columns: 1.5fr 1.2fr 1fr;
      gap: var(--bm-space-4);
      padding: var(--bm-space-3) 0;
      border-top: 1px solid #F1F5F9;
      border-bottom: 1px solid #F1F5F9;
    }

    .bm-body-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-col-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--bm-color-text-muted);
    }

    /* Tiers Track */
    .bm-tiers-track {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .bm-tier-node {
      display: flex;
      flex-direction: column;
      padding: 6px 10px;
      background: #F8FAFC;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-sm);
    }

    .bm-tier-num {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--bm-color-text-muted);
      text-transform: uppercase;
    }

    .bm-tier-amount {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--bm-color-text-primary);
    }

    .bm-tier-disc {
      font-size: 0.75rem;
      font-weight: 600;
      color: #15803D;
    }

    .bm-tier-arrow {
      color: var(--bm-color-text-muted);
    }

    /* Schedule Info */
    .bm-schedule-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bm-schedule-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--bm-color-text-secondary);

      strong {
        color: var(--bm-color-text-primary);
      }
    }

    /* Products Chips */
    .bm-products-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .bm-product-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: #F1F5F9;
      border-radius: var(--bm-radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--bm-color-text-primary);
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &.bm-chip-more {
        background: var(--bm-color-primary-soft);
        color: var(--bm-color-primary);
        font-weight: 600;
      }
    }

    /* Footer */
    .bm-pool-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-footer-left {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      font-size: 0.8125rem;
      color: var(--bm-color-text-muted);

      code {
        background: #F1F5F9;
        padding: 2px 5px;
        border-radius: var(--bm-radius-sm);
        font-size: 0.75rem;
        color: var(--bm-color-text-secondary);
      }
    }

    .bm-footer-actions {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
    }

    /* Pagination */
    .bm-pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: var(--bm-space-4);
      margin-top: var(--bm-space-2);
      border-top: 1px solid var(--bm-color-border);
    }

    .bm-page-info {
      font-size: 0.875rem;
      color: var(--bm-color-text-secondary);
    }

    .bm-pagination-buttons {
      display: flex;
      gap: var(--bm-space-2);
    }

    /* Modal Form Details */
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
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin: auto;
      flex-shrink: 0;

      &.bm-pool-modal {
        max-width: 760px;
      }

      &.bm-summary-modal {
        max-width: 680px;
      }

      &.bm-modal-sm {
        max-width: 440px;
      }
    }

    .bm-modal-form {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .bm-modal-header {
      padding: var(--bm-space-5);
      border-bottom: 1px solid var(--bm-color-border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-shrink: 0;
    }

    .bm-modal-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--bm-color-text-primary);
    }

    .bm-modal-subtitle {
      margin: 4px 0 0;
      font-size: 0.8125rem;
      color: var(--bm-color-text-secondary);
    }

    .bm-close-btn {
      background: none;
      border: none;
      color: var(--bm-color-text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--bm-radius-sm);

      &:hover {
        background: #F1F5F9;
        color: var(--bm-color-text-primary);
      }
    }

    .bm-modal-body {
      padding: var(--bm-space-5);
      overflow-y: auto;
      overscroll-behavior: contain;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-5);
    }

    .bm-modal-actions {
      padding: var(--bm-space-4) var(--bm-space-5);
      border-top: 1px solid var(--bm-color-border);
      display: flex;
      justify-content: flex-end;
      gap: var(--bm-space-3);
      background: #F8FAFC;
      flex-shrink: 0;
    }

    .bm-form-section {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
    }

    .bm-section-heading {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--bm-color-text-primary);
    }

    .bm-section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bm-section-sub {
      margin: 2px 0 0;
      font-size: 0.8125rem;
      color: var(--bm-color-text-secondary);
    }

    .bm-form-grid {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
    }

    .bm-form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--bm-space-3);
    }

    .bm-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--bm-color-text-primary);
      margin-bottom: 6px;

      &.required::after {
        content: ' *';
        color: #DC2626;
      }
    }

    .bm-field-hint {
      display: block;
      font-size: 0.75rem;
      color: var(--bm-color-text-muted);
      margin-top: 4px;
    }

    .bm-textarea, .bm-datetime-input, .bm-select-native {
      width: 100%;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: 8px 12px;
      font-size: 0.875rem;
      color: var(--bm-color-text-primary);
      background: #FFFFFF;

      &:focus {
        outline: none;
        border-color: var(--bm-color-primary);
        box-shadow: 0 0 0 2px var(--bm-color-primary-soft);
      }
    }

    .bm-duration-picker {
      display: flex;
      gap: var(--bm-space-2);
    }

    .bm-duration-number {
      width: 110px;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: 8px 10px;
      font-size: 0.875rem;
    }

    /* Product Picker */
    .bm-product-picker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--bm-space-3);
      max-height: 220px;
      overflow-y: auto;
      padding: 4px;
    }

    .bm-product-pick-card {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: 8px;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: #94A3B8;
      }

      &.selected {
        border-color: var(--bm-color-primary);
        background: var(--bm-color-primary-soft);
      }
    }

    .bm-pick-thumb {
      width: 36px;
      height: 36px;
      border-radius: var(--bm-radius-sm);
      background: #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .bm-pick-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-pick-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .bm-pick-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--bm-color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bm-pick-price {
      font-size: 0.75rem;
      color: var(--bm-color-text-secondary);
    }

    /* Tiers Builder */
    .bm-tiers-builder {
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      overflow: hidden;
    }

    .bm-tier-header {
      display: grid;
      grid-template-columns: 90px 1fr 1fr 40px;
      gap: var(--bm-space-2);
      padding: 8px 12px;
      background: #F8FAFC;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--bm-color-text-muted);
      border-bottom: 1px solid var(--bm-color-border);
    }

    .bm-tier-row {
      display: grid;
      grid-template-columns: 90px 1fr 1fr 40px;
      gap: var(--bm-space-2);
      padding: 8px 12px;
      align-items: center;
      border-bottom: 1px solid #F1F5F9;

      &:last-child {
        border-bottom: none;
      }
    }

    .bm-tier-index-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--bm-color-text-secondary);
    }

    .bm-tier-input {
      width: 100%;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-sm);
      padding: 6px 10px;
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--bm-color-primary);
      }
    }

    .bm-tier-del-btn {
      background: none;
      border: none;
      color: #EF4444;
      cursor: pointer;
      padding: 4px;
    }

    /* Summary Modal Details */
    .bm-summary-metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--bm-space-3);
    }

    .bm-metric-card {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      background: #F8FAFC;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
    }

    .bm-metric-icon {
      color: var(--bm-color-primary);
    }

    .bm-metric-value {
      display: block;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--bm-color-text-primary);
    }

    .bm-metric-label {
      font-size: 0.75rem;
      color: var(--bm-color-text-muted);
    }

    .bm-demand-table-wrap {
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      overflow: hidden;
      margin-top: var(--bm-space-2);
    }

    .bm-demand-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        background: #F8FAFC;
        padding: 8px 12px;
        text-align: left;
        font-weight: 600;
        color: var(--bm-color-text-muted);
        border-bottom: 1px solid var(--bm-color-border);
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid #F1F5F9;
      }
    }

    .bm-demand-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: var(--bm-color-text-primary);
    }

    .bm-qty-badge {
      display: inline-flex;
      padding: 2px 8px;
      background: #EFF6FF;
      color: #1E40AF;
      border-radius: var(--bm-radius-full);
      font-weight: 600;
      font-size: 0.75rem;
    }

    .bm-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .bm-loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--bm-space-12) 0;
      color: var(--bm-color-text-muted);
      gap: var(--bm-space-3);
    }

    .bm-form-error-alert {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: var(--bm-space-3);
      background: #FEF2F2;
      border: 1px solid #FCA5A5;
      border-radius: var(--bm-radius-md);
      color: #B91C1C;
      font-size: 0.875rem;
    }
  `],
})
export class CampaignsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly poolService = inject(PoolService);
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  // Icons
  readonly LayersIcon = Layers;
  readonly PlusIcon = Plus;
  readonly RefreshIcon = RefreshCw;
  readonly SearchIcon = Search;
  readonly UsersIcon = Users;
  readonly TagIcon = Tag;
  readonly CalendarIcon = Calendar;
  readonly ClockIcon = Clock;
  readonly DollarSignIcon = DollarSign;
  readonly ShoppingBagIcon = ShoppingBag;
  readonly EditIcon = Edit3;
  readonly TrashIcon = Trash2;
  readonly SendIcon = Send;
  readonly PlayIcon = Play;
  readonly PauseIcon = Pause;
  readonly CheckCircleIcon = CheckCircle2;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly AlertCircleIcon = AlertCircle;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ArrowRightIcon = ArrowRight;
  readonly ChevronRightIcon = ChevronRight;
  readonly XIcon = X;

  // Role & Scope State
  readonly isAdmin = computed(() => this.authService.userRole() === 'ADMIN');
  readonly isCheckingStore = signal<boolean>(!this.authService.currentMerchant());
  readonly isStoreApproved = computed(() => {
    return this.authService.currentMerchant()?.status === 'APPROVED';
  });
  readonly viewScope = signal<'MERCHANT' | 'ADMIN'>('MERCHANT');

  // Pools state
  readonly pools = signal<PoolRecord[]>([]);
  readonly allMerchantPools = signal<PoolRecord[]>([]);
  readonly storeProducts = signal<ProductRecord[]>([]);
  readonly selectedStatus = signal<PoolStatus | undefined>(undefined);
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly isSyncing = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // Pagination
  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);
  readonly activeCount = signal<number>(0);
  readonly scheduledCount = signal<number>(0);
  readonly pendingReviewCount = signal<number>(0);
  readonly draftCount = signal<number>(0);
  readonly completedCount = signal<number>(0);
  readonly rejectedCount = signal<number>(0);

  // Modals state
  readonly showPoolModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingPoolId = signal<string | null>(null);
  readonly modalErrorMessage = signal<string | null>(null);
  readonly selectedProductIds = signal<string[]>([]);

  readonly showSummaryModal = signal<boolean>(false);
  readonly activeSummaryPool = signal<PoolRecord | null>(null);
  readonly participantSummary = signal<MerchantParticipantSummary | null>(null);
  readonly isLoadingSummary = signal<boolean>(false);

  readonly showReviewModal = signal<boolean>(false);
  readonly reviewAction = signal<'APPROVE' | 'REJECT'>('APPROVE');
  readonly activeReviewPool = signal<PoolRecord | null>(null);
  rejectionReasonText: string = '';
  adminNotesText: string = '';

  readonly poolToCancel = signal<PoolRecord | null>(null);

  // Reactive Pool Form
  readonly poolForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: [''],
    startsAt: ['', [Validators.required]],
    durationPreset: [1440, [Validators.required]],
    durationMinutes: [1440, [Validators.required, Validators.min(15), Validators.max(10080)]],
    minParticipants: [null],
    tiers: this.fb.array([]),
  });

  get tiersArray(): FormArray {
    return this.poolForm.get('tiers') as FormArray;
  }

  // Live filtered pools
  readonly filteredPools = computed(() => {
    let list = this.pools();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;

    return list.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      const idMatch = p.id.toLowerCase().includes(q);
      return titleMatch || descMatch || idMatch;
    });
  });

  ngOnInit(): void {
    if (!this.authService.currentMerchant()) {
      this.isCheckingStore.set(true);
      this.authService.loadCurrentMerchantProfile().subscribe({
        next: (merchant) => {
          this.isCheckingStore.set(false);
          if (merchant?.status === 'APPROVED') {
            this.loadStoreProducts();
            this.loadPools();
          }
        },
        error: () => {
          this.isCheckingStore.set(false);
        },
      });
    } else {
      this.isCheckingStore.set(false);
      this.loadStoreProducts();
    }

    this.loadPools();
  }

  loadStoreProducts(): void {
    this.productService.listProducts({ limit: 100 }).subscribe({
      next: (res) => {
        this.storeProducts.set(res.data);
      },
      error: () => {},
    });
  }

  loadPools(): void {
    this.isLoading.set(true);
    const scope = this.viewScope();

    const fetch$ =
      scope === 'ADMIN' && this.isAdmin()
        ? this.poolService.listAdminPools({
            page: this.currentPage(),
            limit: 25,
            status: this.selectedStatus(),
            search: this.searchQuery() || undefined,
          })
        : this.poolService.listMerchantPools({
            page: this.currentPage(),
            limit: 25,
            status: this.selectedStatus(),
            search: this.searchQuery() || undefined,
          });

    fetch$.subscribe({
      next: (res) => {
        this.pools.set(res.data);
        this.totalCount.set(res.pagination.total);
        this.totalPages.set(res.pagination.totalPages);
        this.isLoading.set(false);
        this.updateCounts();
      },
      error: (err: ApiError) => {
        this.isLoading.set(false);
        if (err.status !== 403) {
          this.toast.danger(err.message || 'Failed to load campaigns.');
        }
      },
    });
  }

  private updateCounts(): void {
    const scope = this.viewScope();
    const fetchAll$ =
      scope === 'ADMIN' && this.isAdmin()
        ? this.poolService.listAdminPools({ limit: 100 })
        : this.poolService.listMerchantPools({ limit: 100 });

    fetchAll$.subscribe({
      next: (res) => {
        const items = res.data;
        this.allMerchantPools.set(items);
        this.activeCount.set(items.filter((p) => p.status === 'ACTIVE').length);
        this.scheduledCount.set(items.filter((p) => p.status === 'SCHEDULED').length);
        this.pendingReviewCount.set(
          items.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'UNDER_REVIEW').length,
        );
        this.draftCount.set(items.filter((p) => p.status === 'DRAFT').length);
        this.completedCount.set(items.filter((p) => p.status === 'COMPLETED').length);
        this.rejectedCount.set(items.filter((p) => p.status === 'REJECTED').length);
      },
      error: () => {},
    });
  }

  setViewScope(scope: 'MERCHANT' | 'ADMIN'): void {
    this.viewScope.set(scope);
    this.currentPage.set(1);
    this.loadPools();
  }

  onSelectStatus(status?: PoolStatus): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadPools();
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPools();
    }
  }

  // ==========================================
  // Auto-Start Lifecycle Batch
  // ==========================================
  onTriggerLifecycleSync(): void {
    this.isSyncing.set(true);
    this.poolService.syncLifecycleBatch().subscribe({
      next: (res) => {
        this.isSyncing.set(false);
        this.loadPools();
      },
      error: (err: ApiError) => {
        this.isSyncing.set(false);
        this.toast.danger(err.message || 'Lifecycle sync failed.');
      },
    });
  }

  // ==========================================
  // Modal: Create / Edit
  // ==========================================
  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingPoolId.set(null);
    this.modalErrorMessage.set(null);

    // Default start time: 2 hours from now formatted for datetime-local
    const defaultStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const localIso = this.formatDatetimeLocal(defaultStart);

    this.poolForm.reset({
      title: '',
      description: '',
      startsAt: localIso,
      durationPreset: 1440,
      durationMinutes: 1440,
      minParticipants: 3,
    });

    this.tiersArray.clear();
    // Default 2 tiers
    this.addTier(5000, 10);
    this.addTier(10000, 20);

    // Default select active products if available
    const available = this.storeProducts().filter((p) => p.status === 'ACTIVE');
    this.selectedProductIds.set(available.length > 0 ? [available[0].id] : []);

    this.showPoolModal.set(true);
  }

  openEditModal(pool: PoolRecord): void {
    this.isEditing.set(true);
    this.editingPoolId.set(pool.id);
    this.modalErrorMessage.set(null);

    const startLocal = this.formatDatetimeLocal(new Date(pool.startsAt));

    this.poolForm.reset({
      title: pool.title,
      description: pool.description || '',
      startsAt: startLocal,
      durationPreset: pool.durationMinutes,
      durationMinutes: pool.durationMinutes,
      minParticipants: pool.minParticipants || null,
    });

    this.tiersArray.clear();
    if (pool.tiers && pool.tiers.length > 0) {
      for (const t of pool.tiers) {
        this.addTier(t.targetAmount, t.discountPercentage);
      }
    } else {
      this.addTier(5000, 10);
    }

    this.selectedProductIds.set([...pool.productIds]);
    this.showPoolModal.set(true);
  }

  closePoolModal(): void {
    this.showPoolModal.set(false);
    this.editingPoolId.set(null);
  }

  addTier(targetAmount: number = 2000, discountPercentage: number = 10): void {
    const group = this.fb.group({
      targetAmount: [targetAmount, [Validators.required, Validators.min(100)]],
      discountPercentage: [
        discountPercentage,
        [Validators.required, Validators.min(1), Validators.max(90)],
      ],
    });
    this.tiersArray.push(group);
  }

  removeTier(index: number): void {
    if (this.tiersArray.length > 1) {
      this.tiersArray.removeAt(index);
    }
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds().includes(productId);
  }

  toggleProductSelection(productId: string): void {
    const current = this.selectedProductIds();
    if (current.includes(productId)) {
      this.selectedProductIds.set(current.filter((id) => id !== productId));
    } else {
      this.selectedProductIds.set([...current, productId]);
    }
  }

  onDurationPresetChange(): void {
    const val = this.poolForm.get('durationPreset')?.value;
    if (val !== 'custom') {
      this.poolForm.patchValue({ durationMinutes: Number(val) });
    }
  }

  getCalculatedEndTime(): string {
    const startStr = this.poolForm.get('startsAt')?.value;
    const duration = Number(this.poolForm.get('durationMinutes')?.value) || 0;
    if (!startStr) return '—';
    const start = new Date(startStr);
    if (Number.isNaN(start.getTime())) return '—';
    const end = new Date(start.getTime() + duration * 60000);
    return end.toLocaleString();
  }

  onSavePool(): void {
    if (this.poolForm.invalid) {
      this.poolForm.markAllAsTouched();
      this.modalErrorMessage.set('Please correct all validation errors above.');
      return;
    }

    if (this.selectedProductIds().length === 0) {
      this.modalErrorMessage.set('Please select at least 1 store product for this pool.');
      return;
    }

    // Validate tiers ascending order
    const rawTiers: PoolTier[] = this.tiersArray.value.map((t: any) => ({
      targetAmount: Number(t.targetAmount),
      discountPercentage: Number(t.discountPercentage),
    }));

    rawTiers.sort((a, b) => a.targetAmount - b.targetAmount);

    for (let i = 1; i < rawTiers.length; i++) {
      if (rawTiers[i].discountPercentage <= rawTiers[i - 1].discountPercentage) {
        this.modalErrorMessage.set(
          `Tier at ₹${rawTiers[i].targetAmount} (${rawTiers[i].discountPercentage}%) must have a higher discount than tier at ₹${rawTiers[i - 1].targetAmount} (${rawTiers[i - 1].discountPercentage}%).`,
        );
        return;
      }
    }

    const formVal = this.poolForm.value;
    const startsAtDate = new Date(formVal.startsAt);

    if (startsAtDate.getTime() <= Date.now()) {
      this.modalErrorMessage.set('Scheduled start time must be in the future.');
      return;
    }

    this.isSaving.set(true);
    this.modalErrorMessage.set(null);

    if (this.isEditing() && this.editingPoolId()) {
      const updateDto: UpdatePoolRequest = {
        title: formVal.title.trim(),
        description: formVal.description ? formVal.description.trim() : undefined,
        productIds: this.selectedProductIds(),
        startsAt: startsAtDate.toISOString(),
        durationMinutes: Number(formVal.durationMinutes),
        minParticipants: formVal.minParticipants ? Number(formVal.minParticipants) : undefined,
        tiers: rawTiers,
      };

      this.poolService.updatePool(this.editingPoolId()!, updateDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closePoolModal();
          this.loadPools();
        },
        error: (err: ApiError) => {
          this.isSaving.set(false);
          this.modalErrorMessage.set(err.message || 'Failed to update pool.');
        },
      });
    } else {
      const createDto: CreatePoolRequest = {
        title: formVal.title.trim(),
        description: formVal.description ? formVal.description.trim() : undefined,
        productIds: this.selectedProductIds(),
        startsAt: startsAtDate.toISOString(),
        durationMinutes: Number(formVal.durationMinutes),
        minParticipants: formVal.minParticipants ? Number(formVal.minParticipants) : undefined,
        tiers: rawTiers,
      };

      this.poolService.createPool(createDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closePoolModal();
          this.loadPools();
        },
        error: (err: ApiError) => {
          this.isSaving.set(false);
          this.modalErrorMessage.set(err.message || 'Failed to create pool.');
        },
      });
    }
  }

  // ==========================================
  // Merchant Actions: Submit & Cancel
  // ==========================================
  onSubmitForReview(pool: PoolRecord): void {
    this.poolService.submitPoolForReview(pool.id).subscribe({
      next: () => {
        this.loadPools();
      },
      error: (err: ApiError) => {
        this.toast.danger(err.message || 'Failed to submit pool for review.');
      },
    });
  }

  openCancelModal(pool: PoolRecord): void {
    this.poolToCancel.set(pool);
  }

  confirmCancelPool(): void {
    const target = this.poolToCancel();
    if (!target) return;

    const op$ =
      this.viewScope() === 'ADMIN' && this.isAdmin()
        ? this.poolService.adminCancelPool(target.id, { adminNotes: 'Cancelled via Admin Portal' })
        : this.poolService.cancelPool(target.id);

    op$.subscribe({
      next: () => {
        this.poolToCancel.set(null);
        this.loadPools();
      },
      error: (err: ApiError) => {
        this.toast.danger(err.message || 'Failed to cancel pool.');
      },
    });
  }

  // ==========================================
  // Summary Modal
  // ==========================================
  openSummaryModal(pool: PoolRecord): void {
    this.activeSummaryPool.set(pool);
    this.showSummaryModal.set(true);
    this.isLoadingSummary.set(true);
    this.participantSummary.set(null);

    this.poolService.getParticipantSummary(pool.id).subscribe({
      next: (summary) => {
        this.participantSummary.set(summary);
        this.isLoadingSummary.set(false);
      },
      error: (err: ApiError) => {
        this.isLoadingSummary.set(false);
        this.toast.danger(err.message || 'Failed to load participant summary.');
      },
    });
  }

  // ==========================================
  // Admin Review: Approve / Reject / Pause
  // ==========================================
  openApproveModal(pool: PoolRecord): void {
    this.activeReviewPool.set(pool);
    this.reviewAction.set('APPROVE');
    this.adminNotesText = '';
    this.rejectionReasonText = '';
    this.showReviewModal.set(true);
  }

  openRejectModal(pool: PoolRecord): void {
    this.activeReviewPool.set(pool);
    this.reviewAction.set('REJECT');
    this.adminNotesText = '';
    this.rejectionReasonText = '';
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.activeReviewPool.set(null);
  }

  confirmReviewAction(): void {
    const pool = this.activeReviewPool();
    if (!pool) return;

    if (this.reviewAction() === 'APPROVE') {
      this.poolService
        .approvePool(pool.id, {
          adminNotes: this.adminNotesText.trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.closeReviewModal();
            this.loadPools();
          },
          error: (err: ApiError) => {
            this.toast.danger(err.message || 'Approval failed.');
          },
        });
    } else {
      if (!this.rejectionReasonText.trim()) return;

      this.poolService
        .rejectPool(pool.id, {
          rejectionReason: this.rejectionReasonText.trim(),
          adminNotes: this.adminNotesText.trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.closeReviewModal();
            this.loadPools();
          },
          error: (err: ApiError) => {
            this.toast.danger(err.message || 'Rejection failed.');
          },
        });
    }
  }

  onPausePool(pool: PoolRecord): void {
    this.poolService.pausePool(pool.id).subscribe({
      next: () => {
        this.loadPools();
      },
      error: (err: ApiError) => {
        this.toast.danger(err.message || 'Failed to pause pool.');
      },
    });
  }

  // ==========================================
  // Helpers
  // ==========================================
  formatStatusLabel(status: PoolStatus): string {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'ACTIVE':
        return 'Active Live';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'COMPLETED':
        return 'Completed';
      case 'REJECTED':
        return 'Rejected';
      case 'PAUSED':
        return 'Paused';
      case 'DRAFT':
        return 'Draft';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem === 0) return `${hours}h`;
    return `${hours}h ${rem}m`;
  }

  getMaxDiscount(pool: PoolRecord): number {
    if (!pool.tiers || pool.tiers.length === 0) return pool.discountPercentage || 0;
    return Math.max(...pool.tiers.map((t) => t.discountPercentage));
  }

  getProductName(productId: string): string {
    const p = this.storeProducts().find((item) => item.id === productId);
    return p ? p.name : productId.slice(0, 8);
  }

  getFieldError(fieldName: string): string | undefined {
    const control = this.poolForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return undefined;
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters required.`;
    if (control.errors['maxlength'])
      return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed.`;
    if (control.errors['min']) return `Value must be at least ${control.errors['min'].min}.`;
    if (control.errors['max']) return `Value cannot exceed ${control.errors['max'].max}.`;
    return 'Invalid field value.';
  }

  getEmptyStateTitle(): string {
    if (this.searchQuery()) return 'No matching campaigns found';
    if (this.selectedStatus()) return `No ${this.selectedStatus()} pools found`;
    return 'No Group-Buying Pools Created Yet';
  }

  getEmptyStateDescription(): string {
    if (this.searchQuery())
      return 'Try adjusting your search query to find community group-buying pools.';
    if (this.selectedStatus())
      return `There are currently no campaigns matching the '${this.selectedStatus()}' status filter.`;
    return 'Create your first community buying pool to offer volume discounts on your store products.';
  }

  private formatDatetimeLocal(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }
}
