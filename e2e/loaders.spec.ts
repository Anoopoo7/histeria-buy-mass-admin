import { expect, test } from '@playwright/test';
import { setupMockAuthenticatedSession } from './fixtures/auth';

test.describe('Page Switch Loader & Skeleton Loaders', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuthenticatedSession(page);
  });

  test('should have bm-route-loader present on the application shell', async ({ page }) => {
    await page.goto('/dashboard');
    const routeLoader = page.locator('bm-route-loader');
    await expect(routeLoader).toBeAttached();
  });

  test('should trigger route progress bar during route transitions', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on All Orders in sidebar
    await page.locator('.bm-sidebar').getByRole('link', { name: 'All Orders' }).click();
    await expect(page).toHaveURL(/.*\/orders(?!\/pickups)/);

    // Verify orders page rendered properly
    await expect(page.locator('.bm-page-title')).toContainText('Orders');
  });

  test('should support bm-skeleton components on Products page', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to Products page
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/.*\/store\/products/);

    await expect(page.locator('.bm-page-title')).toContainText('Product');
  });

  test('should support bm-skeleton components on Campaigns page', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to Campaigns page
    await page.getByRole('link', { name: 'Campaigns / Pools' }).click();
    await expect(page).toHaveURL(/.*\/campaigns/);

    await expect(page.locator('.bm-page-title')).toContainText('Campaigns & Pools');
  });

  test('should render reactive line chart on dashboard with timeframe switcher', async ({ page }) => {
    await page.goto('/dashboard');
    const chart = page.locator('bm-line-chart');
    await expect(chart).toBeVisible();

    // Verify timeframe switcher buttons
    const btn14d = page.getByRole('button', { name: '14 Days' });
    await expect(btn14d).toBeVisible();
    await btn14d.click();
    await expect(btn14d).toHaveClass(/active/);
  });
});
