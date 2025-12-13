import { test, expect } from '@playwright/test';

test.describe('Customer Profile Feature', () => {
  const timestamp = Date.now();
  const testUser = {
    firstName: 'Sarah',
    lastName: 'Mitchell',
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
  };

  test('should register a new user with first/last name and view profile', async ({ page }) => {
    await page.goto('/auth');

    await page.getByTestId('tab-signup').click();

    await page.getByTestId('role-client').click();

    await page.getByTestId('input-signup-firstname').fill(testUser.firstName);
    await page.getByTestId('input-signup-lastname').fill(testUser.lastName);
    await page.getByTestId('input-signup-username').fill(testUser.username);
    await page.getByTestId('input-signup-email').fill(testUser.email);
    await page.getByTestId('input-signup-password').fill(testUser.password);

    await page.getByTestId('button-signup').click();

    await page.waitForURL('/search');

    const response = await page.request.get('/api/auth/me');
    const user = await response.json();
    expect(user.id).toBeTruthy();

    await page.goto(`/customer/${user.id}`);

    await page.waitForSelector('[data-testid="customer-profile-header"]');

    const displayName = await page.getByTestId('profile-display-name').textContent();
    expect(displayName).toBe('Sarah M.');

    const avatarFallback = page.getByTestId('profile-avatar-fallback');
    await expect(avatarFallback).toBeVisible();
  });

  test('should show first name only when last name is not provided', async ({ page }) => {
    const noLastNameUser = {
      firstName: 'Alex',
      lastName: '',
      username: `nolast${timestamp}`,
      email: `nolast${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/auth');
    await page.getByTestId('tab-signup').click();
    await page.getByTestId('role-client').click();

    await page.getByTestId('input-signup-firstname').fill(noLastNameUser.firstName);
    await page.getByTestId('input-signup-username').fill(noLastNameUser.username);
    await page.getByTestId('input-signup-email').fill(noLastNameUser.email);
    await page.getByTestId('input-signup-password').fill(noLastNameUser.password);

    await page.getByTestId('button-signup').click();
    await page.waitForURL('/search');

    const response = await page.request.get('/api/auth/me');
    const user = await response.json();

    await page.goto(`/customer/${user.id}`);
    await page.waitForSelector('[data-testid="customer-profile-header"]');

    const displayName = await page.getByTestId('profile-display-name').textContent();
    expect(displayName).toBe('Alex');
  });
});
