import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Layers,
  LucideAngularModule,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
} from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AdminMerchantService } from '../../../../core/services/admin-merchant.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
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
  ],
  template: `
    <div class="bm-dashboard-page">
      <bm-page-header
        title="Store Operations Dashboard"
        subtitle="Kerala community group buying, campaign progression & pickup queue"
      ></bm-page-header>

      <!-- Admin Store Verification Banner (Prominent when user is Admin) -->
      @if (authService.userRole() === 'ADMIN' && adminPendingCount() > 0) {
        <div class="bm-admin-banner">
          <div class="bm-admin-banner-left">
            <div class="bm-admin-banner-icon">
              <lucide-icon [img]="ShieldCheckIcon" [size]="22"></lucide-icon>
            </div>
            <div class="bm-admin-banner-text">
              <span class="bm-admin-banner-title">
                Platform Store Verification
                @if (adminPendingCount() > 0) {
                  <span class="bm-badge-alert">{{ adminPendingCount() }} Pending Review</span>
                }
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

      <!-- Isolated Mock Data Notice -->
      <div class="bm-mock-banner" role="note">
        <div class="bm-mock-badge">DEV PREVIEW</div>
        <p class="bm-mock-text">
          Metrics below reflect <strong>isolated development mock data</strong>.
          Live store metrics will connect as backend analytics endpoints are published.
        </p>
      </div>

      <!-- Key Metric Cards Grid -->
      <div class="bm-metrics-grid">
        @for (metric of metrics(); track metric.label) {
          <div class="bm-metric-card">
            <span class="bm-metric-label">{{ metric.label }}</span>
            <div class="bm-metric-value-row">
              <span class="bm-metric-value">{{ metric.value }}</span>
              <span class="bm-metric-trend" [class]="'trend-' + metric.trendType">
                {{ metric.trend }}
              </span>
            </div>
            <span class="bm-metric-subtext">{{ metric.subtext }}</span>
          </div>
        }
      </div>

      <!-- Main Operational Area: Activity Chart & Recent Orders -->
      <div class="bm-dashboard-columns">
        <!-- Left: Activity Chart & Recent Orders -->
        <div class="bm-col-main">
          <!-- Order & Pickup Activity -->
          <bm-card title="Order & Pickup Volume" subtitle="Daily group-buying activity over the last 7 days">
            <div class="bm-chart-container">
              <div class="bm-chart-bars">
                @for (day of activityChart(); track day.day) {
                  <div class="bm-chart-bar-col">
                    <div class="bm-bar-pair">
                      <div
                        class="bm-bar bm-bar-orders"
                        [style.height.%]="(day.orders / 35) * 100"
                        [title]="day.orders + ' orders'"
                      ></div>
                      <div
                        class="bm-bar bm-bar-pickups"
                        [style.height.%]="(day.pickups / 35) * 100"
                        [title]="day.pickups + ' pickups'"
                      ></div>
                    </div>
                    <span class="bm-chart-day">{{ day.day }}</span>
                  </div>
                }
              </div>

              <div class="bm-chart-legend">
                <div class="bm-legend-item">
                  <span class="bm-legend-swatch bm-bar-orders"></span>
                  <span>Orders Placed</span>
                </div>
                <div class="bm-legend-item">
                  <span class="bm-legend-swatch bm-bar-pickups"></span>
                  <span>Customer Pickups</span>
                </div>
              </div>
            </div>
          </bm-card>

          <!-- Recent Orders Table -->
          <bm-card title="Recent Store Orders" subtitle="Latest pool participations and customer orders">
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
                      <td class="bm-cell-amount">₹{{ order.totalAmount }}</td>
                      <td>
                        <bm-badge [variant]="getOrderBadgeVariant(order.status)" size="sm">
                          {{ getOrderBadgeLabel(order.status) }}
                        </bm-badge>
                      </td>
                      <td class="bm-cell-date">{{ order.createdAt }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </bm-card>
        </div>

        <!-- Right: Pickup Queue & Quick Actions -->
        <div class="bm-col-side">
          <!-- Store Pickup Queue -->
          <bm-card title="Active Pickup Queue" subtitle="Customers waiting to collect with 6-digit OTP">
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
                    <span class="bm-time-muted">{{ item.readySince }}</span>
                  </div>
                </div>
              }
            </div>
          </bm-card>

          <!-- Quick Navigation Card -->
          <bm-card title="Quick Operations">
            <div class="bm-quick-links">
              @if (authService.userRole() === 'ADMIN') {
                <a routerLink="/admin/merchants" class="bm-quick-item bm-quick-admin">
                  <lucide-icon [img]="ShieldCheckIcon" [size]="16"></lucide-icon>
                  <span>Store Applications</span>
                  @if (adminPendingCount() > 0) {
                    <span class="bm-quick-badge">{{ adminPendingCount() }}</span>
                  }
                </a>
              }
              <a routerLink="/store/products" class="bm-quick-item">
                <lucide-icon [img]="ShoppingBagIcon" [size]="16"></lucide-icon>
                <span>Product Catalogue</span>
              </a>
              <a routerLink="/campaigns" class="bm-quick-item">
                <lucide-icon [img]="LayersIcon" [size]="16"></lucide-icon>
                <span>Group Buying Campaigns</span>
              </a>
              <a routerLink="/orders/pickups" class="bm-quick-item">
                <lucide-icon [img]="QrCodeIcon" [size]="16"></lucide-icon>
                <span>Store Pickup Verification</span>
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

    // Mock Banner
    .bm-mock-banner {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-left: 3px solid var(--bm-color-info);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-xs);
    }

    .bm-mock-badge {
      font-size: 10px;
      font-weight: var(--bm-font-weight-bold);
      background-color: var(--bm-color-info-bg);
      color: var(--bm-color-info);
      padding: 2px 6px;
      border-radius: var(--bm-radius-sm);
      letter-spacing: 0.05em;
    }

    .bm-mock-text {
      color: var(--bm-color-text-secondary);
      margin: 0;

      strong {
        color: var(--bm-color-text-primary);
      }
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
      margin: 4px 0 2px;
    }

    .bm-metric-value {
      font-size: var(--bm-font-size-2xl);
      font-weight: var(--bm-font-weight-bold);
      color: var(--bm-color-text-primary);
      letter-spacing: -0.02em;
      line-height: 1;
    }

    .bm-metric-trend {
      font-size: 11px;
      font-weight: var(--bm-font-weight-medium);

      &.trend-positive { color: var(--bm-color-success); }
      &.trend-neutral { color: var(--bm-color-text-secondary); }
      &.trend-negative { color: var(--bm-color-danger); }
    }

    .bm-metric-subtext {
      font-size: 11px;
      color: var(--bm-color-text-muted);
    }

    // Two-column layout
    .bm-dashboard-columns {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--bm-space-6);

      @media (min-width: 1024px) {
        grid-template-columns: 2fr 1fr;
      }
    }

    .bm-col-main, .bm-col-side {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-6);
    }

    // Activity Chart
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
      color: var(--bm-color-text-secondary);
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
      padding: var(--bm-space-3);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-bg);
      display: flex;
      flex-direction: column;
      gap: 6px;
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

      strong {
        color: var(--bm-color-text-primary);
      }

      span {
        color: var(--bm-color-text-secondary);
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
      gap: 8px;
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
  readonly authService = inject(AuthService);

  readonly ShoppingBagIcon = ShoppingBag;
  readonly LayersIcon = Layers;
  readonly QrCodeIcon = QrCode;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ArrowUpRightIcon = ArrowUpRight;

  readonly metrics = signal<DashboardMetric[]>([]);
  readonly recentOrders = signal<DashboardRecentOrder[]>([]);
  readonly pickupQueue = signal<DashboardPickupItem[]>([]);
  readonly activityChart = signal<ActivityDay[]>([]);

  readonly adminPendingCount = signal<number>(0);
  readonly adminAllCount = signal<number>(0);

  ngOnInit(): void {
    this.mockService.getMockMetrics().subscribe((res) => this.metrics.set(res));
    this.mockService.getMockRecentOrders().subscribe((res) => this.recentOrders.set(res));
    this.mockService.getMockPickupQueue().subscribe((res) => this.pickupQueue.set(res));
    this.mockService.getMockActivityChart().subscribe((res) => this.activityChart.set(res));

    if (this.authService.userRole() === 'ADMIN') {
      this.adminService.listApplications().subscribe({
        next: (apps) => {
          this.adminAllCount.set(apps.length);
          this.adminPendingCount.set(apps.filter((a) => a.status === 'PENDING_REVIEW').length);
        },
      });
    }
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
