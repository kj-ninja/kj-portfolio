import { expect, type Page } from "@playwright/test";

/** axe-core tags for WCAG 2.0, 2.1 and 2.2, levels A and AA. */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Makes every `localStorage` access throw, as blocked storage or a locked-down private mode does. */
export async function blockStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
}

/** The document must not be wider than the viewport's layout width (no horizontal scrolling). */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, "document scrollWidth vs clientWidth").toBeLessThanOrEqual(clientWidth);
}
