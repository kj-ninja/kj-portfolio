import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("home page renders with a single h1 and English lang", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page).toHaveTitle(/Krzysztof Jakubiak/);
});

// Guards the "content page ships no React runtime" decision. When the first island lands (E2),
// this test is expected to change on purpose: assert the island's bundle, not "zero".
test("home page ships no JavaScript", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(scripts).toEqual([]);
  await expect(page.locator("script")).toHaveCount(0);
});

// Guards wrangler.jsonc `not_found_handling: "404-page"`: an unknown path must return our page
// with a real 404 status, so crawlers do not index it and users get a way back.
test("unknown path returns the custom 404 page with status 404", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
});

for (const path of ["/", "/this-page-does-not-exist"]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`no WCAG 2.2 AA violations on ${path} (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
