import { expect, test } from '@playwright/test';

import { createE2EFixture, expectAdminRoute, loginAs } from './fixtures';

test.describe('admin RBAC route boundaries', () => {
  test('roles can only reach their allowed admin modules', async ({ browser }) => {
    const fixture = await createE2EFixture();

    try {
      const scenarios = [
        {
          email: fixture.users.admin.email,
          allow: ['/technical/service-requests', '/admin/users', '/admin/settings'],
          deny: [] as string[],
        },
        {
          email: fixture.users.serviceStaff.email,
          allow: ['/technical/service-requests', '/technical/customers'],
          deny: ['/admin/users', '/admin/settings', '/admin/devices'],
        },
        {
          email: fixture.users.viewer.email,
          allow: [] as string[],
          deny: ['/technical/service-requests', '/technical/devices', '/admin/users', '/admin/media'],
        },
        {
          email: fixture.users.editor.email,
          allow: [] as string[],
          deny: ['/technical/service-requests', '/technical/dashboard', '/admin/blog', '/admin/media', '/admin/users'],
        },
      ];

      for (const scenario of scenarios) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('/');
        await loginAs(context, scenario.email);

        for (const route of scenario.allow) {
          await expectAdminRoute(page, route, true);
        }

        for (const route of scenario.deny) {
          await expectAdminRoute(page, route, false);
        }

        await context.close();
      }
    } finally {
      await fixture.cleanup();
    }
  });

  test('technical entry has its own login page', async ({ page }) => {
    await page.goto('/technical', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/technical\/login/);
    await expect(page.getByRole('heading', { name: /Teknik Servis Paneli/i })).toBeVisible();
  });
});
