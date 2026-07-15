import { test } from '@playwright/test';

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
          allow: ['/technical/service-requests', '/technical/customers', '/admin/devices'],
          deny: ['/admin/users', '/admin/settings'],
        },
        {
          email: fixture.users.viewer.email,
          allow: ['/technical/service-requests', '/technical/devices'],
          deny: ['/admin/users', '/admin/media'],
        },
        {
          email: fixture.users.editor.email,
          allow: ['/admin/blog', '/admin/media'],
          deny: ['/technical/service-requests', '/technical/dashboard', '/admin/users'],
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
});
