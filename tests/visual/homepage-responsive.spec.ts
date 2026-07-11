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

const outputRoot = "visual-qa";
const homepageDir = path.join(outputRoot, "homepage");
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

  await writeFile(reportPath, createMarkdownReport(results), "utf8");
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
      const overflowingElements: BrowserIssue[] = [];
      const zeroSizeImages: BrowserIssue[] = [];
      const undersizedTapTargets: BrowserIssue[] = [];
      const missingAnchorTargets: string[] = [];

      document.querySelectorAll("body *").forEach((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const isDecorative = element.getAttribute("aria-hidden") === "true";
        const isVisuallyHidden =
          style.position === "absolute" &&
          (rect.left < -100 || rect.width <= 1 || rect.height <= 1);

        if (
          !isDecorative &&
          !isVisuallyHidden &&
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

function formatViewport(viewport: Viewport) {
  return `${viewport.width}x${viewport.height}`;
}

function createMarkdownReport(results: ViewportResult[]) {
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

  return [
    "# Responsive Visual QA Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Pass/fail summary: ${failures.length === 0 ? "PASS" : "FAIL"}`,
    "",
    rows,
  ].join("\n");
}

function formatIssues(issues: ElementIssue[]) {
  if (!issues.length) return "None";
  return issues
    .map((issue) => `\`${issue.selector}\` (${issue.box})`)
    .join("; ");
}
