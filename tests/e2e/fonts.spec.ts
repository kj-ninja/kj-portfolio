import { expect, test } from "@playwright/test";

test("headings use the self-hosted display font and nothing is fetched from third parties", async ({ page }) => {
  const thirdParty: string[] = [];
  const fonts: string[] = [];
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (url.hostname !== "127.0.0.1") thirdParty.push(r.url());
    if (r.resourceType() === "font") fonts.push(url.pathname);
  });
  await page.goto("/pl/");
  await page.evaluate(() => document.fonts.ready);
  const family = await page.getByRole("heading", { level: 1 }).evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain("Inter Tight Variable");
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
  );
  expect(loaded).toContain("Inter Tight Variable");
  expect(thirdParty).toEqual([]);
  // The Polish h1 has diacritics (e.g. "ę"), which live in the latin-ext subset of the font.
  const latinExt = fonts.filter((path) => path.includes("inter-tight") && path.includes("latin-ext"));
  expect(latinExt.length, `font requests: ${fonts.join(", ")}`).toBeGreaterThan(0);
});
