import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll } from "./helpers";

for (const [path, labHref, texts] of [
  ["/", "/lab/", { work: "Work", lab: "Lab", notes: "Notes", cta: "See the Lab" }],
  ["/pl/", "/pl/lab/", { work: "Projekty", lab: "Lab", notes: "Notatki", cta: "Zobacz Lab" }],
] as const) {
  test(`${path} shows hero, now, work list, lab teaser and notes teaser`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("link", { name: texts.cta })).toHaveAttribute("href", labHref);

    const work = page.getByRole("region", { name: texts.work, exact: true });
    await expect(work.getByRole("listitem")).toHaveCount(3);
    await expect(work.getByText("Forge")).toBeVisible();

    const lab = page.getByRole("region", { name: texts.lab, exact: true });
    await expect(lab.getByRole("listitem")).toHaveCount(3);
    await expect(lab.getByText("01")).toBeVisible();

    const notes = page.getByRole("region", { name: texts.notes, exact: true });
    await expect(notes.getByRole("listitem")).toHaveCount(1);
  });
}

test("/pl/ marks English fallback Lab rows with lang=en", async ({ page }) => {
  await page.goto("/pl/");
  const rows = page.getByRole("region", { name: "Lab", exact: true }).getByRole("listitem");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).locator('[lang="en"]').first()).toBeVisible();
  }
});

test("/ Lab rows carry no lang attribute", async ({ page }) => {
  await page.goto("/");
  const lab = page.getByRole("region", { name: "Lab", exact: true });
  await expect(lab.locator("[lang]")).toHaveCount(0);
});

test("home ships only inline scripts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("script[src]")).toHaveCount(0);
  await expect(page.locator("astro-island")).toHaveCount(0);
  const inlineBytes = await page
    .locator("script")
    .evaluateAll((nodes) => nodes.reduce((sum, node) => sum + (node.textContent?.length ?? 0), 0));
  expect(inlineBytes).toBeLessThan(2000);
});

for (const path of ["/", "/pl/"]) {
  test(`${path} has no horizontal scroll at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  });
}
