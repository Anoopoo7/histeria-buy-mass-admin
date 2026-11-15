import { test, expect } from '@playwright/test';
import { setupMockAuthenticatedSession } from './fixtures/auth';

test.describe('Admin Search Indexing E2E', () => {
  test('should protect /admin/indexing from non-admin users', async ({ page }) => {
    await setupMockAuthenticatedSession(page, { role: 'MERCHANT' });
    await page.goto('/admin/indexing');
    // Guard redirects non-admin to /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should load search indexing page for admin and allow tab switching and sync triggering', async ({
    page,
  }) => {
    await setupMockAuthenticatedSession(page, { role: 'ADMIN' });

    // Mock search sync history endpoint
    await page.route(/\/api\/v1\/admin\/search\/sync\/history(\?.*)?$/, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'job-mock-1',
              collectionName: 'stores',
              mode: 'FULL',
              status: 'COMPLETED',
              totalRecords: 12,
              succeededCount: 12,
              failedCount: 0,
              durationMs: 450,
              errorSummary: null,
              triggeredBy: 'admin@buymass.in',
              startedAt: '2026-11-15T06:00:00.000Z',
              completedAt: '2026-11-15T06:00:00.450Z',
              createdAt: '2026-11-15T06:00:00.000Z',
            },
            {
              id: 'job-mock-2',
              collectionName: 'products',
              mode: 'DELTA',
              status: 'COMPLETED',
              totalRecords: 45,
              succeededCount: 45,
              failedCount: 0,
              durationMs: 980,
              errorSummary: null,
              triggeredBy: 'admin@buymass.in',
              startedAt: '2026-11-15T05:30:00.000Z',
              completedAt: '2026-11-15T05:30:00.980Z',
              createdAt: '2026-11-15T05:30:00.000Z',
            },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 15,
            totalPages: 1,
          },
        }),
      });
    });

    // Mock trigger sync endpoint
    let syncTriggerPayload: any = null;
    await page.route(/\/api\/v1\/admin\/search\/sync(\?.*)?$/, (route) => {
      syncTriggerPayload = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'job-mock-new',
          status: 'IN_PROGRESS',
          message: 'Sync queued successfully',
        }),
      });
    });

    // 1. Visit dashboard and click Search Indexing in sidebar
    await page.goto('/dashboard');
    const searchNav = page.locator('.bm-sidebar').getByRole('link', { name: /Search Indexing/i });
    await expect(searchNav).toBeVisible();
    await searchNav.click();

    // 2. Verify URL and page header
    await expect(page).toHaveURL(/.*\/admin\/indexing/);
    await expect(page.getByRole('heading', { name: 'Search Indexing' })).toBeVisible();

    // 3. Verify tabs exist
    const tabs = ['All Collections', 'Stores', 'Products', 'Pools', 'Sync History Audit'];
    for (const tab of tabs) {
      await expect(page.getByRole('button', { name: new RegExp(tab, 'i') })).toBeVisible();
    }

    // 4. Click Stores tab
    await page.getByRole('button', { name: /^Stores/i }).click();
    await expect(page.getByRole('heading', { name: 'Stores Index Management' })).toBeVisible();

    // 5. Click Products tab
    await page.getByRole('button', { name: /^Products/i }).click();
    await expect(page.getByRole('heading', { name: 'Products Index Management' })).toBeVisible();

    // 6. Click Pools tab
    await page.getByRole('button', { name: /^Pools/i }).click();
    await expect(page.getByRole('heading', { name: 'Pools Index Management' })).toBeVisible();

    // 7. Click History tab
    await page.getByRole('button', { name: /Sync History Audit/i }).click();
    await expect(page.getByRole('heading', { name: 'Typesense Indexing Audit Log' })).toBeVisible();
    await expect(page.getByText('admin@buymass.in').first()).toBeVisible();

    // 8. Open Trigger Sync modal
    await page.getByRole('button', { name: /Trigger Global Sync/i }).click();
    await expect(page.getByRole('heading', { name: 'Trigger Typesense Re-Index' })).toBeVisible();

    // Modal is scrollable and form works
    const submitBtn = page.getByRole('button', { name: /Start Indexing Job/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Expect sync request made
    expect(syncTriggerPayload).toBeTruthy();
    expect(syncTriggerPayload.collection).toBe('all');
    expect(syncTriggerPayload.mode).toBe('FULL');
  });
});
