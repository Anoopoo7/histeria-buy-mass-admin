import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { DashboardShellComponent } from './layout/dashboard-shell/dashboard-shell.component';

export const routes: Routes = [
  // Guest Authentication Flow
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginPageComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then((m) => m.RegisterPageComponent),
      },
      {
        path: 'verify-phone',
        loadComponent: () =>
          import('./features/auth/pages/verify-phone/verify-phone.component').then((m) => m.VerifyPhonePageComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordPageComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // Authenticated Merchant Dashboard Shell
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'store/overview',
        loadComponent: () =>
          import('./features/store/pages/my-store/my-store.component').then((m) => m.MyStoreComponent),
      },
      {
        path: 'merchant/status',
        loadComponent: () =>
          import('./features/merchants/pages/merchant-status/merchant-status.component').then(
            (m) => m.MerchantStatusComponent,
          ),
      },
      {
        path: 'settings/profile',
        loadComponent: () =>
          import('./features/user/pages/profile/profile.component').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/user/pages/settings/settings.component').then((m) => m.SettingsPageComponent),
      },
      {
        path: 'store/products',
        loadComponent: () =>
          import('./features/store/pages/products/products.component').then((m) => m.ProductsPageComponent),
      },
      {
        path: 'store/inventory',
        loadComponent: () =>
          import('./features/store/pages/products/products.component').then((m) => m.ProductsPageComponent),
      },
      {
        path: 'campaigns',
        loadComponent: () =>
          import('./features/campaigns/pages/campaigns/campaigns.component').then((m) => m.CampaignsPageComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/pages/orders/orders.component').then((m) => m.OrdersPageComponent),
      },
      {
        path: 'orders/pickups',
        loadComponent: () =>
          import('./features/orders/pages/orders/orders.component').then((m) => m.OrdersPageComponent),
      },

      // Dedicated Admin Store Review Portal (AdminGuard protected)
      {
        path: 'admin/merchants',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/pages/merchants-list/merchants-list.component').then(
            (m) => m.AdminMerchantsListComponent,
          ),
      },
      {
        path: 'admin/merchants/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/pages/merchant-detail/merchant-detail.component').then(
            (m) => m.AdminMerchantDetailComponent,
          ),
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Wildcard fallback
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
