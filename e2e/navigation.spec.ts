import { test, expect } from '@playwright/test';
import { setupMockAuthenticatedSession } from './fixtures/auth';

test.describe('Dashboard Shell & Navigation', () => {
  test('should load authenticated dashboard with store name and navigation links', async ({ page }) => {
    await setupMockAuthenticatedSession(page, { role: 'MERCHANT', storeName: 'Silent vally' });
    await page.goto('/dashboard');

    // Verify brand and store name
    await expect(page.getByText('BuyMass')).toBeVisible();
    await expect(page.locator('.bm-store-name')).toContainText('Silent vally');

    // Verify sidebar navigation links
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Store' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Campaigns / Pools' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Store Pickups' })).toBeVisible();
  });

  test('should navigate between features via sidebar links', async ({ page }) => {
    await setupMockAuthenticatedSession(page);
    await page.goto('/dashboard');

    // Navigate to Products
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/.*\/store\/products/);

    // Navigate to Campaigns / Pools
    await page.getByRole('link', { name: 'Campaigns / Pools' }).click();
    await expect(page).toHaveURL(/.*\/campaigns/);

    // Navigate to All Orders
    await page.getByRole('link', { name: 'All Orders' }).click();
    await expect(page).toHaveURL(/.*\/orders(?!\/pickups)/);

    // Navigate to Store Pickups counter
    await page.getByRole('link', { name: 'Store Pickups' }).click();
    await expect(page).toHaveURL(/.*\/orders\/pickups/);
  });

  test('should display Platform Administration section only for ADMIN role', async ({ page }) => {
    // 1. Merchant role should NOT see Platform Administration in sidebar
    await setupMockAuthenticatedSession(page, { role: 'MERCHANT' });
    await page.goto('/dashboard');
    await expect(page.locator('.bm-sidebar').getByRole('link', { name: /Store Applications/i })).not.toBeVisible();

    // 2. Admin role SHOULD see Store Applications in sidebar
    await page.context().clearCookies();
    await setupMockAuthenticatedSession(page, { role: 'ADMIN' });
    await page.route('**/api/v1/admin/merchants*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard');
    await expect(page.locator('.bm-sidebar').getByRole('link', { name: /Store Applications/i })).toBeVisible();
  });
});
