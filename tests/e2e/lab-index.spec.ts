import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { blockStorage, expectNoHorizontalScroll, WCAG_TAGS } from "./helpers";

for (const [path, building] of [
  ["/lab/", "under construction"],
  ["/pl/lab/", "w budowie"],
] as const) {
  test(`${path} lists all 14 entries in order with status`, async ({ page }) => {
    await page.goto(path);
    const items = page.getByRole("list", { name: "Lab", exact: true }).getByRole("listitem");
    await expect(items).toHaveCount(14);
    await expect(items.first()).toContainText("01");
    await expect(items.first()).toContainText("Client-side cache");
    await expect(items.last()).toContainText("14");
    await expect(items.first().getByText(building)).toBeVisible();
    // building entries are not links
    await expect(items.first().getByRole("link")).toHaveCount(0);
  });

  test(`${path} has no horizontal scroll at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  });
}

test("/pl/lab/ marks English-only entries", async ({ page }) => {
  await page.goto("/pl/lab/");
  await expect(page.getByText("Na razie tylko po angielsku").first()).toBeVisible();
});

test("/pl/lab/ marks English fallback text with lang=en, but not Polish UI strings", async ({ page }) => {
  await page.goto("/pl/lab/");
  const first = page.locator("li[data-slug]").first();
  await expect(first.locator('[lang="en"]')).toHaveCount(2);
  await expect(first.locator('[lang="en"]').first()).toContainText("Client-side cache");
  await expect(first.getByText("Na razie tylko po angielsku")).not.toHaveAttribute("lang", "en");
  await expect(first.getByText("w budowie")).not.toHaveAttribute("lang", "en");
});

test("/lab/ has no lang overrides on rows", async ({ page }) => {
  await page.goto("/lab/");
  await expect(page.locator("li[data-slug] [lang]")).toHaveCount(0);
});

test("ships no external JavaScript and no islands", async ({ page }) => {
  await page.goto("/lab/");
  await expect(page.locator("script[src]")).toHaveCount(0);
  await expect(page.locator("astro-island")).toHaveCount(0);
});

test("revisit script marks due entries from localStorage", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "lab-revisit",
      JSON.stringify({ "event-loop": "2000-01-01", "debounce-vs-throttle": "2999-01-01" }),
    );
  });
  await page.goto("/lab/");
  await expect(page.locator('[data-slug="event-loop"]').getByText("due for review")).toBeVisible();
  await expect(page.locator('[data-slug="debounce-vs-throttle"] [data-revisit]')).toBeHidden();
  await expect(page.locator("[data-revisit]:visible")).toHaveCount(1);
});

for (const [name, value] of [
  ["corrupt JSON", "{not json"],
  ["null", "null"],
  ["array", "[1,2]"],
  ["number", "5"],
  ["string", '"x"'],
  ["bad date values", JSON.stringify({ "event-loop": 5, "debounce-vs-throttle": "garbage", closures: null })],
  ["selector-breaking slug", JSON.stringify({ '"]x': "2000-01-01" })],
] as const) {
  test(`revisit script ignores ${name} without errors or badges`, async ({ page }) => {
    await page.addInitScript((v) => localStorage.setItem("lab-revisit", v), value);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/lab/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-revisit]:visible")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("revisit script survives blocked storage", async ({ page }) => {
  await blockStorage(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/lab/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("revisit compares against the local date", async ({ page }) => {
  await page.addInitScript(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    localStorage.setItem("lab-revisit", JSON.stringify({ "event-loop": today }));
  });
  await page.goto("/lab/");
  await expect(page.locator('[data-slug="event-loop"]').getByText("due for review")).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`/lab/ with a due revisit badge has no axe violations in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.theme = t;
      localStorage.setItem("lab-revisit", JSON.stringify({ "event-loop": "2000-01-01" }));
    }, theme);
    await page.goto("/lab/");
    await expect(page.locator('[data-slug="event-loop"] [data-revisit]')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}
