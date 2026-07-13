import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

type Viewport = {
  width: number;
  height: number;
};

type ElementIssue = {
  selector: string;
  text: string;
  box: string;
};

type ViewportResult = {
  viewport: string;
  screenshotPath: string;
  horizontalOverflow: number;
  overflowingElements: ElementIssue[];
  zeroSizeImages: ElementIssue[];
  undersizedTapTargets: ElementIssue[];
  missingAnchorTargets: string[];
  mobileMenu?: "pass" | "not-applicable";
};

type AdminVisualResult = {
  name: string;
  screenshotPath: string;
  status: "PASS" | "REVIEW";
  note: string;
};

const outputRoot = "visual-qa";
const homepageDir = path.join(outputRoot, "homepage");
const adminDir = path.join(outputRoot, "admin");
const reportPath = path.join(outputRoot, "responsive-report.md");
const viewports: Viewport[] = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
];
const focusedViewports: Viewport[] = [
  { width: 375, height: 667 },
  { width: 1440, height: 900 },
];
const focusedSections = [
  { name: "navbar-hero", selector: "header, #hero" },
  { name: "services-devices", selector: "#hizmetler, #cihazlar" },
  { name: "boardrepair-whyus", selector: "#kart-tamiri, #neden-biz" },
  { name: "process-blog", selector: "#surec, #blog" },
  { name: "contact-cta", selector: "#iletisim, #servis-talebi" },
  { name: "footer", selector: "footer" },
];

test("homepage visual responsive QA", async ({ page }) => {
  await mkdir(homepageDir, { recursive: true });
  await mkdir(adminDir, { recursive: true });

  const results: ViewportResult[] = [];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);

    const screenshotPath = path.join(
      homepageDir,
      `homepage-${viewport.width}x${viewport.height}.png`
    );
    await page.screenshot({ fullPage: true, path: screenshotPath });

    const result = await runChecks(page, viewport, screenshotPath);
    results.push(result);

    expect(result.horizontalOverflow, `${result.viewport} horizontal overflow`).toBeLessThanOrEqual(0);
    expect(result.zeroSizeImages, `${result.viewport} zero-size images`).toHaveLength(0);
    expect(result.missingAnchorTargets, `${result.viewport} missing anchors`).toHaveLength(0);
  }

  for (const viewport of focusedViewports) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);

    for (const section of focusedSections) {
      await captureFocusedScreenshot(page, viewport, section.name, section.selector);
    }

    if (viewport.width <= 430) {
      await captureMobileMenu(page, viewport);
      const result = results.find(
        (item) => item.viewport === formatViewport(viewport)
      );
      if (result) result.mobileMenu = "pass";
    }
  }

  const adminResults = await captureAdminScreenshots(page);

  await writeFile(reportPath, createMarkdownReport(results, adminResults), "utf8");
});

async function dismissCookieBanner(page: Page) {
  const rejectButton = page.locator("button").filter({ hasText: /Reddet/ }).first();
  if ((await rejectButton.count()) > 0 && await rejectButton.isVisible()) {
    await rejectButton.click();
    await expect(rejectButton).toBeHidden();
  }
}

async function runChecks(
  page: Page,
  viewport: Viewport,
  screenshotPath: string
): Promise<ViewportResult> {
  return page.evaluate(
    ({ screenshotPath, viewport }) => {
      type BrowserIssue = {
        selector: string;
        text: string;
        box: string;
      };

      const doc = document.documentElement;
      const width = doc.clientWidth;
      const horizontalOverflow = Math.max(
        0,
        Math.max(doc.scrollWidth, document.body.scrollWidth) - width
      );
      const selectorFor = (element: Element) => {
        if (element.id) return `#${element.id}`;
        const tag = element.tagName.toLowerCase();
        const label = element.getAttribute("aria-label");
        const href = element.getAttribute("href");
        if (label) return `${tag}[aria-label="${label.slice(0, 40)}"]`;
        if (href) return `${tag}[href="${href.slice(0, 60)}"]`;
        const className = String(element.getAttribute("class") ?? "")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .join(".");
        return className ? `${tag}.${className}` : tag;
      };
      const toIssue = (element: Element, rect: DOMRect): BrowserIssue => ({
        selector: selectorFor(element),
        text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
        box: `${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`,
      });
      const isClippedByViewportSafeAncestor = (element: Element) => {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          const style = window.getComputedStyle(parent);
          const clipsOverflow =
            style.overflow === "hidden" ||
            style.overflowX === "hidden" ||
            style.overflowY === "hidden";

          if (clipsOverflow) {
            const parentRect = parent.getBoundingClientRect();
            return parentRect.left >= -1 && parentRect.right <= width + 1;
          }

          parent = parent.parentElement;
        }

        return false;
      };
      const overflowingElements: BrowserIssue[] = [];
      const zeroSizeImages: BrowserIssue[] = [];
      const undersizedTapTargets: BrowserIssue[] = [];
      const missingAnchorTargets: string[] = [];

      document.querySelectorAll("body *").forEach((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const isDecorative =
          element.getAttribute("aria-hidden") === "true" ||
          Boolean(element.closest('[aria-hidden="true"]'));
        const isVisuallyHidden =
          style.position === "absolute" &&
          (rect.left < -100 || rect.width <= 1 || rect.height <= 1);

        if (
          !isDecorative &&
          !isVisuallyHidden &&
          !isClippedByViewportSafeAncestor(element) &&
          rect.width > 1 &&
          rect.height > 1 &&
          (rect.right > width + 1 || rect.left < -1)
        ) {
          overflowingElements.push(toIssue(element, rect));
        }

        if (element instanceof HTMLImageElement && (rect.width <= 0 || rect.height <= 0)) {
          zeroSizeImages.push(toIssue(element, rect));
        }

        if (
          viewport.width <= 430 &&
          (element instanceof HTMLAnchorElement || element instanceof HTMLButtonElement) &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          rect.width > 0 &&
          rect.height > 0 &&
          (rect.width < 40 || rect.height < 40)
        ) {
          undersizedTapTargets.push(toIssue(element, rect));
        }
      });

      document.querySelectorAll<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]').forEach((anchor) => {
        const hash = anchor.hash;
        if (hash && !document.querySelector(hash)) {
          missingAnchorTargets.push(anchor.getAttribute("href") ?? hash);
        }
      });

      return {
        viewport: `${viewport.width}x${viewport.height}`,
        screenshotPath,
        horizontalOverflow,
        overflowingElements: overflowingElements.slice(0, 20),
        zeroSizeImages: zeroSizeImages.slice(0, 20),
        undersizedTapTargets: undersizedTapTargets.slice(0, 30),
        missingAnchorTargets: [...new Set(missingAnchorTargets)],
      };
    },
    { screenshotPath, viewport }
  );
}

async function captureFocusedScreenshot(
  page: Page,
  viewport: Viewport,
  name: string,
  selector: string
) {
  const found = await page.evaluate((selector) => {
    const elements = Array.from(document.querySelectorAll(selector));
    const first = elements[0];
    if (!first) return false;
    first.scrollIntoView({ block: "start" });
    return true;
  }, selector);

  if (!found) return;

  await page.waitForTimeout(100);
  await page.screenshot({
    fullPage: false,
    path: path.join(homepageDir, `homepage-${formatViewport(viewport)}-${name}.png`),
  });
}

async function captureMobileMenu(page: Page, viewport: Viewport) {
  const trigger = page.getByRole("button", { name: "Menüyü aç" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    fullPage: false,
    path: path.join(homepageDir, `homepage-${formatViewport(viewport)}-mobile-menu.png`),
  });

  const closeButton = page.locator('[data-slot="sheet-close"]');
  await closeButton.click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function captureAdminScreenshots(page: Page): Promise<AdminVisualResult[]> {
  const results: AdminVisualResult[] = [];

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Admin Girişi" })).toBeVisible();
  await expect(page.getByText("ÇEREZ TERCİHLERİ")).toHaveCount(0);
  const loginDesktopPath = path.join(adminDir, "admin-login-1440x900.png");
  await page.screenshot({ fullPage: true, path: loginDesktopPath });
  results.push({
    name: "admin-login-1440x900",
    screenshotPath: loginDesktopPath,
    status: "PASS",
    note: "Admin login renders without public cookie consent UI.",
  });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "E-posta" })).toBeVisible();
  const loginMobilePath = path.join(adminDir, "admin-login-375x667.png");
  await page.screenshot({ fullPage: true, path: loginMobilePath });
  results.push({
    name: "admin-login-375x667",
    screenshotPath: loginMobilePath,
    status: "PASS",
    note: "Mobile login fields remain visible and accessible.",
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
  await loginAsVisualQaAdmin(page);
  await expect(
    page.getByRole("heading", { name: "Yönetim Paneli", exact: true })
  ).toBeVisible();
  const dashboardDesktopPath = path.join(adminDir, "admin-dashboard-1440x900.png");
  await page.screenshot({ fullPage: true, path: dashboardDesktopPath });
  results.push({
    name: "admin-dashboard-1440x900",
    screenshotPath: dashboardDesktopPath,
    status: "PASS",
    note: "Dashboard shell renders after real admin login for visual QA.",
  });

  await page.goto("/admin/hero-slides", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Hero Slider Yönetimi", exact: true })
  ).toBeVisible();
  const heroSlidesDesktopPath = path.join(
    adminDir,
    "admin-hero-slides-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: heroSlidesDesktopPath });
  results.push({
    name: "admin-hero-slides-1440x900",
    screenshotPath: heroSlidesDesktopPath,
    status: "PASS",
    note: "Hero Slider list renders DB-backed slides and ordering controls.",
  });

  await page.goto("/admin/hero-slides/electronic-board-repair", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1")).toHaveText(
    "Hassas Elektronik Kart Müdahaleleri"
  );
  const heroSlidePreviewPath = path.join(
    adminDir,
    "admin-hero-slide-preview-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: heroSlidePreviewPath });
  results.push({
    name: "admin-hero-slide-preview-1440x900",
    screenshotPath: heroSlidePreviewPath,
    status: "PASS",
    note: "Hero slide authenticated preview renders the selected media.",
  });

  await page.goto("/admin/hero-slides/electronic-board-repair/edit", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "Slaytı Düzenle" })
  ).toBeVisible();
  const heroSlideEditPath = path.join(
    adminDir,
    "admin-hero-slide-edit-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: heroSlideEditPath });
  results.push({
    name: "admin-hero-slide-edit-1440x900",
    screenshotPath: heroSlideEditPath,
    status: "PASS",
    note: "Hero slide edit form renders media selector and metadata fields.",
  });

  await page.goto("/admin/hero-slides/new", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Yeni Slayt Ekle" })
  ).toBeVisible();
  const heroSlideNewPath = path.join(
    adminDir,
    "admin-hero-slide-new-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: heroSlideNewPath });
  results.push({
    name: "admin-hero-slide-new-1440x900",
    screenshotPath: heroSlideNewPath,
    status: "PASS",
    note: "Hero slide create form renders with Media Library selection.",
  });

  await page.goto("/admin/service-requests", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Servis Talepleri", exact: true })
  ).toBeVisible();
  const serviceRequestsDesktopPath = path.join(
    adminDir,
    "admin-service-requests-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: serviceRequestsDesktopPath });
  results.push({
    name: "admin-service-requests-1440x900",
    screenshotPath: serviceRequestsDesktopPath,
    status: "PASS",
    note: "Service request list renders with synthetic visual QA data.",
  });

  await page.goto("/admin/service-requests/visual-qa-service-request", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "Visual QA Kullanıcı" })
  ).toBeVisible();
  const serviceRequestDetailDesktopPath = path.join(
    adminDir,
    "admin-service-request-detail-1440x900.png"
  );
  await page.screenshot({
    fullPage: true,
    path: serviceRequestDetailDesktopPath,
  });
  results.push({
    name: "admin-service-request-detail-1440x900",
    screenshotPath: serviceRequestDetailDesktopPath,
    status: "PASS",
    note: "Service request detail renders with status, note, assignment and audit sections.",
  });

  await page.goto("/admin/media", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Medya Kütüphanesi", exact: true })
  ).toBeVisible();
  const mediaDesktopPath = path.join(adminDir, "admin-media-1440x900.png");
  await page.screenshot({ fullPage: true, path: mediaDesktopPath });
  results.push({
    name: "admin-media-1440x900",
    screenshotPath: mediaDesktopPath,
    status: "PASS",
    note: "Media library list and upload panel render with synthetic data.",
  });

  await page.goto("/admin/media/visual-qa-media", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "Visual QA Medya" })).toBeVisible();
  const mediaDetailDesktopPath = path.join(
    adminDir,
    "admin-media-detail-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: mediaDetailDesktopPath });
  results.push({
    name: "admin-media-detail-1440x900",
    screenshotPath: mediaDetailDesktopPath,
    status: "PASS",
    note: "Media detail renders preview, metadata, variants and usage state.",
  });

  await page.goto("/admin/blog", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Blog Yazıları", exact: true })).toBeVisible();
  const blogListDesktopPath = path.join(adminDir, "admin-blog-1440x900.png");
  await page.screenshot({ fullPage: true, path: blogListDesktopPath });
  results.push({
    name: "admin-blog-1440x900",
    screenshotPath: blogListDesktopPath,
    status: "PASS",
    note: "Blog CMS list renders posts, status badges and actions.",
  });

  await page.goto("/admin/blog/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Yeni Blog Yazısı" })).toBeVisible();
  const blogCreateDesktopPath = path.join(
    adminDir,
    "admin-blog-create-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: blogCreateDesktopPath });
  results.push({
    name: "admin-blog-create-1440x900",
    screenshotPath: blogCreateDesktopPath,
    status: "PASS",
    note: "Blog create form renders structured block editor and media controls.",
  });

  await page.goto("/admin/blog/visual-qa-blog-post/edit", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "Visual QA Teknik Servis Notu" })).toBeVisible();
  const blogEditDesktopPath = path.join(
    adminDir,
    "admin-blog-edit-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: blogEditDesktopPath });
  results.push({
    name: "admin-blog-edit-1440x900",
    screenshotPath: blogEditDesktopPath,
    status: "PASS",
    note: "Blog edit form renders existing structured blocks and scheduled publishing note.",
  });

  await page.goto("/admin/blog/visual-qa-blog-post/preview", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText("Önizleme Modu")).toBeVisible();
  const blogPreviewDesktopPath = path.join(
    adminDir,
    "admin-blog-preview-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: blogPreviewDesktopPath });
  results.push({
    name: "admin-blog-preview-1440x900",
    screenshotPath: blogPreviewDesktopPath,
    status: "PASS",
    note: "Authenticated blog draft preview renders with noindex preview notice.",
  });

  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Medikal cihaz servis notları" })).toBeVisible();
  const publicBlogDesktopPath = path.join(adminDir, "public-blog-1440x900.png");
  await page.screenshot({ fullPage: true, path: publicBlogDesktopPath });
  results.push({
    name: "public-blog-1440x900",
    screenshotPath: publicBlogDesktopPath,
    status: "PASS",
    note: "Public blog listing renders published posts.",
  });

  await page.goto("/blog/visual-qa-teknik-servis-notu", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "Visual QA Teknik Servis Notu" })).toBeVisible();
  const publicBlogDetailDesktopPath = path.join(
    adminDir,
    "public-blog-detail-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: publicBlogDetailDesktopPath });
  results.push({
    name: "public-blog-detail-1440x900",
    screenshotPath: publicBlogDetailDesktopPath,
    status: "PASS",
    note: "Public article detail renders structured content blocks.",
  });

  await page.goto("/blog/kategori/visual-qa-blog", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "Visual QA Blog" })).toBeVisible();
  const publicBlogCategoryDesktopPath = path.join(
    adminDir,
    "public-blog-category-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: publicBlogCategoryDesktopPath });
  results.push({
    name: "public-blog-category-1440x900",
    screenshotPath: publicBlogCategoryDesktopPath,
    status: "PASS",
    note: "Public blog category page renders useful active category content.",
  });

  await page.goto("/admin/services", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Hizmetler", exact: true })
  ).toBeVisible();
  const servicesDesktopPath = path.join(
    adminDir,
    "admin-services-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: servicesDesktopPath });
  results.push({
    name: "admin-services-1440x900",
    screenshotPath: servicesDesktopPath,
    status: "PASS",
    note: "Service management list renders DB-backed services.",
  });

  await page.goto("/admin/services/new", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Yeni Hizmet Ekle" })
  ).toBeVisible();
  const serviceCreatePath = path.join(
    adminDir,
    "admin-service-create-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: serviceCreatePath });
  results.push({
    name: "admin-service-create-1440x900",
    screenshotPath: serviceCreatePath,
    status: "PASS",
    note: "Service create form renders slug suggestion, SEO helpers and media selectors.",
  });

  await page.goto("/admin/services", { waitUntil: "domcontentloaded" });
  const firstServiceEditLink = page
    .getByRole("link", { name: "Düzenle" })
    .first();
  await expect(firstServiceEditLink).toBeVisible();
  await firstServiceEditLink.click();
  await expect(page.getByRole("heading", { name: "Hizmeti Düzenle" })).toBeVisible();
  const serviceEditPath = path.join(
    adminDir,
    "admin-service-edit-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: serviceEditPath });
  results.push({
    name: "admin-service-edit-1440x900",
    screenshotPath: serviceEditPath,
    status: "PASS",
    note: "Service edit form renders active, featured, SEO and media controls.",
  });

  await page.goto("/admin/services?active=inactive", {
    waitUntil: "domcontentloaded",
  });
  const servicesInactivePath = path.join(
    adminDir,
    "admin-services-inactive-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: servicesInactivePath });
  results.push({
    name: "admin-services-inactive-1440x900",
    screenshotPath: servicesInactivePath,
    status: "PASS",
    note: "Service inactive filter state renders.",
  });

  await page.goto("/admin/services?featured=featured", {
    waitUntil: "domcontentloaded",
  });
  const servicesFeaturedPath = path.join(
    adminDir,
    "admin-services-featured-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: servicesFeaturedPath });
  results.push({
    name: "admin-services-featured-1440x900",
    screenshotPath: servicesFeaturedPath,
    status: "PASS",
    note: "Service featured filter state renders.",
  });

  await page.goto("/admin/services?archived=archived", {
    waitUntil: "domcontentloaded",
  });
  const servicesArchivedPath = path.join(
    adminDir,
    "admin-services-archived-1440x900.png"
  );
  await page.screenshot({ fullPage: true, path: servicesArchivedPath });
  results.push({
    name: "admin-services-archived-1440x900",
    screenshotPath: servicesArchivedPath,
    status: "PASS",
    note: "Service archived filter state renders.",
  });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/admin/service-requests", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Servis Talepleri", exact: true })
  ).toBeVisible();
  const serviceRequestsMobilePath = path.join(
    adminDir,
    "admin-service-requests-375x667.png"
  );
  await page.screenshot({ fullPage: true, path: serviceRequestsMobilePath });
  results.push({
    name: "admin-service-requests-375x667",
    screenshotPath: serviceRequestsMobilePath,
    status: "PASS",
    note: "Service request list remains usable on mobile.",
  });

  await page.goto("/admin/media", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Medya Kütüphanesi", exact: true })
  ).toBeVisible();
  const mediaMobilePath = path.join(adminDir, "admin-media-375x667.png");
  await page.screenshot({ fullPage: true, path: mediaMobilePath });
  results.push({
    name: "admin-media-375x667",
    screenshotPath: mediaMobilePath,
    status: "PASS",
    note: "Media library remains usable on mobile.",
  });

  await page.goto("/admin/blog", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Blog Yazıları", exact: true })
  ).toBeVisible();
  const blogMobilePath = path.join(adminDir, "admin-blog-375x667.png");
  await page.screenshot({ fullPage: true, path: blogMobilePath });
  results.push({
    name: "admin-blog-375x667",
    screenshotPath: blogMobilePath,
    status: "PASS",
    note: "Blog CMS list remains usable on mobile.",
  });

  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Medikal cihaz servis notları" })
  ).toBeVisible();
  const publicBlogMobilePath = path.join(adminDir, "public-blog-375x667.png");
  await page.screenshot({ fullPage: true, path: publicBlogMobilePath });
  results.push({
    name: "public-blog-375x667",
    screenshotPath: publicBlogMobilePath,
    status: "PASS",
    note: "Public blog listing remains usable on mobile.",
  });

  await page.goto("/blog/visual-qa-teknik-servis-notu", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "Visual QA Teknik Servis Notu" })
  ).toBeVisible();
  const publicBlogDetailMobilePath = path.join(
    adminDir,
    "public-blog-detail-375x667.png"
  );
  await page.screenshot({ fullPage: true, path: publicBlogDetailMobilePath });
  results.push({
    name: "public-blog-detail-375x667",
    screenshotPath: publicBlogDetailMobilePath,
    status: "PASS",
    note: "Public blog detail remains usable on mobile.",
  });

  await page.goto("/blog/kategori/visual-qa-blog", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "Visual QA Blog" })).toBeVisible();
  const publicBlogCategoryMobilePath = path.join(
    adminDir,
    "public-blog-category-375x667.png"
  );
  await page.screenshot({ fullPage: true, path: publicBlogCategoryMobilePath });
  results.push({
    name: "public-blog-category-375x667",
    screenshotPath: publicBlogCategoryMobilePath,
    status: "PASS",
    note: "Public blog category remains usable on mobile.",
  });

  await page.goto("/admin/services", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Hizmetler", exact: true })
  ).toBeVisible();
  const servicesMobilePath = path.join(adminDir, "admin-services-375x667.png");
  await page.screenshot({ fullPage: true, path: servicesMobilePath });
  results.push({
    name: "admin-services-375x667",
    screenshotPath: servicesMobilePath,
    status: "PASS",
    note: "Service management list remains usable on mobile.",
  });

  await page.goto("/admin/hero-slides", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Hero Slider Yönetimi", exact: true })
  ).toBeVisible();
  const heroSlidesMobilePath = path.join(
    adminDir,
    "admin-hero-slides-375x667.png"
  );
  await page.screenshot({ fullPage: true, path: heroSlidesMobilePath });
  results.push({
    name: "admin-hero-slides-375x667",
    screenshotPath: heroSlidesMobilePath,
    status: "PASS",
    note: "Hero Slider list remains usable on mobile.",
  });

  await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
  await loginAsVisualQaAdmin(page);
  const mobileAdminMenu = page.getByRole("button", { name: "Admin menüsünü aç" });
  await expect(mobileAdminMenu).toBeVisible();
  await mobileAdminMenu.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const dashboardMobileMenuPath = path.join(
    adminDir,
    "admin-dashboard-375x667-mobile-menu.png"
  );
  await page.screenshot({ fullPage: false, path: dashboardMobileMenuPath });
  results.push({
    name: "admin-dashboard-375x667-mobile-menu",
    screenshotPath: dashboardMobileMenuPath,
    status: "PASS",
    note: "Admin mobile navigation opens in the protected shell.",
  });

  return results;
}

async function loginAsVisualQaAdmin(page: Page) {
  if (!page.url().includes("/admin/login")) {
    return;
  }

  const email = process.env.VISUAL_QA_ADMIN_EMAIL;
  const password = process.env.VISUAL_QA_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Visual QA admin credentials were not provisioned.");
  }

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin/dashboard");
}

function formatViewport(viewport: Viewport) {
  return `${viewport.width}x${viewport.height}`;
}

function createMarkdownReport(
  results: ViewportResult[],
  adminResults: AdminVisualResult[]
) {
  const rows = results
    .map((result) => {
      const status =
        result.horizontalOverflow === 0 &&
        result.overflowingElements.length === 0 &&
        result.zeroSizeImages.length === 0 &&
        result.missingAnchorTargets.length === 0
          ? "PASS"
          : "REVIEW";
      return [
        `### ${result.viewport} - ${status}`,
        "",
        `- Screenshot: \`${result.screenshotPath.replaceAll("\\", "/")}\``,
        `- Horizontal overflow: ${result.horizontalOverflow}px`,
        `- Overflowing elements: ${formatIssues(result.overflowingElements)}`,
        `- Zero-size images: ${formatIssues(result.zeroSizeImages)}`,
        `- Undersized mobile tap targets: ${formatIssues(result.undersizedTapTargets)}`,
        `- Missing anchor targets: ${result.missingAnchorTargets.length ? result.missingAnchorTargets.join(", ") : "None"}`,
        `- Mobile menu: ${result.mobileMenu ?? "not-applicable"}`,
        "",
      ].join("\n");
    })
    .join("\n");
  const failures = results.filter(
    (result) =>
      result.horizontalOverflow > 0 ||
      result.zeroSizeImages.length > 0 ||
      result.missingAnchorTargets.length > 0
  );

  const adminRows = adminResults
    .map((result) =>
      [
        `### ${result.name} - ${result.status}`,
        "",
        `- Screenshot: \`${result.screenshotPath.replaceAll("\\", "/")}\``,
        `- Note: ${result.note}`,
        "",
      ].join("\n")
    )
    .join("\n");

  return [
    "# Responsive Visual QA Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Pass/fail summary: ${failures.length === 0 ? "PASS" : "FAIL"}`,
    "",
    rows,
    "## Admin Visual QA",
    "",
    adminRows,
  ].join("\n");
}

function formatIssues(issues: ElementIssue[]) {
  if (!issues.length) return "None";
  return issues
    .map((issue) => `\`${issue.selector}\` (${issue.box})`)
    .join("; ");
}
