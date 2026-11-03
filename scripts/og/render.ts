// Renders public/og/{en,pl}.png from scripts/og/template.html (1200x630).
// Text comes from ogText() (src/i18n/ui.ts). The texts used are written to scripts/og/rendered-text.json;
// a unit test compares that file with ui.ts, so changed copy without a re-render fails CI.
//
// Env:
//   OG_CHROMIUM_PATH  Optional absolute path to a Chromium/headless-shell binary. When set it is
//                     passed to chromium.launch as `executablePath`; otherwise Playwright's
//                     default browser is used.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { type OgText, ogText } from "../../src/lib/og-text";

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
    await page.goto(pathToFileURL(template).href);
    await page.evaluate(
      ([lang, text]: [string, OgText]) => {
        document.documentElement.lang = lang;
        for (const [id, value] of Object.entries(text)) {
          const el = document.getElementById(id);
          if (!el) throw new Error(`template has no #${id}`);
          el.textContent = value;
        }
      },
      [locale, ogText(locale)] as [string, OgText],
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${outDir}${locale}.png`, type: "png" });
    await page.close();
    console.log(`wrote public/og/${locale}.png`);
  }
} finally {
  await browser.close();
}

const rendered = { en: ogText("en"), pl: ogText("pl") };
await writeFile(
  fileURLToPath(new URL("./rendered-text.json", import.meta.url)),
  `${JSON.stringify(rendered, null, 2)}\n`,
);
console.log("wrote scripts/og/rendered-text.json");
