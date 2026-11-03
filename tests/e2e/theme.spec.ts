import { expect, type Page, test } from "@playwright/test";
import { blockStorage } from "./helpers";

test.describe("theme without flash", () => {
  test("stored dark theme is set before DOMContentLoaded and first paint, script precedes stylesheet", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
      const at: { dcl?: string | undefined; raf?: string | undefined } = {};
      (window as unknown as { __themeAt: typeof at }).__themeAt = at;
      const read = () => document.documentElement.dataset.theme ?? "none";
      document.addEventListener("DOMContentLoaded", () => {
        at.dcl = read();
      });
      requestAnimationFrame(() => {
        at.raf = read();
      });
    });
    await page.goto("/");
    await page.waitForFunction(() => {
      const at = (window as unknown as { __themeAt: { dcl?: string; raf?: string } }).__themeAt;
      return at.dcl !== undefined && at.raf !== undefined;
    });
    const at = await page.evaluate(() => (window as unknown as { __themeAt: object }).__themeAt);
    // DCL and the first rAF can fire after the head script ran wherever it sits; the script-before-stylesheet order below is the real guard.
    expect(at).toEqual({ dcl: "dark", raf: "dark" });

    // The blocking inline script must come before any stylesheet, otherwise CSS can paint first.
    const html = await (await page.request.get("/")).text();
    const script = html.indexOf("<script");
    const stylesheet = html.search(/<link rel="stylesheet"|<style/);
    expect(script).toBeGreaterThan(-1);
    expect(stylesheet).toBeGreaterThan(-1);
    expect(script).toBeLessThan(stylesheet);
  });

  // Computed colours come back as oklch(), so rasterise the value to read plain sRGB channels.
  // Canvas ignores a fillStyle it cannot parse and keeps the previous one, so a sentinel is set
  // first: reading the sentinel back means the computed colour did not parse, and the check fails
  // instead of letting a "dark" assertion pass on a failed parse.
  const SENTINEL = [1, 2, 3];
  const surfaceOf = async (page: Page) => {
    const rgb = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return [];
      ctx.fillStyle = "#010203";
      ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
    });
    expect(rgb, "computed background colour did not parse (sentinel read back)").not.toEqual(SENTINEL);
    return rgb;
  };

  test("stored light overrides OS dark", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const rgb = await surfaceOf(page);
    expect(rgb).toHaveLength(3);
    expect(rgb.every((c) => c > 200)).toBe(true);
  });

  test("stored dark overrides OS light", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const rgb = await surfaceOf(page);
    expect(rgb).toHaveLength(3);
    expect(rgb.every((c) => c < 60)).toBe(true);
  });

  test("invalid stored value is ignored and the OS setting applies", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem("theme", "banana"));
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    const rgb = await surfaceOf(page);
    expect(rgb).toHaveLength(3);
    expect(rgb.every((c) => c > 200)).toBe(true);
    expect(errors).toEqual([]);
  });

  test("without a stored theme the OS setting applies and data-theme is absent", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    const rgb = await surfaceOf(page);
    expect(rgb).toHaveLength(3);
    expect(rgb.every((c) => c < 60)).toBe(true);
  });

  test("blocked storage still renders (theme script is try/catch)", async ({ page }) => {
    await blockStorage(page);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("locale metadata", () => {
  for (const [path, lang] of [
    ["/", "en"],
    ["/pl/", "pl"],
  ] as const) {
    test(`${path} has lang=${lang}, canonical and hreflang`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://krzysztofjakubiak.com${path}`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        "href",
        "https://krzysztofjakubiak.com/",
      );
      await expect(page.locator('link[rel="alternate"][hreflang="pl"]')).toHaveAttribute(
        "href",
        "https://krzysztofjakubiak.com/pl/",
      );
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        "href",
        "https://krzysztofjakubiak.com/",
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        `https://krzysztofjakubiak.com/og/${lang}.png`,
      );
    });
  }
});
