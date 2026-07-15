import { expect, test } from '@playwright/test';

import { createE2EFixture, loginAs } from './fixtures';

test.describe('service request workflow', () => {
  test('admin can review, update, assign, note and download while viewer cannot download attachments', async ({
    browser,
  }) => {
    const fixture = await createE2EFixture();

    try {
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      await adminPage.goto('/');
      await loginAs(adminContext, fixture.users.admin.email);

      await adminPage.goto(`/admin/service-requests/${fixture.serviceRequest.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(adminPage.getByText(fixture.serviceRequest.company, { exact: true })).toBeVisible();
      const attachmentPath = `/admin/service-requests/${fixture.serviceRequest.id}/attachments/${fixture.attachment.id}`;
      await expect(adminPage.locator(`a[href="${attachmentPath}"]`)).toBeVisible();

      await adminPage.locator('#service-request-note').fill('E2E teknik notu eklendi.');
      await adminPage.getByRole('button', { name: /not ekle/i }).click();
      await expect(adminPage.getByText('E2E teknik notu eklendi.')).toBeVisible();

      await adminPage.locator('#assigned-user').selectOption(fixture.users.serviceStaff.id);
      await adminPage.getByRole('button', { name: /atamay/i }).click();
      await expect(adminPage.locator('dd').getByText(fixture.users.serviceStaff.name, { exact: true })).toBeVisible();

      await adminPage.locator('#service-request-status').selectOption('REVIEWING');
      await adminPage.locator('#service-request-status-reason').fill('E2E durum gecisi.');
      await adminPage.getByRole('button', { name: /durumu/i }).click();
      await expect(adminPage.getByText(/nceleniyor/i).first()).toBeVisible();

      const download = await adminContext.request.get(
        attachmentPath,
      );
      expect(download.status()).toBe(200);
      expect(await download.text()).toContain('orontes e2e private attachment');

      const viewerContext = await browser.newContext();
      const viewerPage = await viewerContext.newPage();
      await viewerPage.goto('/');
      await loginAs(viewerContext, fixture.users.viewer.email);
      await viewerPage.goto(`/admin/service-requests/${fixture.serviceRequest.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(viewerPage.locator(`a[href="${attachmentPath}"]`)).toHaveCount(0);

      const forbiddenDownload = await viewerContext.request.get(
        attachmentPath,
        { maxRedirects: 0 },
      );
      expect([303, 307, 308]).toContain(forbiddenDownload.status());

      await adminContext.close();
      await viewerContext.close();
    } finally {
      await fixture.cleanup();
    }
  });
});
