import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  KeyRound,
  LucideAngularModule,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import {
  AdminFailuresReport,
  OrderRecord,
  OrderStatus,
} from '../../../../core/models/order.model';
import { ApiError } from '../../../../core/services/api-client.service';
import { OrderService } from '../../../../core/services/order.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { OtpInputComponent } from '../../../../shared/ui/otp-input/otp-input.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

export type OrdersViewMode = 'ALL_ORDERS' | 'PICKUPS' | 'ADMIN';

@Component({
  selector: 'bm-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    EmptyStateComponent,
    ButtonComponent,
    OtpInputComponent,
  ],
  template: `
    <div class="bm-orders-page">
      <!-- Page Header -->
      <bm-page-header
        [title]="getHeaderTitle()"
        [subtitle]="getHeaderSubtitle()"
        [breadcrumbs]="[
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Orders & Fulfillment' }
        ]"
      >
        <div bmHeaderActions class="bm-header-actions-group">
          <bm-button variant="outline" size="md" (btnClick)="loadOrders()">
            <lucide-icon [img]="RefreshIcon" [size]="16" bmLeading [class.bm-spin]="isLoading()"></lucide-icon>
            <span>Refresh</span>
          </bm-button>
        </div>
      </bm-page-header>

      <!-- Store Status Check Banner -->
      @if (!isCheckingStore() && !isStoreApproved()) {
        <div class="bm-unapproved-banner" role="alert">
          <div class="bm-unapproved-content">
            <div class="bm-unapproved-icon">
              <lucide-icon [img]="ShieldAlertIcon" [size]="22"></lucide-icon>
            </div>
            <div class="bm-unapproved-text">
              <strong>Store Onboarding Approval Required</strong>
              <p>
                Your storefront <em>{{ authService.currentMerchant()?.storeName || 'application' }}</em> is currently in
                <strong>{{ authService.currentMerchant()?.status || 'PENDING' }}</strong> status.
                Orders and customer store pickups are activated once your physical storefront is approved by territory administrators.
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

      <!-- Main Navigation Mode Switcher -->
      <div class="bm-mode-switcher-bar">
        <button
          type="button"
          class="bm-mode-tab"
          [class.active]="viewMode() === 'ALL_ORDERS'"
          (click)="setViewMode('ALL_ORDERS')"
        >
          <lucide-icon [img]="ShoppingBagIcon" [size]="16"></lucide-icon>
          <span>All Store Orders</span>
          <span class="bm-mode-count">{{ totalOrdersCount() }}</span>
        </button>

        <button
          type="button"
          class="bm-mode-tab"
          [class.active]="viewMode() === 'PICKUPS'"
          (click)="setViewMode('PICKUPS')"
        >
          <lucide-icon [img]="PackageCheckIcon" [size]="16"></lucide-icon>
          <span>Store Pickups (Ready for Collection)</span>
          <span class="bm-mode-count highlight">{{ readyForPickupCount() }}</span>
        </button>

        @if (isAdmin()) {
          <button
            type="button"
            class="bm-mode-tab admin"
            [class.active]="viewMode() === 'ADMIN'"
            (click)="setViewMode('ADMIN')"
          >
            <lucide-icon [img]="ShieldCheckIcon" [size]="16"></lucide-icon>
            <span>Platform Orders & Failures (Admin)</span>
          </button>
        }
      </div>

      <!-- Secondary Status Filter Tabs (Only in ALL_ORDERS mode) -->
      @if (viewMode() === 'ALL_ORDERS') {
        <div class="bm-tabs-row">
          <div class="bm-filter-tabs">
            <button
              type="button"
              class="bm-tab-btn"
              [class.active]="selectedStatus() === undefined"
              (click)="onSelectStatus(undefined)"
            >
              <span>All Statuses</span>
              <span class="bm-tab-count">{{ totalOrdersCount() }}</span>
            </button>
            <button
              type="button"
              class="bm-tab-btn"
              [class.active]="selectedStatus() === 'PLACED'"
              (click)="onSelectStatus('PLACED')"
            >
              <span class="bm-status-dot placed"></span>
              <span>Placed</span>
              <span class="bm-tab-count">{{ placedCount() }}</span>
            </button>
            <button
              type="button"
              class="bm-tab-btn"
              [class.active]="selectedStatus() === 'CONFIRMED'"
              (click)="onSelectStatus('CONFIRMED')"
            >
              <span class="bm-status-dot confirmed"></span>
              <span>Confirmed</span>
              <span class="bm-tab-count">{{ confirmedCount() }}</span>
            </button>
            <button
              type="button"
              class="bm-tab-btn"
              [class.active]="selectedStatus() === 'READY_FOR_PICKUP'"
              (click)="onSelectStatus('READY_FOR_PICKUP')"
            >
              <span class="bm-status-dot ready"></span>
              <span>Ready for Pickup</span>
              <span class="bm-tab-count">{{ readyForPickupCount() }}</span>
            </button>
            <button
              type="button"
              class="bm-tab-btn"
              [class.active]="selectedStatus() === 'COMPLETED'"
              (click)="onSelectStatus('COMPLETED')"
            >
              <span class="bm-status-dot completed"></span>
              <span>Completed</span>
              <span class="bm-tab-count">{{ completedCount() }}</span>
            </button>
            <button
              type="button"
              class="bm-tab-btn"
              [class.active]="selectedStatus() === 'CANCELLED'"
              (click)="onSelectStatus('CANCELLED')"
            >
              <span class="bm-status-dot cancelled"></span>
              <span>Cancelled</span>
              <span class="bm-tab-count">{{ cancelledCount() }}</span>
            </button>
          </div>
        </div>
      }

      <!-- Toolbar / Search -->
      <div class="bm-toolbar-card">
        <div class="bm-search-wrap">
          <lucide-icon [img]="SearchIcon" [size]="16" class="bm-search-icon"></lucide-icon>
          <input
            type="text"
            class="bm-search-input"
            [placeholder]="getSearchPlaceholder()"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
          @if (searchQuery()) {
            <button type="button" class="bm-search-clear" (click)="searchQuery.set('')" title="Clear search">
              <lucide-icon [img]="XIcon" [size]="14"></lucide-icon>
            </button>
          }
        </div>

        @if (viewMode() === 'PICKUPS') {
          <div class="bm-pickup-counter-pill">
            <lucide-icon [img]="ClockIcon" [size]="14"></lucide-icon>
            <span>Active Customer Collection Counter</span>
          </div>
        }
      </div>

      <!-- Orders Content Card -->
      <bm-card>
        @if (isLoading()) {
          <div class="bm-loading-state">
            <lucide-icon [img]="RefreshIcon" [size]="28" class="bm-spin"></lucide-icon>
            <p>Loading orders from group-buying pools...</p>
          </div>
        } @else if (filteredOrders().length === 0) {
          <bm-empty-state
            [title]="getEmptyTitle()"
            [description]="getEmptyDescription()"
          >
            <div bmEmptyIcon>
              <lucide-icon [img]="ShoppingBagIcon" [size]="42"></lucide-icon>
            </div>
            <div bmEmptyAction>
              @if (searchQuery()) {
                <bm-button variant="outline" size="sm" (btnClick)="searchQuery.set('')">
                  <span>Clear Search</span>
                </bm-button>
              } @else {
                <a routerLink="/campaigns">
                  <bm-button variant="outline" size="md">
                    <span>View Group-Buying Pools</span>
                  </bm-button>
                </a>
              }
            </div>
          </bm-empty-state>
        } @else {
          <!-- Orders Table -->
          <div class="bm-orders-table-wrap">
            <table class="bm-orders-table">
              <thead>
                <tr>
                  <th>Order Details</th>
                  <th>Pool & Items</th>
                  <th>Financial Breakdown</th>
                  <th>Status</th>
                  <th class="bm-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (ord of filteredOrders(); track ord.id) {
                  <tr [class.bm-ready-row]="ord.status === 'READY_FOR_PICKUP'">
                    <!-- Order Details -->
                    <td>
                      <div class="bm-order-id-cell">
                        <strong class="bm-order-number">{{ ord.orderNumber }}</strong>
                        <span class="bm-order-date">{{ ord.placedAt | date:'medium' }}</span>
                        <code class="bm-id-subtext">{{ ord.id.slice(0, 8) }}...</code>
                      </div>
                    </td>

                    <!-- Pool & Items Snapshot -->
                    <td>
                      <div class="bm-items-cell">
                        <div class="bm-items-badge-row">
                          <span class="bm-items-count-badge">
                            {{ ord.items.length }} Item{{ ord.items.length === 1 ? '' : 's' }}
                          </span>
                          @if (ord.discountPercentage > 0) {
                            <span class="bm-pool-disc-badge">
                              {{ ord.discountPercentage }}% Group Discount
                            </span>
                          }
                        </div>
                        <ul class="bm-items-list">
                          @for (item of ord.items; track item.productId; let idx = $index) {
                            @if (idx < 2) {
                              <li class="bm-item-row">
                                <span class="bm-item-qty">{{ item.quantity }}x</span>
                                <span class="bm-item-name" [title]="item.productName">{{ item.productName }}</span>
                              </li>
                            }
                          }
                          @if (ord.items.length > 2) {
                            <li class="bm-item-more">+{{ ord.items.length - 2 }} more item(s)</li>
                          }
                        </ul>
                      </div>
                    </td>

                    <!-- Financial Breakdown -->
                    <td>
                      <div class="bm-financial-cell">
                        <div class="bm-final-amount">
                          ₹{{ ord.finalAmount | number }}
                        </div>
                        @if (ord.discountAmount > 0) {
                          <div class="bm-savings-text">
                            Saved ₹{{ ord.discountAmount | number }} (from ₹{{ ord.regularTotal | number }})
                          </div>
                        }
                      </div>
                    </td>

                    <!-- Status -->
                    <td>
                      <span class="bm-status-badge" [attr.data-status]="ord.status">
                        {{ formatOrderStatus(ord.status) }}
                      </span>
                    </td>

                    <!-- Workflow Actions -->
                    <td class="bm-text-right">
                      <div class="bm-actions-cell">
                        <!-- When PLACED: Confirm Order -->
                        @if (ord.status === 'PLACED') {
                          <bm-button variant="primary" size="sm" (btnClick)="onConfirmOrder(ord)">
                            <lucide-icon [img]="CheckCircleIcon" [size]="14" bmLeading></lucide-icon>
                            <span>Confirm Order</span>
                          </bm-button>
                        }

                        <!-- When CONFIRMED: Mark Ready for Pickup -->
                        @if (ord.status === 'CONFIRMED') {
                          <bm-button variant="primary" size="sm" (btnClick)="onMarkReadyForPickup(ord)">
                            <lucide-icon [img]="PackageCheckIcon" [size]="14" bmLeading></lucide-icon>
                            <span>Ready for Pickup</span>
                          </bm-button>
                        }

                        <!-- When READY_FOR_PICKUP: Verify OTP Modal Button -->
                        @if (ord.status === 'READY_FOR_PICKUP') {
                          <bm-button variant="primary" size="sm" (btnClick)="openVerifyOtpModal(ord)">
                            <lucide-icon [img]="KeyRoundIcon" [size]="14" bmLeading></lucide-icon>
                            <span>Verify Pickup OTP</span>
                          </bm-button>
                        }

                        <!-- View Details Modal -->
                        <bm-button variant="outline" size="sm" (btnClick)="openOrderDetails(ord)">
                          <lucide-icon [img]="EyeIcon" [size]="14" bmLeading></lucide-icon>
                          <span>Details</span>
                        </bm-button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="bm-pagination-bar">
            <span class="bm-page-info">
              Showing page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong>
              ({{ totalOrdersCount() }} total orders)
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
    <!-- 6-Digit WhatsApp Pickup OTP Verify Modal   -->
    <!-- ========================================== -->
    @if (orderToVerify()) {
      <div class="bm-modal-backdrop" (click)="closeVerifyOtpModal()">
        <div class="bm-modal-container bm-otp-modal" (click)="$event.stopPropagation()">
          <div class="bm-modal-header">
            <div>
              <h3 class="bm-modal-title">Verify Store Pickup</h3>
              <p class="bm-modal-subtitle">
                Customer Order: <strong>{{ orderToVerify()!.orderNumber }}</strong>
              </p>
            </div>
            <button type="button" class="bm-close-btn" (click)="closeVerifyOtpModal()">
              <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
            </button>
          </div>

          <div class="bm-modal-body">
            @if (verifyError()) {
              <div class="bm-form-error-alert" role="alert">
                <lucide-icon [img]="AlertTriangleIcon" [size]="16"></lucide-icon>
                <span>{{ verifyError() }}</span>
              </div>
            }

            <!-- Order Pickup Checklist Recap -->
            <div class="bm-pickup-recap-box">
              <span class="bm-recap-title">Items to Hand Over:</span>
              <ul class="bm-recap-list">
                @for (item of orderToVerify()!.items; track item.productId) {
                  <li>
                    <strong>{{ item.quantity }}x</strong> {{ item.productName }}
                  </li>
                }
              </ul>
              <div class="bm-recap-footer">
                <span>Final Payable Amount: <strong>₹{{ orderToVerify()!.finalAmount | number }}</strong></span>
              </div>
            </div>

            <!-- OTP Instruction -->
            <div class="bm-otp-prompt-section">
              <div class="bm-otp-icon-wrap">
                <lucide-icon [img]="KeyRoundIcon" [size]="24"></lucide-icon>
              </div>
              <p class="bm-otp-instruction">
                Ask the customer for the <strong>6-digit pickup verification code</strong> sent to their WhatsApp.
              </p>

              <!-- 6-Digit OTP Input -->
              <div class="bm-otp-wrapper">
                <bm-otp-input
                  [length]="6"
                  [hasError]="!!verifyError()"
                  (otpComplete)="onOtpInputCompleted($event)"
                  (otpChange)="onOtpChange($event)"
                ></bm-otp-input>
              </div>
            </div>
          </div>

          <div class="bm-modal-actions">
            <bm-button variant="outline" size="md" (btnClick)="closeVerifyOtpModal()">
              Cancel
            </bm-button>
            <bm-button
              variant="primary"
              size="md"
              [disabled]="enteredOtp().length !== 6 || isVerifying()"
              (btnClick)="submitVerifyPickup()"
            >
              <span>{{ isVerifying() ? 'Verifying...' : 'Verify OTP & Complete Pickup' }}</span>
            </bm-button>
          </div>
        </div>
      </div>
    }

    <!-- ========================================== -->
    <!-- Order Details Modal / Drawer               -->
    <!-- ========================================== -->
    @if (selectedOrderDetails()) {
      <div class="bm-modal-backdrop" (click)="selectedOrderDetails.set(null)">
        <div class="bm-modal-container bm-details-modal" (click)="$event.stopPropagation()">
          <div class="bm-modal-header">
            <div>
              <h3 class="bm-modal-title">Order Details: {{ selectedOrderDetails()!.orderNumber }}</h3>
              <p class="bm-modal-subtitle">
                Placed on {{ selectedOrderDetails()!.placedAt | date:'medium' }}
              </p>
            </div>
            <button type="button" class="bm-close-btn" (click)="closeOrderDetails()">
              <lucide-icon [img]="XIcon" [size]="18"></lucide-icon>
            </button>
          </div>

          <div class="bm-modal-body">
            <!-- Timeline Status Tracker -->
            <div class="bm-timeline-box">
              <div class="bm-timeline-item" [class.completed]="isStepCompleted('PLACED')">
                <div class="bm-step-circle">1</div>
                <div class="bm-step-text">
                  <span class="bm-step-name">Placed</span>
                  <span class="bm-step-date">{{ selectedOrderDetails()!.placedAt | date:'shortTime' }}</span>
                </div>
              </div>
              <div class="bm-timeline-arrow">
                <lucide-icon [img]="ChevronRightIcon" [size]="16"></lucide-icon>
              </div>
              <div class="bm-timeline-item" [class.completed]="isStepCompleted('CONFIRMED')">
                <div class="bm-step-circle">2</div>
                <div class="bm-step-text">
                  <span class="bm-step-name">Confirmed</span>
                  <span class="bm-step-date">{{ selectedOrderDetails()!.confirmedAt ? (selectedOrderDetails()!.confirmedAt | date:'shortTime') : '—' }}</span>
                </div>
              </div>
              <div class="bm-timeline-arrow">
                <lucide-icon [img]="ChevronRightIcon" [size]="16"></lucide-icon>
              </div>
              <div class="bm-timeline-item" [class.completed]="isStepCompleted('READY_FOR_PICKUP')">
                <div class="bm-step-circle">3</div>
                <div class="bm-step-text">
                  <span class="bm-step-name">Ready</span>
                  <span class="bm-step-date">{{ selectedOrderDetails()!.readyForPickupAt ? (selectedOrderDetails()!.readyForPickupAt | date:'shortTime') : '—' }}</span>
                </div>
              </div>
              <div class="bm-timeline-arrow">
                <lucide-icon [img]="ChevronRightIcon" [size]="16"></lucide-icon>
              </div>
              <div class="bm-timeline-item" [class.completed]="isStepCompleted('COMPLETED')">
                <div class="bm-step-circle">4</div>
                <div class="bm-step-text">
                  <span class="bm-step-name">Picked Up</span>
                  <span class="bm-step-date">{{ selectedOrderDetails()!.completedAt ? (selectedOrderDetails()!.completedAt | date:'shortTime') : '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Items Detailed Breakdown -->
            <div class="bm-details-section">
              <h4 class="bm-section-title">Order Items</h4>
              <div class="bm-details-table-wrap">
                <table class="bm-details-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Regular Price</th>
                      <th class="bm-text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selectedOrderDetails()!.items; track item.productId) {
                      <tr>
                        <td>
                          <strong>{{ item.productName }}</strong>
                        </td>
                        <td>{{ item.quantity }}</td>
                        <td>₹{{ item.regularUnitPrice | number }}</td>
                        <td class="bm-text-right">
                          <span class="bm-subtotal-val">₹{{ item.discountedSubtotal | number }}</span>
                          @if (item.discountedSubtotal < item.regularSubtotal) {
                            <span class="bm-strike-val">₹{{ item.regularSubtotal | number }}</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Financial Settlement Box -->
            <div class="bm-details-section">
              <h4 class="bm-section-title">Settlement Summary</h4>
              <div class="bm-settle-card">
                <div class="bm-settle-row">
                  <span>Regular Total:</span>
                  <span>₹{{ selectedOrderDetails()!.regularTotal | number }}</span>
                </div>
                <div class="bm-settle-row bm-savings">
                  <span>Group-Buying Discount ({{ selectedOrderDetails()!.discountPercentage }}%):</span>
                  <span>-₹{{ selectedOrderDetails()!.discountAmount | number }}</span>
                </div>
                <div class="bm-settle-row bm-grand-total">
                  <span>Total Payable at Pickup:</span>
                  <span>₹{{ selectedOrderDetails()!.finalAmount | number }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bm-modal-actions">
            @if (selectedOrderDetails()!.status === 'READY_FOR_PICKUP') {
              <bm-button variant="primary" size="md" (btnClick)="openVerifyOtpModal(selectedOrderDetails()!)">
                <lucide-icon [img]="KeyRoundIcon" [size]="14" bmLeading></lucide-icon>
                <span>Verify Pickup OTP</span>
              </bm-button>
            }
            <bm-button variant="outline" size="md" (btnClick)="selectedOrderDetails.set(null)">
              Close
            </bm-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .bm-orders-page {
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

    /* Main Mode Switcher */
    .bm-mode-switcher-bar {
      display: flex;
      gap: var(--bm-space-3);
      padding-bottom: var(--bm-space-1);
      border-bottom: 2px solid var(--bm-color-border);
    }

    .bm-mode-tab {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--bm-color-text-secondary);
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        color: var(--bm-color-text-primary);
      }

      &.active {
        color: var(--bm-color-primary);
        font-weight: 600;
        border-bottom-color: var(--bm-color-primary);
      }

      &.admin.active {
        color: #1E40AF;
        border-bottom-color: #1E40AF;
      }
    }

    .bm-mode-count {
      display: inline-flex;
      padding: 2px 8px;
      font-size: 0.75rem;
      border-radius: var(--bm-radius-full);
      background: #F1F5F9;
      color: var(--bm-color-text-secondary);
      font-weight: 600;

      &.highlight {
        background: #FEF3C7;
        color: #B45309;
      }
    }

    /* Secondary Status Tabs */
    .bm-tabs-row {
      display: flex;
      align-items: center;
      overflow-x: auto;
    }

    .bm-filter-tabs {
      display: flex;
      gap: var(--bm-space-2);
    }

    .bm-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--bm-color-text-secondary);
      background: #FFFFFF;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: #94A3B8;
      }

      &.active {
        background: var(--bm-color-primary-soft);
        color: var(--bm-color-primary);
        font-weight: 600;
        border-color: var(--bm-color-primary);
      }
    }

    .bm-tab-count {
      display: inline-flex;
      padding: 1px 5px;
      font-size: 0.6875rem;
      border-radius: var(--bm-radius-full);
      background: #F1F5F9;
    }

    .bm-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      &.placed { background: #2563EB; }
      &.confirmed { background: #7C3AED; }
      &.ready { background: #D97706; }
      &.completed { background: #16A34A; }
      &.cancelled { background: #64748B; }
    }

    /* Toolbar */
    .bm-toolbar-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--bm-space-4);
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

    .bm-pickup-counter-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #FEF3C7;
      color: #92400E;
      border-radius: var(--bm-radius-full);
      font-size: 0.8125rem;
      font-weight: 600;
    }

    /* Orders Table */
    .bm-orders-table-wrap {
      overflow-x: auto;
    }

    .bm-orders-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        padding: 10px 14px;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--bm-color-text-muted);
        background: #F8FAFC;
        border-bottom: 1px solid var(--bm-color-border);
      }

      td {
        padding: 14px;
        border-bottom: 1px solid #F1F5F9;
        vertical-align: middle;
      }

      tr.bm-ready-row {
        background-color: #FFFBEB;
      }
    }

    .bm-text-right {
      text-align: right;
    }

    /* Order Details Cell */
    .bm-order-id-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-order-number {
      font-size: 0.9375rem;
      color: var(--bm-color-primary);
      font-weight: 700;
    }

    .bm-order-date {
      font-size: 0.75rem;
      color: var(--bm-color-text-secondary);
    }

    .bm-id-subtext {
      font-size: 0.6875rem;
      color: var(--bm-color-text-muted);
    }

    /* Items Cell */
    .bm-items-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bm-items-badge-row {
      display: flex;
      gap: 6px;
    }

    .bm-items-count-badge {
      display: inline-flex;
      padding: 2px 6px;
      background: #F1F5F9;
      border-radius: var(--bm-radius-sm);
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--bm-color-text-secondary);
    }

    .bm-pool-disc-badge {
      display: inline-flex;
      padding: 2px 6px;
      background: #DCFCE7;
      color: #15803D;
      border-radius: var(--bm-radius-sm);
      font-size: 0.6875rem;
      font-weight: 600;
    }

    .bm-items-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-item-row {
      font-size: 0.8125rem;
      color: var(--bm-color-text-primary);
      display: flex;
      gap: 4px;
    }

    .bm-item-qty {
      font-weight: 700;
      color: var(--bm-color-primary);
    }

    .bm-item-more {
      font-size: 0.75rem;
      color: var(--bm-color-text-muted);
      font-style: italic;
    }

    /* Financial Cell */
    .bm-financial-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-final-amount {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--bm-color-text-primary);
    }

    .bm-savings-text {
      font-size: 0.75rem;
      color: #15803D;
      font-weight: 500;
    }

    /* Status Badge */
    .bm-status-badge {
      display: inline-flex;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--bm-radius-full);
      text-transform: uppercase;
      letter-spacing: 0.03em;

      &[data-status="PLACED"] { background: #DBEAFE; color: #1E40AF; }
      &[data-status="CONFIRMED"] { background: #EDE9FE; color: #6D28D9; }
      &[data-status="READY_FOR_PICKUP"] { background: #FEF3C7; color: #92400E; }
      &[data-status="COMPLETED"] { background: #DCFCE7; color: #15803D; }
      &[data-status="CANCELLED"] { background: #F1F5F9; color: #64748B; }
    }

    /* Actions Cell */
    .bm-actions-cell {
      display: flex;
      justify-content: flex-end;
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

    /* Modal Styles with Mouse Wheel Support */
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
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin: auto;
      flex-shrink: 0;

      &.bm-otp-modal {
        max-width: 500px;
      }

      &.bm-details-modal {
        max-width: 660px;
      }
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

    /* OTP Modal Details */
    .bm-pickup-recap-box {
      padding: var(--bm-space-4);
      background: #F8FAFC;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-recap-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--bm-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .bm-recap-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.875rem;
      color: var(--bm-color-text-primary);
    }

    .bm-recap-footer {
      padding-top: var(--bm-space-2);
      border-top: 1px solid var(--bm-color-border);
      font-size: 0.875rem;
      color: var(--bm-color-text-secondary);
      display: flex;
      justify-content: space-between;

      strong {
        color: var(--bm-color-text-primary);
        font-size: 0.9375rem;
      }
    }

    .bm-otp-prompt-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-2) 0;
    }

    .bm-otp-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bm-otp-instruction {
      margin: 0;
      font-size: 0.875rem;
      color: var(--bm-color-text-secondary);
      max-width: 380px;
    }

    .bm-otp-wrapper {
      margin-top: var(--bm-space-2);
      display: flex;
      justify-content: center;
    }

    /* Details Timeline */
    .bm-timeline-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--bm-space-4);
      background: #F8FAFC;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
    }

    .bm-timeline-item {
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.45;

      &.completed {
        opacity: 1;

        .bm-step-circle {
          background: #15803D;
          color: #FFFFFF;
        }

        .bm-step-name {
          color: var(--bm-color-text-primary);
          font-weight: 600;
        }
      }
    }

    .bm-step-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #94A3B8;
      color: #FFFFFF;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bm-step-text {
      display: flex;
      flex-direction: column;
    }

    .bm-step-name {
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .bm-step-date {
      font-size: 0.6875rem;
      color: var(--bm-color-text-muted);
    }

    .bm-timeline-arrow {
      color: var(--bm-color-text-muted);
    }

    .bm-section-title {
      margin: 0 0 var(--bm-space-2);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--bm-color-text-primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .bm-details-table-wrap {
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      overflow: hidden;
    }

    .bm-details-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        background: #F8FAFC;
        padding: 8px 12px;
        text-align: left;
        font-size: 0.75rem;
        color: var(--bm-color-text-muted);
        border-bottom: 1px solid var(--bm-color-border);
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid #F1F5F9;
      }
    }

    .bm-subtotal-val {
      font-weight: 600;
      color: var(--bm-color-text-primary);
    }

    .bm-strike-val {
      display: block;
      font-size: 0.75rem;
      text-decoration: line-through;
      color: var(--bm-color-text-muted);
    }

    .bm-settle-card {
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: var(--bm-space-3) var(--bm-space-4);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.875rem;
    }

    .bm-settle-row {
      display: flex;
      justify-content: space-between;
      color: var(--bm-color-text-secondary);

      &.bm-savings {
        color: #15803D;
        font-weight: 500;
      }

      &.bm-grand-total {
        padding-top: 6px;
        border-top: 1px solid var(--bm-color-border);
        font-size: 1rem;
        font-weight: 700;
        color: var(--bm-color-text-primary);
      }
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
export class OrdersPageComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly logger = inject(LoggerService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Icons
  readonly ShoppingBagIcon = ShoppingBag;
  readonly PackageCheckIcon = PackageCheck;
  readonly PackageIcon = Package;
  readonly CheckCircleIcon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly SearchIcon = Search;
  readonly RefreshIcon = RefreshCw;
  readonly KeyRoundIcon = KeyRound;
  readonly EyeIcon = Eye;
  readonly DollarSignIcon = DollarSign;
  readonly UsersIcon = Users;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly AlertCircleIcon = AlertCircle;
  readonly ArrowRightIcon = ArrowRight;
  readonly ChevronRightIcon = ChevronRight;
  readonly XIcon = X;

  // View Mode
  readonly viewMode = signal<OrdersViewMode>('ALL_ORDERS');
  readonly isAdmin = computed(() => this.authService.userRole() === 'ADMIN');
  readonly isCheckingStore = signal<boolean>(!this.authService.currentMerchant());
  readonly isStoreApproved = computed(() => {
    return this.authService.currentMerchant()?.status === 'APPROVED';
  });

  // Orders State
  readonly orders = signal<OrderRecord[]>([]);
  readonly allMerchantOrders = signal<OrderRecord[]>([]);
  readonly selectedStatus = signal<OrderStatus | undefined>(undefined);
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  // Pagination
  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly totalOrdersCount = signal<number>(0);

  // Counter Badges
  readonly placedCount = signal<number>(0);
  readonly confirmedCount = signal<number>(0);
  readonly readyForPickupCount = signal<number>(0);
  readonly completedCount = signal<number>(0);
  readonly cancelledCount = signal<number>(0);

  // Modal State
  readonly orderToVerify = signal<OrderRecord | null>(null);
  readonly enteredOtp = signal<string>('');
  readonly isVerifying = signal<boolean>(false);
  readonly verifyError = signal<string | null>(null);

  readonly selectedOrderDetails = signal<OrderRecord | null>(null);

  // Filtered Orders
  readonly filteredOrders = computed(() => {
    let list = this.orders();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;

    return list.filter((ord) => {
      const numMatch = ord.orderNumber.toLowerCase().includes(q);
      const idMatch = ord.id.toLowerCase().includes(q);
      const itemMatch = ord.items.some((item) =>
        item.productName.toLowerCase().includes(q),
      );
      return numMatch || idMatch || itemMatch;
    });
  });

  ngOnInit(): void {
    // Check if route is /orders/pickups
    this.route.url.subscribe((segments) => {
      const path = segments.map((s) => s.path).join('/');
      if (path.includes('pickups')) {
        this.viewMode.set('PICKUPS');
      } else {
        this.viewMode.set('ALL_ORDERS');
      }
      this.initStoreAndLoad();
    });
  }

  private initStoreAndLoad(): void {
    if (!this.authService.currentMerchant()) {
      this.isCheckingStore.set(true);
      this.authService.loadCurrentMerchantProfile().subscribe({
        next: (merchant) => {
          this.isCheckingStore.set(false);
          if (merchant?.status === 'APPROVED') {
            this.loadOrders();
          }
        },
        error: () => {
          this.isCheckingStore.set(false);
        },
      });
    } else {
      this.isCheckingStore.set(false);
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.isLoading.set(true);
    const mode = this.viewMode();

    if (mode === 'PICKUPS') {
      this.orderService
        .listReadyForPickupOrders({
          page: this.currentPage(),
          limit: 25,
          search: this.searchQuery() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.orders.set(res.data);
            this.totalOrdersCount.set(res.pagination.total);
            this.totalPages.set(res.pagination.totalPages);
            this.isLoading.set(false);
            this.updateCounts();
          },
          error: (err: ApiError) => {
            this.isLoading.set(false);
            if (err.status !== 403) {
              this.toast.danger(err.message || 'Failed to load ready for pickup orders.');
            }
          },
        });
    } else if (mode === 'ADMIN' && this.isAdmin()) {
      this.orderService
        .listAdminOrders({
          page: this.currentPage(),
          limit: 25,
          status: this.selectedStatus(),
          search: this.searchQuery() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.orders.set(res.data);
            this.totalOrdersCount.set(res.pagination.total);
            this.totalPages.set(res.pagination.totalPages);
            this.isLoading.set(false);
            this.updateCounts();
          },
          error: (err: ApiError) => {
            this.isLoading.set(false);
            this.toast.danger(err.message || 'Failed to load admin platform orders.');
          },
        });
    } else {
      this.orderService
        .listMerchantOrders({
          page: this.currentPage(),
          limit: 25,
          status: this.selectedStatus(),
          search: this.searchQuery() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.orders.set(res.data);
            this.totalOrdersCount.set(res.pagination.total);
            this.totalPages.set(res.pagination.totalPages);
            this.isLoading.set(false);
            this.updateCounts();
          },
          error: (err: ApiError) => {
            this.isLoading.set(false);
            if (err.status !== 403) {
              this.toast.danger(err.message || 'Failed to load orders.');
            }
          },
        });
    }
  }

  private updateCounts(): void {
    this.orderService.listMerchantOrders({ limit: 100 }).subscribe({
      next: (res) => {
        const items = res.data;
        this.allMerchantOrders.set(items);
        this.placedCount.set(items.filter((o) => o.status === 'PLACED').length);
        this.confirmedCount.set(items.filter((o) => o.status === 'CONFIRMED').length);
        this.readyForPickupCount.set(items.filter((o) => o.status === 'READY_FOR_PICKUP').length);
        this.completedCount.set(items.filter((o) => o.status === 'COMPLETED').length);
        this.cancelledCount.set(items.filter((o) => o.status === 'CANCELLED').length);
      },
      error: () => {},
    });
  }

  setViewMode(mode: OrdersViewMode): void {
    this.viewMode.set(mode);
    this.currentPage.set(1);
    this.selectedStatus.set(mode === 'PICKUPS' ? 'READY_FOR_PICKUP' : undefined);
    this.loadOrders();
    if (mode === 'PICKUPS') {
      this.router.navigate(['/orders/pickups']);
    } else if (mode === 'ALL_ORDERS') {
      this.router.navigate(['/orders']);
    }
  }

  onSelectStatus(status?: OrderStatus): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadOrders();
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
    }
  }

  // ==========================================
  // Workflow Actions
  // ==========================================
  onConfirmOrder(order: OrderRecord): void {
    this.orderService.updateOrderStatus(order.id, 'CONFIRMED').subscribe({
      next: () => {
        this.logger.trackOrder('CONFIRMED', order.id, {
          orderNumber: order.orderNumber,
          finalAmount: order.finalAmount,
        });
        this.loadOrders();
      },
      error: (err: ApiError) => {
        this.logger.error('Failed to confirm order', err, { orderId: order.id, orderNumber: order.orderNumber });
        this.toast.danger(err.message || 'Failed to confirm order.');
      },
    });
  }

  onMarkReadyForPickup(order: OrderRecord): void {
    this.orderService.markOrderReadyForPickup(order.id).subscribe({
      next: () => {
        this.logger.trackOrder('READY_FOR_PICKUP', order.id, {
          orderNumber: order.orderNumber,
        });
        this.loadOrders();
      },
      error: (err: ApiError) => {
        this.logger.error('Failed to mark order ready for pickup', err, { orderId: order.id, orderNumber: order.orderNumber });
        this.toast.danger(err.message || 'Failed to mark ready for pickup.');
      },
    });
  }

  // ==========================================
  // OTP Verification Modal
  // ==========================================
  openVerifyOtpModal(order: OrderRecord): void {
    this.orderToVerify.set(order);
    this.enteredOtp.set('');
    this.verifyError.set(null);
  }

  closeVerifyOtpModal(): void {
    this.orderToVerify.set(null);
    this.enteredOtp.set('');
    this.verifyError.set(null);
  }

  onOtpChange(otp: string): void {
    this.enteredOtp.set(otp);
    if (this.verifyError()) {
      this.verifyError.set(null);
    }
  }

  onOtpInputCompleted(otp: string): void {
    this.enteredOtp.set(otp);
  }

  submitVerifyPickup(): void {
    const order = this.orderToVerify();
    const otp = this.enteredOtp();
    if (!order || otp.length !== 6) return;

    this.isVerifying.set(true);
    this.verifyError.set(null);

    this.orderService.verifyOrderPickup(order.id, otp).subscribe({
      next: () => {
        this.isVerifying.set(false);
        this.closeVerifyOtpModal();
        this.logger.trackOrder('PICKUP_VERIFIED', order.id, {
          orderNumber: order.orderNumber,
          finalAmount: order.finalAmount,
        });
        if (this.selectedOrderDetails()?.id === order.id) {
          this.selectedOrderDetails.set(null);
        }
        this.loadOrders();
      },
      error: (err: ApiError) => {
        this.isVerifying.set(false);
        const errMsg = err.message || 'Invalid verification OTP. Please try again.';
        this.verifyError.set(errMsg);
        this.logger.warn('Store pickup OTP verification attempt failed', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: errMsg,
        });
        this.logger.trackOrder('PICKUP_OTP_FAILED', order.id, {
          orderNumber: order.orderNumber,
          reason: errMsg,
        });
      },
    });
  }

  // ==========================================
  // Order Details Modal
  // ==========================================
  openOrderDetails(order: OrderRecord): void {
    this.selectedOrderDetails.set(order);
  }

  closeOrderDetails(): void {
    this.selectedOrderDetails.set(null);
  }

  isStepCompleted(step: OrderStatus): boolean {
    const ord = this.selectedOrderDetails();
    if (!ord) return false;
    const stages: OrderStatus[] = ['PLACED', 'CONFIRMED', 'READY_FOR_PICKUP', 'COMPLETED'];
    const currentIdx = stages.indexOf(ord.status);
    const targetIdx = stages.indexOf(step);
    if (ord.status === 'CANCELLED') return false;
    return currentIdx >= targetIdx;
  }

  // ==========================================
  // Helpers
  // ==========================================
  getHeaderTitle(): string {
    if (this.viewMode() === 'PICKUPS') {
      return 'Store Pickups & Counter OTP Verification';
    }
    if (this.viewMode() === 'ADMIN') {
      return 'Platform Orders & Notification Outbox Diagnostics';
    }
    return 'Store Orders & Escrow Fulfillment';
  }

  getHeaderSubtitle(): string {
    if (this.viewMode() === 'PICKUPS') {
      return 'Verify arriving customers with 6-digit WhatsApp pickup codes and complete order fulfillment';
    }
    if (this.viewMode() === 'ADMIN') {
      return 'Inspect order notifications, locked verifications, and delivery outbox across Kerala merchants';
    }
    return 'Manage pool customer orders, confirm stock packaging, and release pickup notifications';
  }

  getSearchPlaceholder(): string {
    if (this.viewMode() === 'PICKUPS') {
      return 'Search by Order Number (#BM-ORD-...) to verify customer...';
    }
    return 'Search by order number, customer ID, or product name...';
  }

  getEmptyTitle(): string {
    if (this.searchQuery()) return 'No matching orders found';
    if (this.viewMode() === 'PICKUPS') return 'No orders awaiting pickup right now';
    if (this.selectedStatus()) return `No ${this.selectedStatus()} orders found`;
    return 'No store orders received yet';
  }

  getEmptyDescription(): string {
    if (this.searchQuery()) return 'Try searching with a different order number or clear the search input.';
    if (this.viewMode() === 'PICKUPS')
      return 'When you mark confirmed orders as Ready for Pickup, they will appear here with customer verification OTPs.';
    if (this.selectedStatus())
      return `There are currently no orders in '${this.selectedStatus()}' status.`;
    return 'Customer orders are automatically generated when community group-buying pools hit minimum volume targets.';
  }

  formatOrderStatus(status: OrderStatus): string {
    switch (status) {
      case 'PLACED':
        return 'Placed';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'READY_FOR_PICKUP':
        return 'Ready for Pickup';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
