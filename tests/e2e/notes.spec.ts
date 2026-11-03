import { expect, test } from "@playwright/test";

test("/notes/ lists the note and links to it", async ({ page }) => {
  await page.goto("/notes/");
  const link = page.getByRole("link", { name: /workers_dev switches off/ });
  await expect(link).toHaveAttribute("href", "/notes/workers-dev-switches-off/");
  await link.click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("workers_dev");
  await expect(page.getByRole("article")).toContainText("custom_domain");
});

test("note language switch goes to the translated note", async ({ page }) => {
  await page.goto("/notes/workers-dev-switches-off/");
  await expect(page.locator("#lang-switch")).toHaveAttribute("href", "/pl/notes/workers-dev-switches-off/");
  await page.goto("/pl/notes/workers-dev-switches-off/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.locator("#lang-switch")).toHaveAttribute("href", "/notes/workers-dev-switches-off/");
});

test("note pages ship no external scripts", async ({ page }) => {
  await page.goto("/notes/workers-dev-switches-off/");
  await expect(page.locator("script[src]")).toHaveCount(0);
  await expect(page.locator("astro-island")).toHaveCount(0);
});

test("note page has one h1, an article and a mono date", async ({ page }) => {
  await page.goto("/pl/notes/workers-dev-switches-off/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.locator("article time")).toHaveClass(/font-mono/);
});

test("Polish notes index links to the Polish note", async ({ page }) => {
  await page.goto("/pl/notes/");
  await expect(page.locator("main a[href='/pl/notes/workers-dev-switches-off/']")).toHaveCount(1);
});

test("unknown note returns 404", async ({ page }) => {
  const response = await page.goto("/notes/does-not-exist/");
  expect(response?.status()).toBe(404);
});
