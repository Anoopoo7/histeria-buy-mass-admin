import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  Boxes,
  ChevronDown,
  Layers,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  Menu,
  QrCode,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Users,
  X,
} from 'lucide-angular';
import { AuthService } from '../../core/auth/services/auth.service';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { DropdownComponent } from '../../shared/ui/dropdown/dropdown.component';

@Component({
  selector: 'bm-dashboard-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    AvatarComponent,
    BadgeComponent,
    DropdownComponent,
  ],
  template: `
    <div class="bm-shell">
      <!-- Mobile Backdrop -->
      @if (isMobileMenuOpen()) {
        <div class="bm-sidebar-backdrop" (click)="closeMobileMenu()"></div>
      }

      <!-- Sidebar -->
      <aside class="bm-sidebar" [class.is-open]="isMobileMenuOpen()">
        <div class="bm-sidebar-header">
          <div class="bm-brand">
            <lucide-icon [img]="StoreIcon" [size]="20" class="bm-brand-icon"></lucide-icon>
            <div class="bm-brand-info">
              <span class="bm-brand-title">BuyMass</span>
              <span class="bm-brand-sub">Store Admin</span>
            </div>
          </div>
          <button
            type="button"
            class="bm-mobile-close"
            (click)="closeMobileMenu()"
            aria-label="Close navigation"
          >
            <lucide-icon [img]="CloseIcon" [size]="18"></lucide-icon>
          </button>
        </div>

        <nav class="bm-sidebar-nav" aria-label="Main Navigation">
          <!-- Overview Section -->
          <div class="bm-nav-group">
            <span class="bm-nav-group-title">Overview</span>
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="DashboardIcon" [size]="18"></lucide-icon>
              <span>Dashboard</span>
            </a>
          </div>

          <!-- Store Management Section -->
          <div class="bm-nav-group">
            <span class="bm-nav-group-title">Store Management</span>
            <a
              routerLink="/store/overview"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="StoreIcon" [size]="18"></lucide-icon>
              <span>My Store</span>
              @if (authService.currentMerchant()?.status) {
                <bm-badge
                  [variant]="authService.currentMerchant()?.status === 'APPROVED' ? 'success' : 'warning'"
                  size="sm"
                >
                  {{ authService.currentMerchant()?.status }}
                </bm-badge>
              }
            </a>
            <a
              routerLink="/store/products"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="ProductsIcon" [size]="18"></lucide-icon>
              <span>Products</span>
            </a>
            <a
              routerLink="/store/inventory"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="InventoryIcon" [size]="18"></lucide-icon>
              <span>Inventory</span>
            </a>
          </div>

          <!-- Admin Portal (Only visible to ADMIN role) -->
          @if (isAdmin()) {
            <div class="bm-nav-group bm-admin-nav-group">
              <span class="bm-nav-group-title">Platform Administration</span>
              <a
                routerLink="/admin/merchants"
                routerLinkActive="active"
                (click)="closeMobileMenu()"
                class="bm-nav-item"
              >
                <lucide-icon [img]="ShieldCheckIcon" [size]="18"></lucide-icon>
                <span>Store Applications</span>
              </a>
            </div>
          }

          <!-- Group Buying Section -->
          <div class="bm-nav-group">
            <span class="bm-nav-group-title">Group Buying</span>
            <a
              routerLink="/campaigns"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="PoolsIcon" [size]="18"></lucide-icon>
              <span>Campaigns / Pools</span>
            </a>
          </div>

          <!-- Orders Section -->
          <div class="bm-nav-group">
            <span class="bm-nav-group-title">Orders & Fulfillment</span>
            <a
              routerLink="/orders"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="OrdersIcon" [size]="18"></lucide-icon>
              <span>All Orders</span>
            </a>
            <a
              routerLink="/orders/pickups"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="PickupIcon" [size]="18"></lucide-icon>
              <span>Store Pickups</span>
            </a>
          </div>

          <!-- Account Section -->
          <div class="bm-nav-group">
            <span class="bm-nav-group-title">Account</span>
            <a
              routerLink="/settings/profile"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="UserIcon" [size]="18"></lucide-icon>
              <span>Profile</span>
            </a>
            <a
              routerLink="/settings"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeMobileMenu()"
              class="bm-nav-item"
            >
              <lucide-icon [img]="SettingsIcon" [size]="18"></lucide-icon>
              <span>Settings</span>
            </a>
            <button
              type="button"
              (click)="handleLogout()"
              class="bm-nav-item bm-nav-logout"
            >
              <lucide-icon [img]="LogoutIcon" [size]="18"></lucide-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      <!-- Main Shell Area -->
      <div class="bm-main-area">
        <!-- Top Header -->
        <header class="bm-header">
          <div class="bm-header-left">
            <button
              type="button"
              class="bm-menu-toggle"
              (click)="toggleMobileMenu()"
              aria-label="Toggle navigation menu"
            >
              <lucide-icon [img]="MenuIcon" [size]="20"></lucide-icon>
            </button>

            <!-- Store Selector / Status -->
            <div class="bm-store-indicator">
              <span class="bm-store-name">
                {{ authService.currentMerchant()?.storeName || 'Kerala Storefront' }}
              </span>
              <bm-badge
                [variant]="merchantBadgeVariant()"
                size="sm"
                [dot]="true"
              >
                {{ merchantBadgeLabel() }}
              </bm-badge>
            </div>
          </div>

          <!-- Top Header Right: Profile Dropdown -->
          <div class="bm-header-right">
            <bm-dropdown align="right">
              <div bmDropdownTrigger class="bm-profile-trigger">
                <bm-avatar
                  [name]="userName()"
                  size="sm"
                ></bm-avatar>
                <div class="bm-profile-meta">
                  <span class="bm-user-name">{{ userName() }}</span>
                  <span class="bm-user-role">{{ userRoleLabel() }}</span>
                </div>
                <lucide-icon [img]="ChevronDownIcon" [size]="14" class="bm-chevron"></lucide-icon>
              </div>

              <div bmDropdownContent class="bm-profile-dropdown-content">
                <div class="bm-dropdown-user-header">
                  <div class="bm-dropdown-user-name">{{ userName() }}</div>
                  <div class="bm-dropdown-user-email">{{ userEmail() }}</div>
                </div>

                <div class="bm-dropdown-divider"></div>

                <a
                  routerLink="/settings/profile"
                  class="bm-dropdown-item"
                >
                  <lucide-icon [img]="UserIcon" [size]="16"></lucide-icon>
                  <span>My Profile</span>
                </a>
                <a
                  routerLink="/settings"
                  class="bm-dropdown-item"
                >
                  <lucide-icon [img]="SettingsIcon" [size]="16"></lucide-icon>
                  <span>Store Settings</span>
                </a>

                <div class="bm-dropdown-divider"></div>

                <button
                  type="button"
                  class="bm-dropdown-item bm-dropdown-logout"
                  (click)="handleLogout()"
                >
                  <lucide-icon [img]="LogoutIcon" [size]="16"></lucide-icon>
                  <span>Sign Out</span>
                </button>
              </div>
            </bm-dropdown>
          </div>
        </header>

        <!-- Main Viewport Router Outlet -->
        <main class="bm-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .bm-shell {
      display: flex;
      min-height: 100vh;
      background-color: var(--bm-color-bg);
    }

    // Sidebar
    .bm-sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      width: var(--bm-sidebar-width);
      background-color: var(--bm-color-surface);
      border-right: 1px solid var(--bm-color-border);
      display: flex;
      flex-direction: column;
      z-index: 100;
      transition: transform var(--bm-transition-normal);

      @media (max-width: 1023px) {
        transform: translateX(-100%);

        &.is-open {
          transform: translateX(0);
        }
      }
    }

    .bm-sidebar-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.4);
      z-index: 99;
      animation: fadeIn 150ms ease-out;
    }

    .bm-sidebar-header {
      height: var(--bm-header-height);
      padding: 0 var(--bm-space-5);
      border-bottom: 1px solid var(--bm-color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-brand {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-brand-icon {
      color: var(--bm-color-primary);
    }

    .bm-brand-info {
      display: flex;
      flex-direction: column;
    }

    .bm-brand-title {
      font-size: var(--bm-font-size-base);
      font-weight: var(--bm-font-weight-bold);
      color: var(--bm-color-text-primary);
      line-height: 1.1;
    }

    .bm-brand-sub {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      font-weight: var(--bm-font-weight-medium);
    }

    .bm-mobile-close {
      display: none;
      background: transparent;
      border: none;
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      padding: 4px;

      @media (max-width: 1023px) {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .bm-sidebar-nav {
      flex: 1;
      padding: var(--bm-space-4) var(--bm-space-3);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-5);
    }

    .bm-nav-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bm-nav-group-title {
      font-size: 11px;
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0 var(--bm-space-3) var(--bm-space-2) var(--bm-space-3);
    }

    .bm-nav-item {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-2) var(--bm-space-3);
      border-radius: var(--bm-radius-md);
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-secondary);
      text-decoration: none;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: all var(--bm-transition-fast);

      &:hover {
        background-color: var(--bm-color-surface-subtle);
        color: var(--bm-color-text-primary);
      }

      &.active {
        background-color: var(--bm-color-primary-soft);
        color: var(--bm-color-primary);
        font-weight: var(--bm-font-weight-medium);

        lucide-icon {
          color: var(--bm-color-primary);
        }
      }
    }

    .bm-nav-logout {
      color: var(--bm-color-danger);

      &:hover {
        background-color: var(--bm-color-danger-bg);
        color: var(--bm-color-danger);
      }
    }

    // Main Area
    .bm-main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: var(--bm-sidebar-width);
      min-width: 0;

      @media (max-width: 1023px) {
        margin-left: 0;
      }
    }

    // Header
    .bm-header {
      height: var(--bm-header-height);
      background-color: var(--bm-color-surface);
      border-bottom: 1px solid var(--bm-color-border);
      padding: 0 var(--bm-space-6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .bm-header-left {
      display: flex;
      align-items: center;
      gap: var(--bm-space-4);
    }

    .bm-menu-toggle {
      display: none;
      background: transparent;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      padding: 6px;
      color: var(--bm-color-text-secondary);
      cursor: pointer;

      @media (max-width: 1023px) {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .bm-store-indicator {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
    }

    .bm-store-name {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-header-right {
      display: flex;
      align-items: center;
      gap: var(--bm-space-4);
    }

    .bm-profile-trigger {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: 4px 8px;
      border-radius: var(--bm-radius-md);
      transition: background-color var(--bm-transition-fast);

      &:hover {
        background-color: var(--bm-color-surface-subtle);
      }
    }

    .bm-profile-meta {
      display: flex;
      flex-direction: column;
      text-align: left;

      @media (max-width: 639px) {
        display: none;
      }
    }

    .bm-user-name {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      line-height: 1.2;
    }

    .bm-user-role {
      font-size: 10px;
      color: var(--bm-color-text-secondary);
    }

    .bm-chevron {
      color: var(--bm-color-text-muted);
    }

    .bm-profile-dropdown-content {
      padding: var(--bm-space-2) 0;
      min-width: 220px;
    }

    .bm-dropdown-user-header {
      padding: var(--bm-space-2) var(--bm-space-4);
    }

    .bm-dropdown-user-name {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-dropdown-user-email {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin-top: 1px;
    }

    .bm-dropdown-divider {
      height: 1px;
      background-color: var(--bm-color-border);
      margin: var(--bm-space-2) 0;
    }

    .bm-dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--bm-space-3);
      padding: var(--bm-space-2) var(--bm-space-4);
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      text-decoration: none;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background-color var(--bm-transition-fast);

      &:hover {
        background-color: var(--bm-color-surface-subtle);
      }
    }

    .bm-dropdown-logout {
      color: var(--bm-color-danger);

      &:hover {
        background-color: var(--bm-color-danger-bg);
      }
    }

    // Main Content
    .bm-content {
      flex: 1;
      padding: var(--bm-space-6);
      max-width: 1440px;
      width: 100%;
      margin: 0 auto;

      @media (max-width: 639px) {
        padding: var(--bm-space-4);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class DashboardShellComponent {
  readonly authService = inject(AuthService);

  readonly StoreIcon = Store;
  readonly DashboardIcon = LayoutDashboard;
  readonly ProductsIcon = ShoppingBag;
  readonly InventoryIcon = Boxes;
  readonly PoolsIcon = Layers;
  readonly OrdersIcon = Users;
  readonly PickupIcon = QrCode;
  readonly UserIcon = User;
  readonly SettingsIcon = Settings;
  readonly LogoutIcon = LogOut;
  readonly MenuIcon = Menu;
  readonly CloseIcon = X;
  readonly ChevronDownIcon = ChevronDown;
  readonly ShieldCheckIcon = ShieldCheck;

  readonly isMobileMenuOpen = signal<boolean>(false);

  readonly isAdmin = computed(() => this.authService.userRole() === 'ADMIN');
  readonly userName = computed(() => this.authService.currentUser()?.name || 'Merchant User');
  readonly userEmail = computed(() => this.authService.currentUser()?.email || '');
  readonly userRoleLabel = computed(() => {
    const role = this.authService.userRole();
    if (role === 'ADMIN') return 'Store Administrator';
    return 'Store Manager';
  });

  readonly merchantBadgeVariant = computed(() => {
    const status = this.authService.currentMerchant()?.status;
    if (status === 'APPROVED') return 'success';
    if (status === 'PENDING_REVIEW') return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'neutral';
  });

  readonly merchantBadgeLabel = computed(() => {
    const status = this.authService.currentMerchant()?.status;
    if (status === 'APPROVED') return 'Store Active';
    if (status === 'PENDING_REVIEW') return 'Under Review';
    if (status === 'REJECTED') return 'Application Rejected';
    if (status === 'DRAFT') return 'Draft Onboarding';
    return 'Merchant Portal';
  });

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  handleLogout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }
}
