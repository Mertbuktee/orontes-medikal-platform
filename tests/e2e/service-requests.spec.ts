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

      await adminPage.goto(`/technical/service-requests/${fixture.serviceRequest.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(adminPage.locator('dd').getByText(fixture.serviceRequest.company, { exact: true })).toBeVisible();
      const attachmentPath = `/technical/service-requests/${fixture.serviceRequest.id}/attachments/${fixture.attachment.id}`;
      await expect(adminPage.locator(`a[href="${attachmentPath}"]`)).toBeVisible();

      await adminPage.locator('#service-request-note').fill('E2E teknik notu eklendi.');
      await adminPage.getByRole('button', { name: /not ekle/i }).click();
      await expect(adminPage.getByText('E2E teknik notu eklendi.')).toBeVisible();

      await adminPage.locator('#assigned-user').selectOption(fixture.users.serviceStaff.id);
      await adminPage.getByRole('button', { name: /atamay/i }).click();
      await expect(adminPage.locator('dd').getByText(fixture.users.serviceStaff.name, { exact: true })).toBeVisible();

      await adminPage.locator('textarea[name="diagnosis"]').fill('E2E teshis: guc besleme karti arizali.');
      await adminPage.locator('textarea[name="workPerformed"]').fill('E2E islem: guc besleme karti degistirildi.');
      await adminPage.locator('textarea[name="testResult"]').fill('E2E test: cihaz stabil calisti.');
      await adminPage.locator('textarea[name="finalResult"]').fill('E2E final: cihaz teslimata hazir.');
      await adminPage.getByRole('button', { name: /teknik alanları kaydet/i }).click();
      await expect(adminPage.locator('textarea[name="finalResult"]')).toHaveValue(/teslimata hazir/i);

      await adminPage.locator('select[name="actionType"]').selectOption('REPAIR');
      await adminPage.locator('textarea[name="description"]').fill('E2E teknik islem kaydi.');
      await adminPage.getByRole('button', { name: /^İşlem Ekle$/i }).click();
      await expect(adminPage.getByText('E2E teknik islem kaydi.')).toBeVisible();

      await adminPage.locator('input[name="partName"]').fill('E2E test parcasi');
      await adminPage.locator('input[name="quantity"]').fill('1');
      await adminPage.locator('select[name="operation"]').selectOption('REPLACED');
      await adminPage.getByRole('button', { name: /^Parça Ekle$/i }).click();
      await expect(adminPage.getByText(/E2E test parcasi/i)).toBeVisible();

      await adminPage.getByRole('button', { name: /servisi tamamla/i }).click();
      await expect(adminPage.getByText(/Tamamland/i).first()).toBeVisible();
      await expect(adminPage.getByText(/cihaz geçmişi otomatik/i)).toBeVisible();

      await adminPage.goto('/technical/history', { waitUntil: 'domcontentloaded' });
      await expect(adminPage.getByText(fixture.serviceRequest.company, { exact: true })).toBeVisible();
      await adminPage.getByRole('link', { name: /Yeni Servis Olu/i }).first().click();
      await expect(adminPage.locator('input[name="deviceSerialNumber"]')).toHaveValue(
        fixture.serviceRequest.deviceSerialNumber ?? '',
      );
      await expect(adminPage.locator('input[name="company"]')).toHaveValue(fixture.serviceRequest.company);

      const { prisma } = await import('@/lib/database/prisma');
      const completedRequest = await prisma.serviceRequest.findUnique({
        where: { id: fixture.serviceRequest.id },
        select: { completedById: true, serviceCompletedAt: true },
      });
      expect(completedRequest?.completedById).toBe(fixture.users.admin.id);
      expect(completedRequest?.serviceCompletedAt).toBeTruthy();

      const completedDevice = await prisma.customerDevice.findUnique({
        where: { id: fixture.customerDevice.id },
        select: { lastServiceAt: true },
      });
      expect(completedDevice?.lastServiceAt).toBeTruthy();

      const download = await adminContext.request.get(
        attachmentPath,
      );
      expect(download.status()).toBe(200);
      expect(await download.text()).toContain('orontes e2e private attachment');

      const viewerContext = await browser.newContext();
      const viewerPage = await viewerContext.newPage();
      await viewerPage.goto('/');
      await loginAs(viewerContext, fixture.users.viewer.email);
      await viewerPage.goto(`/technical/service-requests/${fixture.serviceRequest.id}`, {
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
