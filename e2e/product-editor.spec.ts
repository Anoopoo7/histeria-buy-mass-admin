import { test, expect } from '@playwright/test';
import { setupMockAuthenticatedSession } from './fixtures/auth';

test.describe('Product Creation & Editing Dedicated Page E2E', () => {
  const mockExistingProduct = {
    id: 'prod-e2e-201',
    storeId: 'store-e2e-101',
    ownerUserId: 'user-e2e-101',
    name: 'Kerala Cardamom 250g',
    description: 'High-altitude aromatic green cardamom pods from Idukki plantations.',
    category: 'Spices & Condiments',
    brand: 'Nadan Spices',
    sku: 'BM-SPICE-CARD-250',
    price: 650,
    unit: 'packet',
    status: 'ACTIVE',
    images: [
      {
        id: 'img-e2e-1',
        url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d',
        uploadedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('should navigate from catalogue list to /store/products/new and render editor', async ({
    page,
  }) => {
    await setupMockAuthenticatedSession(page);

    // Mock products list with one product
    await page.route('**/api/v1/merchant/products*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockExistingProduct],
          pagination: { total: 1, page: 1, limit: 25, totalPages: 1 },
        }),
      });
    });

    // 1. Visit products list
    await page.goto('/store/products');
    await expect(page.getByRole('heading', { name: 'Product Catalogue' })).toBeVisible();

    // 2. Click "Add New Product"
    const addBtn = page.getByRole('link', { name: /Add New Product/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 3. Verify navigated to /store/products/new
    await expect(page).toHaveURL(/.*\/store\/products\/new/);
    await expect(page.getByRole('heading', { name: 'Create New Product' })).toBeVisible();

    // 4. Verify breadcrumbs & form inputs exist
    await expect(page.getByText('New Product', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/Product Name/i)).toBeVisible();
    await expect(page.getByLabel(/Category/i)).toBeVisible();
    await expect(page.getByLabel(/Selling Price/i)).toBeVisible();
    await expect(page.getByLabel(/Unit of Measure/i)).toBeVisible();
    await expect(page.getByLabel(/Detailed Description/i)).toBeVisible();

    // 5. Verify Photo Upload Dropzone & Live Preview Card
    await expect(page.getByText(/Click to upload or drag & drop product photos/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live Storefront Preview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Catalogue Lifecycle' })).toBeVisible();
  });

  test('should allow creating a draft product and return to products catalogue', async ({ page }) => {
    await setupMockAuthenticatedSession(page);

    let createPayload: any = null;
    await page.route('**/api/v1/merchant/products', (route) => {
      if (route.request().method() === 'POST') {
        createPayload = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Product created',
            product: {
              ...mockExistingProduct,
              id: 'prod-new-1',
              name: createPayload.name,
              price: createPayload.price,
              status: 'DRAFT',
              images: [],
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { total: 0, page: 1, limit: 25, totalPages: 1 },
          }),
        });
      }
    });

    await page.goto('/store/products/new');

    // Fill in product details
    await page.getByLabel(/Product Name/i).fill('Wayanad Robusta Coffee 500g');
    await page.getByLabel(/Category/i).selectOption('Beverages & Tea');
    await page.getByLabel(/Selling Price/i).fill('280');
    await page.getByLabel(/Unit of Measure/i).selectOption('pack');
    await page.getByLabel(/Detailed Description/i).fill('Single-origin dark roast Robusta coffee beans grown under rainforest canopy in Meppadi.');

    // Click "Save as Draft"
    await page.getByRole('button', { name: /Save as Draft/i }).first().click();

    // Verify create request was made
    expect(createPayload).toBeTruthy();
    expect(createPayload.name).toBe('Wayanad Robusta Coffee 500g');
    expect(createPayload.price).toBe(280);

    // Verify navigated back to products list
    await expect(page).toHaveURL(/.*\/store\/products/);
  });

  test('should load existing product in edit mode, manage photos, and support archive', async ({
    page,
  }) => {
    await setupMockAuthenticatedSession(page);

    // Mock GET single product
    await page.route(`**/api/v1/merchant/products/${mockExistingProduct.id}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ product: mockExistingProduct }),
      });
    });

    // Mock archive product
    let archiveCalled = false;
    await page.route(`**/api/v1/merchant/products/${mockExistingProduct.id}`, (route) => {
      if (route.request().method() === 'DELETE') {
        archiveCalled = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Product archived', product: { ...mockExistingProduct, status: 'ARCHIVED' } }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ product: mockExistingProduct }),
        });
      }
    });

    await page.goto(`/store/products/${mockExistingProduct.id}/edit`);

    // 1. Verify product details loaded in form
    await expect(page.getByLabel(/Product Name/i)).toHaveValue('Kerala Cardamom 250g');
    await expect(page.getByLabel(/Selling Price/i)).toHaveValue('650');

    // 2. Verify image gallery shows attached photo
    await expect(page.getByText('Attached Product Images (1)')).toBeVisible();
    await expect(page.getByText('Primary Cover')).toBeVisible();

    // 3. Verify live storefront preview reflects existing product
    await expect(page.getByRole('heading', { name: 'Kerala Cardamom 250g' })).toBeVisible();
    await expect(page.locator('.bm-preview-amount')).toHaveText('650.00');

    // 4. Open Archive modal and confirm
    await page.getByRole('button', { name: /^Archive$/i }).click();
    await expect(page.getByRole('heading', { name: 'Archive Product' })).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: /Confirm Archive/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    expect(archiveCalled).toBe(true);
    await expect(page).toHaveURL(/.*\/store\/products/);
  });
});
