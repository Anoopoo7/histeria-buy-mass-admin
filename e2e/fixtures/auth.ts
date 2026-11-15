import { Page } from '@playwright/test';

export interface MockSessionOptions {
  role?: 'MERCHANT' | 'ADMIN';
  storeStatus?: 'APPROVED' | 'PENDING_REVIEW' | 'DRAFT';
  storeName?: string;
}

/**
 * Injects a mock authenticated session into the browser context.
 * Intercepts auth refresh and merchant store endpoints to ensure
 * reliable, hermetic e2e test execution without external database dependency.
 */
export async function setupMockAuthenticatedSession(
  page: Page,
  options: MockSessionOptions = {},
) {
  const role = options.role ?? 'MERCHANT';
  const storeStatus = options.storeStatus ?? 'APPROVED';
  const storeName = options.storeName ?? 'Silent vally';

  // Seed persistent refresh token in localStorage before page load
  await page.addInitScript(() => {
    localStorage.setItem('bm_rt_store_admin', 'e2e-mock-refresh-token');
  });

  // Intercept token refresh rotation (POST /api/v1/auth/refresh)
  await page.route('**/api/v1/auth/refresh', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'e2e-mock-jwt-access-token',
        refreshToken: 'e2e-mock-jwt-refresh-token',
        user: {
          id: 'user-e2e-101',
          name: 'Anoop Sunitha',
          email: 'merchant.e2e@example.com',
          role: role,
          isEmailVerified: true,
          isPhoneVerified: true,
          phone: '+919526050158',
        },
      }),
    });
  });

  // Intercept current merchant profile endpoint (GET /api/v1/merchants/me)
  await page.route('**/api/v1/merchants/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        merchant: {
          id: 'store-e2e-101',
          storeName: storeName,
          status: storeStatus,
          ownerUserId: 'user-e2e-101',
          territory: 'Wayanad',
          address: 'Kalpetta Main Road',
          pincode: '673121',
          phone: '+919526050158',
          whatsappHelpline: '+919526050158',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  });

  // Common list queries to prevent uncaught network errors
  await page.route('**/api/v1/merchant/products*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      }),
    });
  });

  await page.route('**/api/v1/merchant/pools*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      }),
    });
  });

  await page.route('**/api/v1/merchant/orders*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      }),
    });
  });

  await page.route('**/api/v1/merchant/orders/ready-for-pickup*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      }),
    });
  });

  // Common admin routes to prevent uncaught 401s when testing as ADMIN
  await page.route(/\/api\/v1\/admin\/merchants(\/.*|\?.*)?$/, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ applications: [] }),
    });
  });

  await page.route(/\/api\/v1\/admin\/orders\/failures(\?.*)?$/, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        failedPickupNotifications: [],
        orderNotificationFailures: [],
        expiredOrLockedPickups: [],
      }),
    });
  });

  await page.route(/\/api\/v1\/admin\/orders(\?.*)?$/, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      }),
    });
  });
}
