import { expect, test } from "@playwright/test";

test("/about/ and /pl/about/ render with contact links", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Frontend engineer");
  await expect(page.getByRole("link", { name: /github/i }).first()).toHaveAttribute(
    "href",
    "https://github.com/kj-ninja",
  );
  await page.goto("/pl/about/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Wrocławia");
});

test("404 is bilingual, has status 404 and links to both home pages", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Wróć na stronę główną" })).toHaveAttribute("href", "/pl/");
  await expect(page.locator("p[lang='pl']")).toHaveCount(1);
  // No i18n fallback: a Polish URL without a page is a real 404, not a redirect to English.
  const polish = await page.goto("/pl/nope/");
  expect(polish?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
});

test("404 is noindex and advertises no canonical or alternates; normal pages keep them", async ({ page }) => {
  await page.goto("/nope/");
  await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", "noindex");
  await expect(page.locator("link[rel='canonical']")).toHaveCount(0);
  await expect(page.locator("link[rel='alternate'][hreflang]")).toHaveCount(0);
  await expect(page.locator("meta[property='og:image']")).toHaveCount(1);
  await expect(page.locator("meta[property='og:url']")).toHaveCount(0);
  await page.goto("/about/");
  await expect(page.locator("meta[name='robots']")).toHaveCount(0);
  await expect(page.locator("link[rel='canonical']")).toHaveCount(1);
  await expect(page.locator("meta[property='og:url']")).toHaveCount(1);
});
