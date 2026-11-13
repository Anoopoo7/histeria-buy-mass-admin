import { test, expect } from '@playwright/test';
import { setupMockAuthenticatedSession } from './fixtures/auth';

test.describe('Orders & Store Pickup Fulfillment', () => {
  const mockOrder = {
    id: 'order-e2e-1',
    orderNumber: 'BM-202611-001',
    userId: 'user-cust-1234',
    storeId: 'store-e2e-101',
    merchantId: 'store-e2e-101',
    poolId: 'pool-e2e-55',
    participationId: 'part-e2e-1',
    items: [
      {
        productId: 'prod-e2e-1',
        productName: 'Wayanad Green Cardamom 500g',
        quantity: 2,
        regularUnitPrice: 450,
        regularSubtotal: 900,
        discountedSubtotal: 800,
      },
    ],
    regularTotal: 900,
    discountPercentage: 11.1,
    discountAmount: 100,
    finalAmount: 800,
    currency: 'INR',
    status: 'READY_FOR_PICKUP',
    placedAt: new Date(Date.now() - 3600000).toISOString(),
    readyForPickupAt: new Date().toISOString(),
    notificationStatus: 'SENT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test.beforeEach(async ({ page }) => {
    await setupMockAuthenticatedSession(page);

    // Mock merchant orders list endpoint
    await page.route('**/api/v1/merchant/orders*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockOrder],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
        }),
      });
    });

    // Mock ready for pickup endpoint
    await page.route('**/api/v1/merchant/orders/ready-for-pickup*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockOrder],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
        }),
      });
    });
  });

  test('should display orders list with status badges and order details', async ({ page }) => {
    await page.goto('/orders');

    // Check order number in table
    await expect(page.locator('table').getByText('BM-202611-001')).toBeVisible();

    // Check product title in items list
    await expect(page.locator('table').getByText('Wayanad Green Cardamom 500g')).toBeVisible();

    // Check status badge
    await expect(page.locator('table').getByText('Ready for Pickup')).toBeVisible();
  });

  test('should switch between All Orders and Store Pickups view mode', async ({ page }) => {
    await page.goto('/orders');

    // Click on Store Pickups mode button
    await page.locator('button.bm-mode-tab:has-text("Store Pickups")').click();
    await expect(page).toHaveURL(/.*\/orders\/pickups/);

    // Click back to All Orders
    await page.locator('button.bm-mode-tab:has-text("All Store Orders")').click();
    await expect(page).toHaveURL(/.*\/orders(?!\/pickups)/);
  });

  test('should open Verify Pickup OTP modal and accept 6 digits', async ({ page }) => {
    await page.goto('/orders');

    // Click on Verify Pickup OTP button
    await page.getByRole('button', { name: /Verify Pickup OTP/i }).click();

    // Verify modal is open with title
    await expect(page.locator('.bm-modal-title')).toContainText('Verify Store Pickup');

    // Check that OTP container is present
    await expect(page.locator('bm-otp-input')).toBeVisible();

    // Check 6 OTP input boxes
    const otpInputs = page.locator('.bm-otp-box');
    await expect(otpInputs).toHaveCount(6);

    // Cancel modal
    await page.click('.bm-modal-actions button:has-text("Cancel")');
    await expect(page.locator('.bm-modal-container')).not.toBeVisible();
  });

  test('should open Order Details modal with 4-stage timeline', async ({ page }) => {
    await page.goto('/orders');

    // Click on Details button
    await page.getByRole('button', { name: /^Details$/i }).click();

    // Check modal header
    await expect(page.locator('.bm-modal-title')).toContainText('Order Details');

    // Check timeline stages
    await expect(page.locator('.bm-timeline-box')).toBeVisible();
    await expect(page.locator('.bm-timeline-box')).toContainText('Placed');
    await expect(page.locator('.bm-timeline-box')).toContainText('Confirmed');
    await expect(page.locator('.bm-timeline-box')).toContainText('Ready');
    await expect(page.locator('.bm-timeline-box')).toContainText('Picked Up');

    // Close details
    await page.click('.bm-close-btn');
    await expect(page.locator('.bm-modal-container')).not.toBeVisible();
  });
});
