// Renders public/og/{en,pl}.png from scripts/og/template.html (1200x630).
//
// Env:
//   OG_CHROMIUM_PATH  Optional absolute path to a Chromium/headless-shell binary. When set it is
//                     passed to chromium.launch as `executablePath`; otherwise Playwright's
//                     default browser is used.
import { mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const template = fileURLToPath(new URL("./template.html", import.meta.url));
const outDir = fileURLToPath(new URL("../../public/og/", import.meta.url));

await mkdir(outDir, { recursive: true });
const executablePath = process.env.OG_CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ executablePath });
try {
  for (const locale of ["en", "pl"] as const) {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });
    await page.goto(`${pathToFileURL(template).href}?locale=${locale}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${outDir}${locale}.png`, type: "png" });
    await page.close();
    console.log(`wrote public/og/${locale}.png`);
  }
} finally {
  await browser.close();
}
