import { expect, test } from "@playwright/test";
import { blockStorage, expectNoHorizontalScroll } from "./helpers";

test("dock lists the four sections and marks the current one", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Lab" })).toHaveAttribute("href", "/lab/");
  await expect(nav.getByRole("link", { name: "Notes" })).toHaveAttribute("href", "/notes/");
  await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about/");
});

test("language switch keeps the current path", async ({ page }) => {
  await page.goto("/");
  const toPolish = page.getByRole("link", { name: "PL, Polski" });
  await expect(toPolish).toHaveText("PL");
  await toPolish.click();
  await expect(page).toHaveURL("/pl/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  const toEnglish = page.getByRole("link", { name: "EN, English" });
  await expect(toEnglish).toHaveText("EN");
  await toEnglish.click();
  await expect(page).toHaveURL("/");
});

test("language switch on the 404 page points to the Polish home", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("link", { name: "PL, Polski" })).toHaveAttribute("href", "/pl/");
});

test("Polish home marks Home as current and links to /pl/", async ({ page }) => {
  await page.goto("/pl/");
  const nav = page.getByRole("navigation", { name: "Główna", exact: true });
  const home = nav.locator('a[aria-current="page"]');
  await expect(home).toHaveCount(1);
  await expect(home).toHaveAttribute("href", "/pl/");
});

// aria-current="page" means "this link is the page you are on"; inside a section (a note page)
// the section link is current but not the page itself, so it gets aria-current="true".
for (const path of ["/notes/workers-dev-switches-off/", "/pl/notes/workers-dev-switches-off/"]) {
  test(`dock marks Notes as current on the nested note page ${path}`, async ({ page }) => {
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: path.startsWith("/pl") ? "Główna" : "Primary", exact: true });
    const current = nav.locator("a[aria-current]");
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("aria-current", "true");
    await expect(current).toHaveAttribute("href", path.startsWith("/pl") ? "/pl/notes/" : "/notes/");
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);
    // The current-section style applies to any aria-current value, not only "page".
    await expect(current).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });
}

for (const [path, href] of [
  ["/notes/", "/notes/"],
  ["/pl/notes/", "/pl/notes/"],
  ["/lab/", "/lab/"],
  ["/about/", "/about/"],
] as const) {
  test(`dock marks the section root ${path} with aria-current="page"`, async ({ page }) => {
    await page.goto(path);
    const current = page
      .getByRole("navigation", { name: path.startsWith("/pl") ? "Główna" : "Primary", exact: true })
      .locator("a[aria-current]");
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(current).toHaveAttribute("href", href);
  });
}

test("theme toggle switches, persists and reports its state", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Dark theme" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");
});

test("theme toggle reflects the OS preference when nothing is stored, and follows its changes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Dark theme" });
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the theme toggle is not shown, since nothing could make it work", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#theme-toggle")).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Lab" })).toBeVisible();
  });
});

test("theme toggle still works when storage is blocked", async ({ page }) => {
  await blockStorage(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Dark theme" });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

for (const width of [320, 390]) {
  test(`dock targets are at least 44px and do not overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const targets = page.getByRole("navigation", { name: "Primary" }).locator("a, button");
    expect(await targets.count()).toBe(6);
    for (const [i, target] of (await targets.all()).entries()) {
      const box = await target.boundingBox();
      expect(box?.width ?? 0, `target ${i} width`).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0, `target ${i} height`).toBeGreaterThanOrEqual(44);
    }
    await expectNoHorizontalScroll(page);
  });
}
