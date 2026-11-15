import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  LucideAngularModule,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { OrderRecord } from '../../../../core/models/order.model';
import { PoolRecord } from '../../../../core/models/pool.model';
import { AdminMerchantService } from '../../../../core/services/admin-merchant.service';
import { OrderService } from '../../../../core/services/order.service';
import { PoolService } from '../../../../core/services/pool.service';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import {
  LineChartComponent,
  LineChartPoint,
} from '../../../../shared/ui/line-chart/line-chart.component';
import {
  ActivityDay,
  DashboardMetric,
  DashboardMockService,
  DashboardPickupItem,
  DashboardRecentOrder,
} from '../../services/dashboard-mock.service';

@Component({
  selector: 'bm-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    SkeletonComponent,
    LineChartComponent,
  ],
  template: `
    <div class="bm-dashboard-page">
      <bm-page-header
        title="Store Operations Dashboard"
        subtitle="Kerala community group buying, campaign progression & pickup queue"
      >
        <div bmHeaderActions>
          <bm-button
            variant="outline"
            size="sm"
            (btnClick)="refreshDashboard()"
            [disabled]="isLoading()"
          >
            <lucide-icon
              [img]="RefreshCwIcon"
              [size]="14"
              [class.bm-spin]="isLoading()"
              bmLeading
            ></lucide-icon>
            <span>Refresh Data</span>
          </bm-button>
        </div>
      </bm-page-header>

      <!-- Admin Platform Verification Banner -->
      @if (authService.userRole() === 'ADMIN' && adminPendingCount() > 0) {
        <div class="bm-admin-banner">
          <div class="bm-admin-banner-left">
            <div class="bm-admin-banner-icon">
              <lucide-icon [img]="ShieldCheckIcon" [size]="22"></lucide-icon>
            </div>
            <div class="bm-admin-banner-text">
              <span class="bm-admin-banner-title">
                Platform Store Verification
                <span class="bm-badge-alert">{{ adminPendingCount() }} Pending Review</span>
              </span>
              <span class="bm-admin-banner-sub">
                Merchant storefront applications awaiting territory verification and KYC review.
              </span>
            </div>
          </div>
          <a routerLink="/admin/merchants" class="bm-admin-banner-link">
            <span>Review Applications ({{ adminPendingCount() }})</span>
            <lucide-icon [img]="ArrowUpRightIcon" [size]="15"></lucide-icon>
          </a>
        </div>
      }

      <!-- Operations Telemetry Banner -->
      @if (authService.userRole() === 'ADMIN') {
        <div class="bm-live-banner admin-theme" role="status">
          <div class="bm-live-badge admin-badge">PLATFORM COMMAND</div>
          <p class="bm-live-text">
            Viewing aggregated telemetry across all onboarded merchants, order pipelines, and community pools.
          </p>
        </div>
      } @else if (isLiveStore()) {
        <div class="bm-live-banner" role="status">
          <div class="bm-live-badge">LIVE STORE</div>
          <p class="bm-live-text">
            Displaying real-time operational data for <strong>{{ authService.currentMerchant()?.storeName }}</strong>.
          </p>
        </div>
      } @else if (!isStoreApproved()) {
        <!-- Onboarding Notice Banner -->
        <div class="bm-onboarding-banner" role="status">
          <div class="bm-onboarding-badge">ONBOARDING IN PROGRESS</div>
          <p class="bm-onboarding-text">
            Your store application for <strong>{{ authService.currentMerchant()?.storeName || 'your business' }}</strong>
            is currently awaiting platform territory review. Catalogue & pool operations will unlock upon approval.
          </p>
          <a routerLink="/my-store" class="bm-onboarding-link">
            <span>View Application &rarr;</span>
          </a>
        </div>
      }

      <!-- Key Metric Cards Grid -->
      <div class="bm-metrics-grid">
        @if (isLoading()) {
          @for (placeholder of [1, 2, 3, 4]; track $index) {
            <div class="bm-metric-card" aria-label="Loading metric">
              <bm-skeleton width="60%" height="13px"></bm-skeleton>
              <div class="bm-metric-value-row" style="margin: 8px 0;">
                <bm-skeleton width="45%" height="28px"></bm-skeleton>
                <bm-skeleton width="30%" height="16px"></bm-skeleton>
              </div>
              <bm-skeleton width="80%" height="12px"></bm-skeleton>
            </div>
          }
        } @else {
          @for (metric of metrics(); track metric.label) {
            <div class="bm-metric-card">
              <span class="bm-metric-label">{{ metric.label }}</span>
              <div class="bm-metric-value-row">
                <span class="bm-metric-value">
                  @if (isCurrencyMetric(metric.label)) {
                    ₹{{ metric.value | number }}
                  } @else {
                    {{ metric.value }}
                  }
                </span>
                <span class="bm-metric-trend" [class]="'trend-' + metric.trendType">
                  {{ metric.trend }}
                </span>
              </div>
              <span class="bm-metric-subtext">{{ metric.subtext }}</span>
            </div>
          }
        }
      </div>

      <!-- Main Operational Area: Activity Chart & Recent Orders -->
      <div class="bm-dashboard-columns">
        <!-- Left: Activity Chart & Orders -->
        <div class="bm-col-main">
          <!-- Order & Pickup Line Chart Trends -->
          <bm-card
            title="Order & Pickup Trends"
            subtitle="Real-time daily operations tracking customer purchases, pickups and sales volume"
          >
            <div bmCardAction>
              <div class="bm-timeframe-switcher">
                <button
                  type="button"
                  class="bm-timeframe-btn"
                  [class.active]="chartTimeframe() === '7d'"
                  (click)="chartTimeframe.set('7d')"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  class="bm-timeframe-btn"
                  [class.active]="chartTimeframe() === '14d'"
                  (click)="chartTimeframe.set('14d')"
                >
                  14 Days
                </button>
                <button
                  type="button"
                  class="bm-timeframe-btn"
                  [class.active]="chartTimeframe() === '30d'"
                  (click)="chartTimeframe.set('30d')"
                >
                  30 Days
                </button>
              </div>
            </div>

            @if (isLoading()) {
              <div style="padding: 16px;">
                <bm-skeleton variant="rectangular" height="220px"></bm-skeleton>
              </div>
            } @else {
              <bm-line-chart
                [data]="lineChartData()"
                series1Name="Orders Placed"
                series2Name="Customer Pickups"
                series1Color="#176B50"
                series2Color="#22C55E"
                [showArea]="true"
              ></bm-line-chart>
            }
          </bm-card>

          <!-- Active Community Pools Widget -->
          @if (activePoolsList().length > 0) {
            <bm-card
              title="Active Community Group Pools"
              subtitle="Live pooling campaigns currently reaching bulk discount tiers"
            >
              <div bmCardAction>
                <a routerLink="/campaigns" class="bm-card-action-link">Explore Pools</a>
              </div>
              <div class="bm-dashboard-pools-grid">
                @for (pool of activePoolsList(); track pool.id) {
                  <div class="bm-dashboard-pool-item">
                    <div class="bm-pool-header">
                      <strong class="bm-pool-title">{{ pool.title }}</strong>
                      <bm-badge variant="success" size="sm">ACTIVE</bm-badge>
                    </div>
                    <div class="bm-pool-meta">
                      <span>{{ pool.products?.[0]?.productName || 'Community Special' }}</span>
                      <span class="bm-pool-discount">{{ pool.discountPercentage || pool.tiers[0].discountPercentage || 10 }}% OFF</span>
                    </div>
                    <div class="bm-pool-progress-bar">
                      <div class="bm-pool-progress-fill" style="width: 75%;"></div>
                    </div>
                    <div class="bm-pool-footer">
                      <span class="bm-pool-target">Target: {{ pool.minParticipants || 5 }} community buyers</span>
                      <a routerLink="/campaigns" class="bm-pool-view-link">Open Pool &rarr;</a>
                    </div>
                  </div>
                }
              </div>
            </bm-card>
          }

          <!-- Recent Orders Table -->
          <bm-card title="Recent Store Orders" subtitle="Latest pool participations and customer orders">
            <div bmCardAction>
              <a routerLink="/orders" class="bm-card-action-link">Open Full Table</a>
            </div>
            @if (isLoading()) {
              <div class="bm-skeleton-table-wrapper" aria-label="Loading recent orders">
                <bm-skeleton variant="table-row" [count]="4" [columns]="6"></bm-skeleton>
              </div>
            } @else if (recentOrders().length === 0) {
              <div class="bm-empty-dashboard-box">
                <lucide-icon [img]="ShoppingBagIcon" [size]="32"></lucide-icon>
                <strong>No Orders Placed Yet</strong>
                <p>When customers join community group-buying pools, orders will display here with real-time status.</p>
              </div>
            } @else {
              <div class="bm-table-wrapper">
                <table class="bm-table" aria-label="Recent Orders Table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Pool Campaign</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of recentOrders(); track order.id) {
                      <tr>
                        <td class="bm-cell-code">{{ order.orderNumber }}</td>
                        <td class="bm-cell-name">{{ order.customerName }}</td>
                        <td class="bm-cell-pool">{{ order.poolName }}</td>
                        <td class="bm-cell-amount">₹{{ order.totalAmount | number }}</td>
                        <td>
                          <bm-badge [variant]="getOrderBadgeVariant(order.status)" size="sm">
                            {{ getOrderBadgeLabel(order.status) }}
                          </bm-badge>
                        </td>
                        <td class="bm-cell-date">{{ order.createdAt | date:'shortDate' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </bm-card>
        </div>

        <!-- Right: Pickup Queue & Quick Actions -->
        <div class="bm-col-side">
          <!-- Store Pickup Queue -->
          <bm-card title="Active Pickup Queue" subtitle="Customers waiting to collect with 6-digit OTP">
            <div bmCardAction>
              <a routerLink="/orders/pickups" class="bm-card-action-link">Counter View</a>
            </div>
            @if (isLoading()) {
              <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;" aria-label="Loading pickup queue">
                <bm-skeleton variant="rectangular" height="72px" [count]="3"></bm-skeleton>
              </div>
            } @else if (pickupQueue().length === 0) {
              <div class="bm-empty-dashboard-box">
                <lucide-icon [img]="CheckCircle2Icon" [size]="32" class="text-success"></lucide-icon>
                <strong>Pickup Counter Clear</strong>
                <p>No customers currently waiting with OTP codes. All verified orders are completed.</p>
              </div>
            } @else {
              <div class="bm-pickup-list">
                @for (item of pickupQueue(); track item.id) {
                  <div class="bm-pickup-card">
                    <div class="bm-pickup-header">
                      <span class="bm-pickup-code">{{ item.pickupCode }}</span>
                      <bm-badge variant="warning" size="sm" [dot]="true">OTP Verification</bm-badge>
                    </div>
                    <div class="bm-pickup-customer">
                      <strong>{{ item.customerName }}</strong>
                      <span>{{ item.customerPhone }}</span>
                    </div>
                    <div class="bm-pickup-footer">
                      <span>{{ item.itemsCount }} items</span>
                      <a routerLink="/orders/pickups" class="bm-pickup-action-btn">Verify Code &rarr;</a>
                    </div>
                  </div>
                }
              </div>
            }
          </bm-card>

          <!-- Quick Navigation Card -->
          <bm-card title="Quick Operations" subtitle="Fast-track daily store workflows">
            <div class="bm-quick-links">
              @if (authService.userRole() === 'ADMIN') {
                <a routerLink="/admin/merchants" class="bm-quick-item bm-quick-admin">
                  <lucide-icon [img]="ShieldCheckIcon" [size]="16"></lucide-icon>
                  <span>Review Store Applications</span>
                  @if (adminPendingCount() > 0) {
                    <span class="bm-quick-badge">{{ adminPendingCount() }}</span>
                  }
                </a>
                <a routerLink="/orders" class="bm-quick-item">
                  <lucide-icon [img]="ShoppingBagIcon" [size]="16"></lucide-icon>
                  <span>Platform Orders & Failures</span>
                </a>
                <a routerLink="/admin/indexing" class="bm-quick-item">
                  <lucide-icon [img]="DatabaseIcon" [size]="16"></lucide-icon>
                  <span>Search Cluster Indexing</span>
                </a>
              }
              <a routerLink="/campaigns" class="bm-quick-item">
                <lucide-icon [img]="LayersIcon" [size]="16"></lucide-icon>
                <span>Launch Group-Buying Pool</span>
              </a>
              <a routerLink="/store/products" class="bm-quick-item">
                <lucide-icon [img]="ShoppingBagIcon" [size]="16"></lucide-icon>
                <span>Manage Product Catalogue</span>
              </a>
              <a routerLink="/orders/pickups" class="bm-quick-item">
                <lucide-icon [img]="QrCodeIcon" [size]="16"></lucide-icon>
                <span>Customer Pickup OTP Verification</span>
              </a>
              <a routerLink="/my-store" class="bm-quick-item">
                <lucide-icon [img]="CheckCircle2Icon" [size]="16"></lucide-icon>
                <span>Store Profile & Operating Hours</span>
              </a>
            </div>
          </bm-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bm-dashboard-page {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    // Live Banner
    .bm-live-banner {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-left: 3px solid var(--bm-color-primary);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);

      &.admin-theme {
        border-left-color: #0284C7;
      }
    }

    .bm-live-badge {
      font-size: 10px;
      font-weight: var(--bm-font-weight-bold);
      background-color: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
      padding: 2px 6px;
      border-radius: var(--bm-radius-sm);
      letter-spacing: 0.05em;

      &.admin-badge {
        background-color: #E0F2FE;
        color: #0369A1;
      }
    }

    .bm-live-text {
      color: var(--bm-color-text-secondary);
      margin: 0;

      strong {
        color: var(--bm-color-text-primary);
      }
    }

    // Onboarding Banner
    .bm-onboarding-banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      background-color: #FFFBEB;
      border: 1px solid #FDE68A;
      border-left: 3px solid #D97706;
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
    }

    .bm-onboarding-badge {
      font-size: 10px;
      font-weight: var(--bm-font-weight-bold);
      background-color: #FEF3C7;
      color: #92400E;
      padding: 2px 6px;
      border-radius: var(--bm-radius-sm);
      letter-spacing: 0.05em;
    }

    .bm-onboarding-text {
      color: #78350F;
      margin: 0;
      flex: 1;

      strong {
        color: #451A03;
      }
    }

    .bm-onboarding-link {
      font-weight: var(--bm-font-weight-semibold);
      color: #92400E;
      text-decoration: underline;
    }

    // Metrics Grid
    .bm-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--bm-space-4);
    }

    .bm-metric-card {
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      padding: var(--bm-space-4) var(--bm-space-5);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-1);
      box-shadow: var(--bm-shadow-xs);
    }

    .bm-metric-label {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-secondary);
    }

    .bm-metric-value-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--bm-space-2);
    }

    .bm-metric-value {
      font-size: var(--bm-font-size-2xl);
      font-weight: var(--bm-font-weight-bold);
      color: var(--bm-color-text-primary);
      letter-spacing: -0.02em;
    }

    .bm-metric-trend {
      font-size: 11px;
      font-weight: var(--bm-font-weight-medium);
      padding: 2px 6px;
      border-radius: var(--bm-radius-full);
      white-space: nowrap;

      &.trend-positive {
        color: var(--bm-color-primary);
        background-color: var(--bm-color-primary-soft);
      }

      &.trend-neutral {
        color: var(--bm-color-text-secondary);
        background-color: var(--bm-color-surface-subtle);
      }

      &.trend-negative {
        color: var(--bm-color-danger);
        background-color: var(--bm-color-danger-bg);
      }
    }

    .bm-metric-subtext {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    // Columns Layout
    .bm-dashboard-columns {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-6);

      @media (min-width: 1024px) {
        grid-template-columns: 2fr 1fr;
      }
    }

    .bm-col-main {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    .bm-col-side {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    // Timeframe switcher
    .bm-timeframe-switcher {
      display: inline-flex;
      background: var(--bm-color-surface-subtle, #F1F5F9);
      border-radius: var(--bm-radius-md, 8px);
      padding: 2px;
      gap: 2px;
    }

    .bm-timeframe-btn {
      border: none;
      background: transparent;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 500;
      color: var(--bm-color-text-secondary, #64748B);
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--bm-transition-fast, 150ms);

      &:hover {
        color: var(--bm-color-text-primary, #0F172A);
      }

      &.active {
        background: #FFFFFF;
        color: var(--bm-color-primary, #176B50);
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
      }
    }

    // Chart container
    .bm-chart-container {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-4);
      padding-top: var(--bm-space-2);
    }

    .bm-chart-bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 160px;
      padding-bottom: var(--bm-space-2);
      border-bottom: 1px solid var(--bm-color-border);
    }

    .bm-chart-bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bm-space-2);
      height: 100%;
      justify-content: flex-end;
      flex: 1;
    }

    .bm-bar-pair {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 100%;
    }

    .bm-bar {
      width: 12px;
      border-radius: var(--bm-radius-sm) var(--bm-radius-sm) 0 0;
      transition: height var(--bm-transition-normal);

      &.bm-bar-orders {
        background-color: var(--bm-color-primary);
      }

      &.bm-bar-pickups {
        background-color: #99CEBC;
      }
    }

    .bm-chart-day {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    .bm-chart-legend {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--bm-space-5);
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
    }

    .bm-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bm-legend-swatch {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    // Active Pools Grid
    .bm-dashboard-pools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--bm-space-3);
      padding: var(--bm-space-4);
    }

    .bm-dashboard-pool-item {
      background-color: var(--bm-color-surface-subtle, #f8fafc);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: var(--bm-space-3);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bm-pool-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .bm-pool-title {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-semibold);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bm-pool-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--bm-color-text-secondary);
    }

    .bm-pool-discount {
      font-weight: var(--bm-font-weight-bold);
      color: var(--bm-color-accent, #22C55E);
    }

    .bm-pool-progress-bar {
      height: 6px;
      background: var(--bm-color-border);
      border-radius: 9999px;
      overflow: hidden;
      margin: 4px 0;
    }

    .bm-pool-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--bm-color-primary) 0%, var(--bm-color-accent, #22C55E) 100%);
      border-radius: 9999px;
    }

    .bm-pool-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: var(--bm-color-text-muted);
    }

    .bm-pool-view-link {
      color: var(--bm-color-primary);
      font-weight: var(--bm-font-weight-medium);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    // Recent Orders Table
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
        color: var(--bm-color-text-primary);
        white-space: nowrap;
      }

      tr:last-child td {
        border-bottom: none;
      }
    }

    .bm-cell-code {
      font-family: var(--bm-font-mono);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-cell-name {
      font-weight: var(--bm-font-weight-medium);
    }

    .bm-cell-pool {
      color: var(--bm-color-text-secondary);
    }

    .bm-cell-amount {
      font-weight: var(--bm-font-weight-semibold);
    }

    .bm-cell-date {
      color: var(--bm-color-text-muted);
    }

    // Pickup Queue List
    .bm-pickup-list {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
    }

    .bm-pickup-card {
      padding: var(--bm-space-3) var(--bm-space-4);
      background-color: var(--bm-color-surface-subtle);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-2);
    }

    .bm-pickup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-pickup-code {
      font-family: var(--bm-font-mono);
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-bold);
      color: var(--bm-color-primary);
    }

    .bm-pickup-customer {
      display: flex;
      flex-direction: column;
      font-size: var(--bm-font-size-xs);

      span {
        color: var(--bm-color-text-muted);
        font-size: 11px;
      }
    }

    .bm-pickup-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--bm-color-text-muted);
      border-top: 1px dashed var(--bm-color-border);
      padding-top: 4px;
    }

    .bm-pickup-action-btn {
      font-size: 11px;
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .bm-card-action-link {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .bm-empty-dashboard-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--bm-space-8) var(--bm-space-4);
      text-align: center;
      color: var(--bm-color-text-secondary);
      gap: var(--bm-space-2);

      strong {
        color: var(--bm-color-text-primary);
        font-size: var(--bm-font-size-sm);
      }

      p {
        margin: 0;
        font-size: var(--bm-font-size-xs);
        color: var(--bm-color-text-muted);
        max-width: 280px;
      }

      .text-success {
        color: var(--bm-color-accent, #22C55E);
      }
    }

    // Quick links
    .bm-quick-links {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-2);
    }

    .bm-quick-item {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-2) var(--bm-space-3);
      border-radius: var(--bm-radius-md);
      color: var(--bm-color-text-primary);
      text-decoration: none;
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      transition: background-color var(--bm-transition-fast);

      &:hover {
        background-color: var(--bm-color-surface-subtle);
        color: var(--bm-color-primary);
      }
    }

    .bm-quick-admin {
      background-color: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);

      &:hover {
        background-color: #D6ECE0;
        color: var(--bm-color-primary-hover);
      }
    }

    .bm-quick-badge {
      margin-left: auto;
      background-color: var(--bm-color-warning);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: var(--bm-radius-full);
    }

    // Admin Banner
    .bm-admin-banner {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3);
      padding: var(--bm-space-4);
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-left: 4px solid var(--bm-color-primary);
      border-radius: var(--bm-radius-md);

      @media (min-width: 640px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .bm-admin-banner-left {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-admin-banner-icon {
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

    .bm-admin-banner-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-admin-banner-title {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
    }

    .bm-badge-alert {
      font-size: 11px;
      font-weight: 700;
      background-color: #FEF3C7;
      color: #92400E;
      padding: 1px 7px;
      border-radius: var(--bm-radius-full);
      border: 1px solid rgba(217, 119, 6, 0.3);
    }

    .bm-admin-banner-sub {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
    }

    .bm-admin-banner-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background-color: var(--bm-color-primary);
      color: #FFFFFF;
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      text-decoration: none;
      white-space: nowrap;
      transition: background-color var(--bm-transition-fast);

      &:hover {
        background-color: var(--bm-color-primary-hover);
      }
    }
  `],
})
export class DashboardPageComponent implements OnInit {
  private readonly mockService = inject(DashboardMockService);
  private readonly adminService = inject(AdminMerchantService);
  private readonly orderService = inject(OrderService);
  private readonly poolService = inject(PoolService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly ShoppingBagIcon = ShoppingBag;
  readonly LayersIcon = Layers;
  readonly QrCodeIcon = QrCode;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ArrowUpRightIcon = ArrowUpRight;
  readonly RefreshCwIcon = RefreshCw;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly DatabaseIcon = Database;

  readonly isLiveStore = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly metrics = signal<DashboardMetric[]>([]);
  readonly recentOrders = signal<DashboardRecentOrder[]>([]);
  readonly pickupQueue = signal<DashboardPickupItem[]>([]);
  readonly activityChart = signal<ActivityDay[]>([]);
  readonly activePoolsList = signal<PoolRecord[]>([]);
  readonly allOrders = signal<OrderRecord[]>([]);
  readonly chartTimeframe = signal<'7d' | '14d' | '30d'>('7d');

  readonly adminPendingCount = signal<number>(0);
  readonly adminAllCount = signal<number>(0);

  readonly lineChartData = computed<LineChartPoint[]>(() => {
    const orders = this.allOrders();
    const timeframe = this.chartTimeframe();
    const daysCount = timeframe === '30d' ? 30 : timeframe === '14d' ? 14 : 7;
    const result: LineChartPoint[] = [];
    const now = new Date();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateIso = d.toISOString().slice(0, 10);
      const dayOfMonth = d.getDate();
      const monthStr = shortMonths[d.getMonth()];
      const dayOfWeek = days[d.getDay()];

      const label = i === 0 ? 'Today' : daysCount <= 7 ? dayOfWeek : `${dayOfMonth} ${monthStr}`;
      const dateLabel = `${dayOfWeek}, ${dayOfMonth} ${monthStr} ${d.getFullYear()}`;

      const dayOrders = orders.filter((o) => o.createdAt?.slice(0, 10) === dateIso);
      const ordersCount = dayOrders.length;
      const revenue = dayOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);

      const pickupsCount = orders.filter((o) =>
        (o.status === 'COMPLETED' || o.status === 'READY_FOR_PICKUP') &&
        (o.readyForPickupAt?.slice(0, 10) === dateIso || o.completedAt?.slice(0, 10) === dateIso)
      ).length;

      result.push({
        label,
        dateLabel,
        series1Value: ordersCount,
        series2Value: pickupsCount,
        revenue,
      });
    }

    return result;
  });

  readonly chartMaxVal = computed(() => {
    const list = this.activityChart();
    if (list.length === 0) return 10;
    return Math.max(1, ...list.map((c) => Math.max(c.orders, c.pickups)));
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  refreshDashboard(): void {
    this.toast.info('Refreshing live operational metrics...');
    this.loadDashboardData();
  }

  isStoreApproved(): boolean {
    return this.authService.currentMerchant()?.status === 'APPROVED';
  }

  isCurrencyMetric(label: string): boolean {
    const lower = label.toLowerCase();
    return lower.includes('revenue') || lower.includes('volume') || lower.includes('gmv') || lower.includes('sales');
  }

  getBarHeight(val: number): number {
    const max = this.chartMaxVal();
    if (max === 0 || val === 0) return 4;
    return Math.min(100, Math.max(8, Math.round((val / max) * 95)));
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    if (this.authService.userRole() === 'ADMIN') {
      this.loadAdminPlatformMetrics();
    } else if (this.isStoreApproved()) {
      this.loadLiveStoreMetrics();
    } else {
      this.loadPendingMerchantDashboard();
    }
  }

  private loadLiveStoreMetrics(): void {
    forkJoin({
      orders: this.orderService.listMerchantOrders({ limit: 100 }),
      readyOrders: this.orderService.listReadyForPickupOrders({ limit: 10 }),
      pools: this.poolService.listMerchantPools({ limit: 100 }),
      products: this.productService.listProducts({ limit: 100 }),
    }).subscribe({
      next: ({ orders, readyOrders, pools, products }) => {
        this.isLiveStore.set(true);
        this.isLoading.set(false);
        this.allOrders.set(orders.data);

        const totalOrders = orders.pagination?.total ?? orders.data.length;
        const placedCount = orders.data.filter((o) => o.status === 'PLACED').length;
        const completedCount = orders.data.filter((o) => o.status === 'COMPLETED').length;
        const readyCount = readyOrders.pagination?.total ?? readyOrders.data.length;
        const activePoolsCount = pools.data.filter((p) => p.status === 'ACTIVE').length;
        const totalProducts = products.pagination?.total ?? products.data.length;
        const storeGMV = orders.data.reduce((sum, o) => sum + (o.finalAmount || 0), 0);

        this.metrics.set([
          {
            label: 'Total Store Orders',
            value: totalOrders,
            subtext: `${completedCount} fulfilled, ${placedCount} active`,
            trend: totalOrders > 0 ? 'Live store sync' : 'Awaiting first order',
            trendType: 'positive',
          },
          {
            label: 'Store Revenue (GMV)',
            value: storeGMV,
            subtext: `From ${completedCount + placedCount} group purchases`,
            trend: storeGMV > 0 ? 'Gross Sales' : 'Zero sales yet',
            trendType: 'positive',
          },
          {
            label: 'Ready for Pickup',
            value: readyCount,
            subtext: 'Awaiting customer OTP verification',
            trend: readyCount > 0 ? 'Action required at counter' : 'Counter clear',
            trendType: readyCount > 0 ? 'neutral' : 'positive',
          },
          {
            label: 'Active Campaigns',
            value: activePoolsCount,
            subtext: `${pools.data.length} total group pools`,
            trend: activePoolsCount > 0 ? 'Pooling active' : 'Launch new pool',
            trendType: 'positive',
          },
          {
            label: 'Catalog Products',
            value: totalProducts,
            subtext: 'Available for community buying',
            trend: 'In store',
            trendType: 'positive',
          },
        ]);

        if (orders.data.length > 0) {
          const mappedOrders: DashboardRecentOrder[] = orders.data.slice(0, 5).map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: `Customer #${o.userId.slice(-4).toUpperCase()}`,
            itemsCount: o.items.reduce((s, it) => s + it.quantity, 0),
            totalAmount: o.finalAmount,
            status: o.status === 'PLACED' ? 'PENDING' : (o.status as any),
            poolName: o.items[0]?.productName || `Pool #${o.poolId.slice(-4)}`,
            createdAt: o.createdAt,
          }));
          this.recentOrders.set(mappedOrders);
          this.activityChart.set(this.calculateActivityChart(orders.data));
        } else {
          this.recentOrders.set([]);
          this.activityChart.set(this.calculateActivityChart([]));
        }

        if (readyOrders.data.length > 0) {
          const mappedPickups: DashboardPickupItem[] = readyOrders.data.slice(0, 5).map((o) => ({
            id: o.id,
            pickupCode: o.orderNumber,
            customerName: `Customer #${o.userId.slice(-4).toUpperCase()}`,
            customerPhone: 'WhatsApp Code Dispatched',
            itemsCount: o.items.reduce((s, it) => s + it.quantity, 0),
            otpStatus: 'PENDING_OTP',
            readySince: o.readyForPickupAt || o.updatedAt,
          }));
          this.pickupQueue.set(mappedPickups);
        } else {
          this.pickupQueue.set([]);
        }

        const activePoolRecords = pools.data.filter((p) => p.status === 'ACTIVE').slice(0, 4);
        this.activePoolsList.set(activePoolRecords);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadFallbackMock();
      },
    });
  }

  private loadAdminPlatformMetrics(): void {
    forkJoin({
      applications: this.adminService.listApplications(),
      orders: this.orderService.listAdminOrders({ limit: 100 }),
      failures: this.orderService.inspectFailures(),
      pools: this.poolService.listMerchantPools({ limit: 100 }),
    }).subscribe({
      next: ({ applications, orders, failures, pools }) => {
        this.isLiveStore.set(true);
        this.isLoading.set(false);
        this.allOrders.set(orders.data);

        const pendingApps = applications.filter((a) => a.status === 'PENDING_REVIEW').length;
        this.adminAllCount.set(applications.length);
        this.adminPendingCount.set(pendingApps);

        const totalOrders = orders.pagination?.total ?? orders.data.length;
        const totalGMV = orders.data.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
        const adminActivePoolsCount = pools.data.filter((p) => p.status === 'ACTIVE').length;
        const totalFailures =
          (failures.failedPickupNotifications?.length || 0) +
          (failures.orderNotificationFailures?.length || 0) +
          (failures.expiredOrLockedPickups?.length || 0);

        this.metrics.set([
          {
            label: 'Store Applications',
            value: applications.length,
            subtext: `${pendingApps} awaiting KYC approval`,
            trend: pendingApps > 0 ? 'Requires Action' : 'All Approved',
            trendType: pendingApps > 0 ? 'neutral' : 'positive',
          },
          {
            label: 'Platform Orders',
            value: totalOrders,
            subtext: 'Across all Kerala partner stores',
            trend: 'Live platform sync',
            trendType: 'positive',
          },
          {
            label: 'Platform Volume (GMV)',
            value: totalGMV,
            subtext: `Avg ₹${totalOrders > 0 ? Math.round(totalGMV / totalOrders) : 0} per order`,
            trend: 'Gross Value',
            trendType: 'positive',
          },
          {
            label: 'Active Community Pools',
            value: adminActivePoolsCount,
            subtext: `${pools.data.length} total campaigns created`,
            trend: adminActivePoolsCount > 0 ? 'Pooling Live' : 'No active pools',
            trendType: 'positive',
          },
          {
            label: 'System Diagnostic Alerts',
            value: totalFailures,
            subtext: `${failures.failedPickupNotifications?.length || 0} delivery outbox alerts`,
            trend: totalFailures === 0 ? 'System Healthy' : 'Action Required',
            trendType: totalFailures === 0 ? 'positive' : 'negative',
          },
        ]);

        if (orders.data.length > 0) {
          const mappedOrders: DashboardRecentOrder[] = orders.data.slice(0, 5).map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: `Customer #${o.userId.slice(-4).toUpperCase()}`,
            itemsCount: o.items.reduce((s, it) => s + it.quantity, 0),
            totalAmount: o.finalAmount,
            status: o.status === 'PLACED' ? 'PENDING' : (o.status as any),
            poolName: o.items[0]?.productName || `Pool #${o.poolId.slice(-4)}`,
            createdAt: o.createdAt,
          }));
          this.recentOrders.set(mappedOrders);
          this.activityChart.set(this.calculateActivityChart(orders.data));
        } else {
          this.recentOrders.set([]);
          this.activityChart.set(this.calculateActivityChart([]));
        }

        const adminActivePoolRecords = pools.data.filter((p) => p.status === 'ACTIVE').slice(0, 4);
        this.activePoolsList.set(adminActivePoolRecords);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadFallbackMock();
      },
    });
  }

  private loadPendingMerchantDashboard(): void {
    this.isLoading.set(false);
    this.isLiveStore.set(false);
    this.allOrders.set([]);

    const store = this.authService.currentMerchant();
    this.metrics.set([
      {
        label: 'Application Status',
        value: 1,
        subtext: store?.status === 'PENDING_REVIEW' ? 'Under Territory Review' : 'Draft Incomplete',
        trend: 'Verification In Progress',
        trendType: 'neutral',
      },
      {
        label: 'Operating Territory',
        value: 1,
        subtext: store?.city ? `${store.city}, Kerala` : 'Kerala Region',
        trend: 'Assigned Hub',
        trendType: 'positive',
      },
      {
        label: 'Community Pool Access',
        value: 0,
        subtext: 'Unlocks upon store verification',
        trend: 'Locked',
        trendType: 'neutral',
      },
      {
        label: 'Product Catalogue',
        value: 0,
        subtext: 'Ready to configure after approval',
        trend: 'Pending',
        trendType: 'neutral',
      },
    ]);

    this.activityChart.set(this.calculateActivityChart([]));
    this.recentOrders.set([]);
    this.pickupQueue.set([]);
  }

  private loadFallbackMock(): void {
    this.mockService.getMockMetrics().subscribe((res) => this.metrics.set(res));
    this.mockService.getMockRecentOrders().subscribe((res) => this.recentOrders.set(res));
    this.mockService.getMockPickupQueue().subscribe((res) => this.pickupQueue.set(res));
    this.mockService.getMockActivityChart().subscribe((res) => this.activityChart.set(res));
  }

  private calculateActivityChart(orders: OrderRecord[]): ActivityDay[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: ActivityDay[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = days[d.getDay()];
      const dateStr = d.toISOString().slice(0, 10);

      const ordersOnDay = orders.filter((o) => o.createdAt?.slice(0, 10) === dateStr).length;
      const pickupsOnDay = orders.filter((o) =>
        (o.status === 'COMPLETED' || o.status === 'READY_FOR_PICKUP') &&
        (o.readyForPickupAt?.slice(0, 10) === dateStr || o.completedAt?.slice(0, 10) === dateStr)
      ).length;

      result.push({
        day: i === 0 ? 'Today' : dayLabel,
        orders: ordersOnDay,
        pickups: pickupsOnDay,
      });
    }

    return result;
  }

  getOrderBadgeVariant(status: DashboardRecentOrder['status']): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'READY_FOR_PICKUP': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PENDING': return 'neutral';
      case 'CANCELLED': return 'danger';
    }
  }

  getOrderBadgeLabel(status: DashboardRecentOrder['status']): string {
    switch (status) {
      case 'READY_FOR_PICKUP': return 'Ready for Pickup';
      case 'CONFIRMED': return 'Confirmed';
      case 'COMPLETED': return 'Fulfilled';
      case 'PENDING': return 'Pending Target';
      case 'CANCELLED': return 'Cancelled';
    }
  }
}
