import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { WCAG_TAGS } from "./helpers";

const NOT_FOUND = "/this-page-does-not-exist";

const PAGES = [
  "/",
  "/pl/",
  "/lab/",
  "/pl/lab/",
  "/notes/",
  "/pl/notes/",
  "/notes/workers-dev-switches-off/",
  "/pl/notes/workers-dev-switches-off/",
  "/about/",
  "/pl/about/",
  NOT_FOUND,
];

test("home page renders with a single h1 and English lang", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page).toHaveTitle(/Krzysztof Jakubiak/);
});

// Guards the "content pages ship no React runtime" decision. Inline scripts (theme, dock toggle)
// are allowed; external script requests and Astro islands are not.
for (const path of PAGES) {
  test(`${path} ships no external JavaScript and no islands`, async ({ page }) => {
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });

    await page.goto(path);
    await page.waitForLoadState("networkidle");

    expect(scripts).toEqual([]);
    await expect(page.locator("astro-island")).toHaveCount(0);
    await expect(page.locator("script[src]")).toHaveCount(0);
  });
}

// Guards wrangler.jsonc `not_found_handling: "404-page"`: an unknown path must return our page
// with a real 404 status, so crawlers do not index it and users get a way back.
test("unknown path returns the custom 404 page with status 404", async ({ page }) => {
  const response = await page.goto(NOT_FOUND);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
});

// Three ways a page can end up themed: an explicit stored choice (light, dark) and the OS dark
// preference with nothing stored (os-dark), which goes through the `prefers-color-scheme` block.
for (const path of PAGES) {
  for (const mode of ["light", "dark", "os-dark"] as const) {
    test(`no WCAG 2.2 AA violations on ${path} (${mode})`, async ({ page }) => {
      if (mode === "os-dark") {
        await page.emulateMedia({ colorScheme: "dark" });
      } else {
        await page.addInitScript((value) => localStorage.setItem("theme", value), mode);
      }
      const response = await page.goto(path);
      expect(response?.status()).toBe(path === NOT_FOUND ? 404 : 200);
      if (mode === "os-dark") await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
