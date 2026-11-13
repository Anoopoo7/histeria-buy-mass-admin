import { test, expect } from '@playwright/test';

test.describe('Authentication & Guest Flow', () => {
  test('should redirect unauthenticated users to /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('should display login page elements correctly', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: /Merchant Sign In/i })).toBeVisible();
    await expect(page.locator('input#login-identifier')).toBeVisible();
    await expect(page.locator('input#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In to Store/i })).toBeVisible();
  });

  test('should navigate between login, register, and forgot password pages', async ({ page }) => {
    await page.goto('/auth/login');

    // Link to Register
    const registerLink = page.getByRole('link', { name: /Register your store/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/.*\/auth\/register/);

    // Back to Login
    await page.goto('/auth/login');

    // Link to Forgot Password
    const forgotLink = page.getByRole('link', { name: /Forgot password\?/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // Intercept backend login call to return 401
    await page.route('**/api/v1/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
    });

    await page.goto('/auth/login');
    await page.locator('input#login-identifier').fill('wrong@example.com');
    await page.locator('input#login-password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /Sign In to Store/i }).click();

    // Verify error is displayed
    await expect(page.locator('.bm-alert-danger, [role="alert"]')).toBeVisible();
    await expect(page.locator('.bm-alert-danger, [role="alert"]')).toContainText('Invalid email or password');
  });
});
