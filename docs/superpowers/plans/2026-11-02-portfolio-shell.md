# Portfolio Shell Implementation Plan (plan 1 of 2 for spec E2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the bilingual (EN default, PL under `/pl/`) portfolio shell with dock navigation, flash-free light/dark theme, content collections for Lab/Notes/Work, the Lab index listing all 14 topics, Notes, About, bilingual 404 and SEO, with zero React on every page.

**Architecture:** Astro 7 static output served as Cloudflare Workers static assets. Pages exist twice (`src/pages/<route>.astro` and `src/pages/pl/<route>.astro`) and each pair renders one shared view component with a `locale` prop, so copy and markup live once. Theme is a `data-theme` attribute set by an inline head script; all colours are CSS variables switched by that attribute, so no Tailwind `dark:` variants are needed. Content is validated by zod at build time; a loader wrapper enforces "Polish is mandatory for ready Lab entries".

**Tech Stack:** Astro 7.4.4, Tailwind 4 (`@tailwindcss/vite`), Bun 1.4.2, Biome 2, Vitest 5 (new), Playwright 1.64 + `@axe-core/playwright`, `@astrojs/mdx` 8 (new), `@astrojs/sitemap` 3 (new), `@fontsource-variable/inter-tight` 5 (new), Wrangler 4.

Spec: `docs/superpowers/specs/2026-11-02-portfolio-shell-and-lab-design.md`. Topic list: `docs/lab-topics.md`. Plan 2 (Lab sandbox platform + entry 01, spec §6–§7) follows this plan and depends on Tasks 1–6 here.

## Global Constraints

- Static output, no adapter; `wrangler.jsonc` unchanged (`assets.directory: ./dist`, `not_found_handling: "404-page"`).
- Dependencies are added **only** with `bun add` (`-D` for dev), never `bun install <pkg>`; before each `bun add`, open the package's official install docs, show the exact command, and wait for Krzysztof's confirmation (his `package-install-research` rule). `bun install --frozen-lockfile` is the only install form.
- **Commits need Krzysztof's explicit consent containing the word "commit".** A "Commit" step below means: stop, show `git status` and the diff summary, and commit only after that consent. Never `git add` before it. No rebase, no stash, no reset --hard.
- English is the default locale (`/`), Polish lives under `/pl/`. English content is mandatory; Polish is mandatory only for Lab entries with `status: "ready"`.
- Every page other than Lab entry pages ships **no React and no external script**: only inline scripts (theme, dock toggle, Lab revisit). Tests assert this.
- WCAG 2.2 AA with axe on every page type × both themes × both locales. 44 px touch targets in the dock. 16 px side gutters on phones. Everything animated respects `prefers-reduced-motion`.
- Colours only through tokens in `src/styles/global.css`; no hard-coded colours in components.
- All user-visible strings go through `src/i18n/ui.ts`; no literal copy in `.astro` files except content from collections.
- Code, comments, commit messages in English. Conventional Commits (`feat:`, `test:`, `chore:`, `docs:`), as in the existing history.
- Format and lint with Biome before every commit: `bunx biome check --write .`
- Learning log: when a task implements a §14 topic from the spec, append a row to `docs/learning-log.md` in the same task (Task 11 lists them).

## Deviations from the spec, decided while planning

1. Spec §4 says the "PL mandatory for ready" rule is a zod `superRefine`. A per-entry schema cannot see sibling files, so it is implemented as a **loader wrapper** (`requirePolishForReady`, Task 4) that runs after the glob loader and throws when an `en/<slug>` entry with `status: "ready"` has no `pl/<slug>`. Same effect: `astro build` fails. Task 11 updates the spec sentence.
2. Spec §10 says Astro's i18n fallback redirects a direct hit on a missing Polish page to English. Astro's fallback is route-level; a dynamic route (`pl/notes/[slug]`) that exists in both locales gets no per-slug fallback in a static build. Missing Polish note slugs therefore 404 (they are never linked: the switch goes to the index). Task 11 updates the spec row.
3. No Tailwind `dark:` variant is configured. Tokens switch with `data-theme`, so components never need it.

## File structure

| Path                                                                                                          | Responsibility                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/i18n/locales.ts`                                                                                         | locale constants and guards (`locales`, `defaultLocale`, `isLocale`, `otherLocale`, `toLocale`) |
| `src/i18n/ui.ts`                                                                                              | typed UI strings `en`/`pl`, `t(locale, key, vars)`                                              |
| `src/i18n/ui.test.ts`                                                                                         | completeness test                                                                               |
| `src/lib/ids.ts`                                                                                              | `splitId("en/client-cache")` → `{ locale, slug }`                                               |
| `src/lib/content.ts`                                                                                          | collection helpers: `labEntries(locale)`, `noteEntries(locale)`, `workItems()`                  |
| `src/lib/routes.ts`                                                                                           | `localeUrl(locale, path)` and `alternates(path)` built on `astro:i18n`                          |
| `src/content/schemas.ts`                                                                                      | zod schemas without Astro imports (unit-testable)                                               |
| `src/content/loaders.ts`                                                                                      | `requirePolishForReady(loader)`                                                                 |
| `src/content.config.ts`                                                                                       | collections `lab`, `notes`, `work`                                                              |
| `src/content/lab/{en,pl}/*.mdx`, `src/content/notes/{en,pl}/*.mdx`, `src/content/work.yaml`                   | content                                                                                         |
| `src/styles/global.css`                                                                                       | tokens, theme switching, base typography                                                        |
| `src/layouts/Base.astro`                                                                                      | `<head>` (meta, canonical, hreflang, OG, theme script), dock, skip link                         |
| `src/components/ThemeScript.astro`                                                                            | inline head script that applies the stored theme                                                |
| `src/components/Dock.astro`                                                                                   | primary nav + language link + theme toggle (with its inline script)                             |
| `src/components/Eyebrow.astro`, `src/components/ListRow.astro`, `src/components/SectionHeading.astro`         | small presentational pieces                                                                     |
| `src/views/HomeView.astro`, `LabIndexView.astro`, `NotesIndexView.astro`, `NoteView.astro`, `AboutView.astro` | page bodies, one per page type, `locale` prop                                                   |
| `src/pages/*.astro`, `src/pages/pl/**`                                                                        | thin route files                                                                                |
| `public/robots.txt`, `public/og/en.png`, `public/og/pl.png`                                                   | static SEO assets                                                                               |
| `scripts/og/template.html`, `scripts/og/render.ts`                                                            | one-off OG image renderer (Playwright)                                                          |
| `tests/e2e/*.spec.ts`                                                                                         | Playwright suites                                                                               |
| `vitest.config.ts`                                                                                            | unit test config via `getViteConfig`                                                            |

---

### Task 1: Locale constants, UI strings and Vitest

**Files:**
- Create: `src/i18n/locales.ts`, `src/i18n/ui.ts`, `src/i18n/ui.test.ts`, `vitest.config.ts`
- Modify: `package.json` (scripts), `.github/workflows/ci.yml` (step after `astro check`)

**Interfaces:**
- Produces: `type Locale = "en" | "pl"`, `locales`, `defaultLocale`, `isLocale(v): v is Locale`, `otherLocale(l)`, `toLocale(v?: string): Locale`; `type UiKey`, `t(locale: Locale, key: UiKey, vars?: Record<string, string | number>): string`.

- [ ] **Step 1: Add Vitest (docs gate, then install)**

Open https://vitest.dev/guide/ and https://docs.astro.build/en/guides/testing/#vitest, show Krzysztof the command below, wait for his confirmation, then run:

```bash
bun add -D vitest
```

Expected: `package.json` gains `"vitest": "^5.0.5"` under `devDependencies`; `bun.lock` changes.

- [ ] **Step 2: Vitest config and script**

Create `vitest.config.ts`:

```ts
import { getViteConfig } from "astro/config";

// Astro's Vite config gives tests the same aliases and virtual modules as the site.
export default getViteConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

In `package.json` add scripts:

```json
"test:unit": "vitest run",
"test": "vitest run && playwright test"
```

- [ ] **Step 3: Write the failing completeness test**

Create `src/i18n/ui.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { locales } from "./locales";
import { type UiKey, t, ui } from "./ui";

describe("ui strings", () => {
  it("has the same keys in every locale", () => {
    const enKeys = Object.keys(ui.en).sort();
    for (const locale of locales) {
      expect(Object.keys(ui[locale]).sort()).toEqual(enKeys);
    }
  });

  it("has no empty strings", () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(ui[locale])) {
        expect(value.trim(), `${locale}.${key}`).not.toBe("");
      }
    }
  });

  it("interpolates {vars}", () => {
    expect(t("en", "meta.readingMinutes", { n: 6 })).toBe("6 min");
    expect(t("pl", "meta.readingMinutes", { n: 6 })).toBe("6 min");
  });

  it("falls back to the key when a var is missing", () => {
    const key: UiKey = "meta.readingMinutes";
    expect(t("en", key)).toBe("{n} min");
  });
});
```

- [ ] **Step 4: Run it to see it fail**

Run: `bun run test:unit`
Expected: FAIL, `Cannot find module './locales'` (or `./ui`).

- [ ] **Step 5: Implement locales and strings**

Create `src/i18n/locales.ts`:

```ts
export const locales = ["en", "pl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "pl" : "en";
}

/** Astro.currentLocale is `string | undefined`; normalise it once at the page boundary. */
export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}
```

Create `src/i18n/ui.ts` (copy from the mockup; Krzysztof edits wording later in this one file):

```ts
import type { Locale } from "./locales";

const en = {
  "site.name": "Krzysztof Jakubiak",
  "site.title": "Krzysztof Jakubiak — Frontend engineer",
  "site.description":
    "Frontend engineer building the interfaces of products that use AI. Lab: interview concepts taken apart with real code and sandboxes.",
  "skip.toContent": "Skip to content",

  "nav.primary": "Primary",
  "nav.home": "Home",
  "nav.lab": "Lab",
  "nav.notes": "Notes",
  "nav.about": "About",
  "nav.switchLocale": "Polski",
  "nav.switchLocaleShort": "PL",
  "theme.toggle": "Dark theme",

  "home.eyebrow": "Krzysztof Jakubiak · Wrocław",
  "home.headline.before": "Frontend engineer. I build the ",
  "home.headline.accent": "interfaces",
  "home.headline.after": " of products that use AI.",
  "home.lead": "Shipped products with real users, written up with the decisions, the failures and the numbers.",
  "home.cta.lab": "See the Lab",
  "home.cta.work": "Work",
  "home.now.label": "Now",
  "home.now.text":
    "Building Newsletter Stories: an app that turns my newsletter inbox into posts. Training for a half marathon in June 2027.",
  "home.work.label": "Work",
  "home.lab.label": "Lab",
  "home.lab.all": "All entries",
  "home.notes.label": "Notes",
  "home.notes.all": "All notes",

  "work.status.live": "live",
  "work.status.repo": "repo",
  "work.status.in-progress": "in progress",

  "lab.eyebrow": "Lab",
  "lab.title": "Frontend concepts that keep coming up in interviews, taken apart.",
  "lab.intro":
    "One concept per entry, one list. A plain explanation, real code, a sandbox you can click, and my own conclusions. No frameworks war, no 40-minute reads.",
  "lab.count.all": "all",
  "lab.count.ready": "ready",
  "lab.count.building": "under construction",
  "lab.status.ready": "ready",
  "lab.status.building": "under construction",
  "lab.status.planned": "planned",
  "lab.englishOnly": "English only for now",
  "lab.revisit.due": "due for review",
  "lab.footer": "Sources for each entry: the code itself, MDN, framework docs, and the newsletters I read.",

  "notes.eyebrow": "Notes",
  "notes.title": "Short write-ups of decisions and failures from building things.",
  "notes.empty": "Nothing here yet.",
  "notes.backToIndex": "All notes",

  "about.eyebrow": "About",
  "about.title": "Frontend engineer in Wrocław.",
  "about.text":
    "I build interfaces for products that use AI, and I write down what I learn while building my own. This site is the record.",
  "about.contact.label": "Reach me",
  "about.colophon.label": "Colophon",
  "about.colophon.text":
    "Astro, Tailwind, Cloudflare Workers. Inter Tight for headings, your system fonts for the rest. Source on GitHub.",

  "notFound.eyebrow": "404",
  "notFound.title": "Page not found",
  "notFound.text": "The page you were looking for does not exist.",
  "notFound.home": "Go to the home page",

  "meta.readingMinutes": "{n} min",
  "meta.sandbox": "sandbox",
} as const;

export type UiKey = keyof typeof en;
export type UiStrings = Record<UiKey, string>;

const pl: UiStrings = {
  "site.name": "Krzysztof Jakubiak",
  "site.title": "Krzysztof Jakubiak — Frontend engineer",
  "site.description":
    "Frontend engineer budujący interfejsy produktów opartych na AI. Lab: koncepty z rozmów rekrutacyjnych rozebrane na części, z kodem i sandboxami.",
  "skip.toContent": "Przejdź do treści",

  "nav.primary": "Główna",
  "nav.home": "Start",
  "nav.lab": "Lab",
  "nav.notes": "Notatki",
  "nav.about": "O mnie",
  "nav.switchLocale": "English",
  "nav.switchLocaleShort": "EN",
  "theme.toggle": "Ciemny motyw",

  "home.eyebrow": "Krzysztof Jakubiak · Wrocław",
  "home.headline.before": "Frontend engineer. Buduję ",
  "home.headline.accent": "interfejsy",
  "home.headline.after": " produktów, które używają AI.",
  "home.lead": "Produkty z prawdziwymi użytkownikami, opisane razem z decyzjami, porażkami i liczbami.",
  "home.cta.lab": "Zobacz Lab",
  "home.cta.work": "Projekty",
  "home.now.label": "Teraz",
  "home.now.text":
    "Buduję Newsletter Stories: aplikację, która zamienia skrzynkę z newsletterami w posty. Trenuję do półmaratonu w czerwcu 2027.",
  "home.work.label": "Projekty",
  "home.lab.label": "Lab",
  "home.lab.all": "Wszystkie wpisy",
  "home.notes.label": "Notatki",
  "home.notes.all": "Wszystkie notatki",

  "work.status.live": "działa",
  "work.status.repo": "repo",
  "work.status.in-progress": "w budowie",

  "lab.eyebrow": "Lab",
  "lab.title": "Koncepty frontendowe, które wracają na rozmowach rekrutacyjnych, rozebrane na części.",
  "lab.intro":
    "Jeden koncept na wpis, jedna lista. Proste wyjaśnienie, prawdziwy kod, klikalny sandbox i moje własne wnioski. Bez wojen o frameworki, bez 40-minutowych tekstów.",
  "lab.count.all": "wszystkie",
  "lab.count.ready": "gotowe",
  "lab.count.building": "w budowie",
  "lab.status.ready": "gotowe",
  "lab.status.building": "w budowie",
  "lab.status.planned": "planowane",
  "lab.englishOnly": "Na razie tylko po angielsku",
  "lab.revisit.due": "do powtórki",
  "lab.footer": "Źródła każdego wpisu: sam kod, MDN, dokumentacja frameworków i newslettery, które czytam.",

  "notes.eyebrow": "Notatki",
  "notes.title": "Krótkie zapisy decyzji i porażek z budowania rzeczy.",
  "notes.empty": "Jeszcze nic tu nie ma.",
  "notes.backToIndex": "Wszystkie notatki",

  "about.eyebrow": "O mnie",
  "about.title": "Frontend engineer z Wrocławia.",
  "about.text":
    "Buduję interfejsy produktów, które używają AI, i zapisuję, czego uczę się, budując własne. Ta strona jest tym zapisem.",
  "about.contact.label": "Kontakt",
  "about.colophon.label": "Kolofon",
  "about.colophon.text":
    "Astro, Tailwind, Cloudflare Workers. Inter Tight w nagłówkach, fonty systemowe w treści. Źródła na GitHubie.",

  "notFound.eyebrow": "404",
  "notFound.title": "Nie ma takiej strony",
  "notFound.text": "Strona, której szukasz, nie istnieje.",
  "notFound.home": "Wróć na stronę główną",

  "meta.readingMinutes": "{n} min",
  "meta.sandbox": "sandbox",
};

export const ui: Record<Locale, UiStrings> = { en, pl };

export function t(locale: Locale, key: UiKey, vars?: Record<string, string | number>): string {
  const template = ui[locale][key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}
```

- [ ] **Step 6: Run the unit tests**

Run: `bun run test:unit`
Expected: `4 passed`.

- [ ] **Step 7: Add the CI step**

In `.github/workflows/ci.yml`, after the `Type and template check (astro check)` step insert:

```yaml
- name: Unit tests (Vitest)
  run: bun run test:unit
```

- [ ] **Step 8: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add package.json bun.lock vitest.config.ts src/i18n .github/workflows/ci.yml
git commit -m "feat: add typed UI strings for en/pl and Vitest"
```

---

### Task 2: Theme tokens, i18n config and the Base layout

**Files:**
- Modify: `astro.config.mjs`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro`, `tests/e2e/smoke.spec.ts`
- Create: `src/components/ThemeScript.astro`, `src/lib/routes.ts`, `src/pages/pl/index.astro`, `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces: `Base` props `{ title: string; description: string; locale: Locale; path: string; switchPath?: string; ogImage?: string }` where `path` is the locale-less path without leading slash (`""`, `"lab"`, `"notes/foo"`) and `switchPath` overrides the language-switch target. `routes.ts`: `localeUrl(locale, path)`, `alternates(path): { locale, href }[]`, `canonical(locale, path)`.
- Consumes: Task 1 `Locale`, `t`.

- [ ] **Step 1: Write the failing e2e tests**

Create `tests/e2e/theme.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("theme without flash", () => {
  test("stored dark theme is applied before first paint", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/");
    // data-theme must already be set when the first script after <head> runs: check the
    // attribute is present in the server-rendered + inline-script state, not after hydration.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const scriptInHead = await page.locator("head > script").count();
    expect(scriptInHead).toBeGreaterThan(0);
  });

  test("without a stored theme the OS setting applies and data-theme is absent", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    const surface = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // dark surface is near-black: every channel below 60
    const [r, g, b] = surface.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
    expect(Math.max(r, g, b)).toBeLessThan(60);
  });

  test("blocked storage still renders (theme script is try/catch)", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("blocked");
        },
      });
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("locale metadata", () => {
  for (const [path, lang, other] of [
    ["/", "en", "/pl/"],
    ["/pl/", "pl", "/"],
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
      expect(other).toBeTruthy();
    });
  }
});
```

In `tests/e2e/smoke.spec.ts` replace the "home page ships no JavaScript" test with:

```ts
// Guards the "content pages ship no React runtime" decision. Inline scripts (theme, dock toggle)
// are allowed; external script requests and Astro islands are not.
test("home page ships no external JavaScript and no islands", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(scripts).toEqual([]);
  await expect(page.locator("astro-island")).toHaveCount(0);
  await expect(page.locator("script[src]")).toHaveCount(0);
});
```

- [ ] **Step 2: Run to see them fail**

Run: `bun run build && bunx playwright test tests/e2e/theme.spec.ts`
Expected: FAIL (no `data-theme`, no canonical, `/pl/` is 404).

- [ ] **Step 3: Configure i18n**

Replace `astro.config.mjs`:

```js
// @ts-check
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Static output (Astro's default): `astro build` writes plain HTML/CSS to ./dist and the
// Cloudflare Worker serves it as static assets (see wrangler.jsonc). No adapter is needed
// until a page has to render on request.
//
// `site` is the production origin: canonical links, hreflang alternates and the sitemap use it.
//
// i18n: English is the default and lives at `/`; Polish lives at `/pl/`. Pages exist in both
// locales as files (src/pages/*.astro and src/pages/pl/*.astro). `fallback` makes a Polish URL
// without a Polish page redirect to the English page instead of a 404 (route-level only).
export default defineConfig({
  site: "https://krzysztofjakubiak.com",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "pl"],
    routing: { prefixDefaultLocale: false },
    fallback: { pl: "en" },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Tokens and theme switching**

Replace `src/styles/global.css`:

```css
@import "tailwindcss";

/*
 * Theme tokens.
 *
 * Raw values live in plain custom properties (--surface, --ink, ...) that are redefined for dark
 * mode in two places: `[data-theme="dark"]` (explicit choice stored in localStorage and applied by
 * the inline head script) and `prefers-color-scheme: dark` when no explicit light choice exists.
 * Tailwind utilities (bg-surface, text-ink, ...) are generated from `@theme inline`, which keeps
 * the `var()` reference instead of inlining the value, so utilities follow the active theme.
 * Components therefore never need a `dark:` variant.
 */
@theme inline {
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-ready: var(--ready);
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: "Inter Tight Variable", var(--font-sans);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

:root {
  /* light: warm off-white paper, near-black blue ink, burnt-orange accent */
  --surface: oklch(96.2% 0.006 85);
  --surface-raised: oklch(99% 0.003 85);
  --ink: oklch(25% 0.025 270);
  --muted: oklch(48% 0.02 270);
  --line: oklch(90% 0.012 80);
  --accent: oklch(53% 0.19 40);
  --accent-soft: oklch(53% 0.19 40 / 0.1);
  --ready: oklch(50% 0.1 185);
  color-scheme: light;
}

/* Dark values are repeated on purpose: CSS has no way to share a block between a media query and
   an attribute selector. Change both together. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --surface: oklch(19% 0.01 270);
    --surface-raised: oklch(23% 0.012 270);
    --ink: oklch(95% 0.006 85);
    --muted: oklch(72% 0.008 270);
    --line: oklch(30% 0.015 270);
    --accent: oklch(72% 0.17 45);
    --accent-soft: oklch(100% 0 0 / 0.08);
    --ready: oklch(72% 0.1 185);
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
  --surface: oklch(19% 0.01 270);
  --surface-raised: oklch(23% 0.012 270);
  --ink: oklch(95% 0.006 85);
  --muted: oklch(72% 0.008 270);
  --line: oklch(30% 0.015 270);
  --accent: oklch(72% 0.17 45);
  --accent-soft: oklch(100% 0 0 / 0.08);
  --ready: oklch(72% 0.1 185);
  color-scheme: dark;
}

@layer base {
  html {
    scroll-behavior: smooth;
  }
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  body {
    background: var(--surface);
    color: var(--ink);
  }
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}
```

- [ ] **Step 5: Theme script component**

Create `src/components/ThemeScript.astro`:

```astro
---
// Runs before any CSS paints. Reads the explicit theme choice (set by the dock toggle) and
// applies it as `data-theme`. No choice = no attribute = OS setting via prefers-color-scheme.
// `try/catch`: localStorage can throw (blocked storage, private mode); the page must still render.
---

<script is:inline>
  (() => {
    try {
      const theme = localStorage.getItem("theme");
      if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
    } catch {}
  })();
</script>
```

- [ ] **Step 6: Route helpers**

Create `src/lib/routes.ts`:

```ts
import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from "astro:i18n";
import { defaultLocale, type Locale, locales } from "../i18n/locales";

/** `localeUrl("pl", "lab")` → `/pl/lab/`; `localeUrl("en", "")` → `/`. */
export function localeUrl(locale: Locale, path: string): string {
  return getRelativeLocaleUrl(locale, path);
}

export function canonical(locale: Locale, path: string): string {
  return getAbsoluteLocaleUrl(locale, path);
}

/** hreflang alternates for one locale-less path, plus x-default pointing at the default locale. */
export function alternates(path: string): { hreflang: string; href: string }[] {
  const list = locales.map((locale) => ({ hreflang: locale, href: getAbsoluteLocaleUrl(locale, path) }));
  list.push({ hreflang: "x-default", href: getAbsoluteLocaleUrl(defaultLocale, path) });
  return list;
}
```

- [ ] **Step 7: Base layout**

Replace `src/layouts/Base.astro` (the dock is added in Task 3; leave the `<slot name="dock" />` placeholder):

```astro
---
import "../styles/global.css";
import ThemeScript from "../components/ThemeScript.astro";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { alternates, canonical } from "../lib/routes";

interface Props {
  title: string;
  description: string;
  locale: Locale;
  /** Locale-less path without leading slash: "", "lab", "notes/foo". */
  path: string;
  /** Where the language switch goes when the same path has no page in the other locale. */
  switchPath?: string;
  ogImage?: string;
}

const { title, description, locale, path, switchPath = path, ogImage = `/og/${locale}.png` } = Astro.props;
const canonicalHref = canonical(locale, path);
const ogImageHref = new URL(ogImage, Astro.site).href;
---

<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <ThemeScript />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalHref} />
    {alternates(path).map((alt) => <link rel="alternate" hreflang={alt.hreflang} href={alt.href} />)}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalHref} />
    <meta property="og:image" content={ogImageHref} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content={locale === "pl" ? "pl_PL" : "en_US"} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="sitemap" href="/sitemap-index.xml" />
  </head>
  <body class="min-h-dvh bg-surface font-sans text-ink antialiased">
    <a
      href="#content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-surface-raised focus:px-4 focus:py-2"
      >{t(locale, "skip.toContent")}</a
    >
    <slot name="dock" />
    <main id="content" class="mx-auto w-full max-w-2xl px-4 pt-14 pb-28 md:pt-28 md:pb-16">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 8: Thin Home pages for both locales**

Replace `src/pages/index.astro`:

```astro
---
import Base from "../layouts/Base.astro";
import { t } from "../i18n/ui";

const locale = "en";
---

<Base title={t(locale, "site.title")} description={t(locale, "site.description")} locale={locale} path="">
  <p class="font-mono text-muted text-xs uppercase tracking-widest">{t(locale, "home.eyebrow")}</p>
  <h1 class="mt-3 font-display font-semibold text-4xl leading-tight tracking-tight sm:text-5xl">
    {t(locale, "home.headline.before")}<span class="text-accent">{t(locale, "home.headline.accent")}</span>{t(locale, "home.headline.after")}
  </h1>
  <p class="mt-4 text-lg text-muted leading-relaxed">{t(locale, "home.lead")}</p>
</Base>
```

Create `src/pages/pl/index.astro` with the same content and `const locale = "pl";` (Task 5 replaces both bodies with `HomeView`).

- [ ] **Step 9: Run build, check and e2e**

Run: `bun run check && bun run build && bunx playwright test tests/e2e/theme.spec.ts tests/e2e/smoke.spec.ts`
Expected: `astro check` 0 errors; build writes `dist/index.html` and `dist/pl/index.html`; all tests PASS. If the "OS setting applies" test fails on the colour check, inspect `getComputedStyle(document.body).backgroundColor` in the trace and adjust the threshold, not the tokens.

- [ ] **Step 10: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add astro.config.mjs src/styles/global.css src/layouts/Base.astro src/components/ThemeScript.astro src/lib/routes.ts src/pages tests/e2e
git commit -m "feat: i18n routing, theme tokens with data-theme and flash-free head script"
```

---

### Task 3: Dock with language switch and theme toggle

**Files:**
- Create: `src/components/Dock.astro`, `tests/e2e/dock.spec.ts`
- Modify: `src/layouts/Base.astro` (render `Dock` instead of the slot)

**Interfaces:**
- Consumes: `t`, `localeUrl`, `otherLocale`, Base props `locale`, `path`, `switchPath`.
- Produces: `<nav aria-label>` with links Home/Lab/Notes/About, `aria-current="page"` on the active section, link `#lang-switch`, button `#theme-toggle` with `aria-pressed`.

- [ ] **Step 1: Failing e2e**

Create `tests/e2e/dock.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

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
  await page.getByRole("link", { name: "Polski" }).click();
  await expect(page).toHaveURL("/pl/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/");
});

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

test("dock targets are at least 44px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  for (const name of ["Home", "Lab", "Notes", "About", "Polski"]) {
    const box = await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name }).boundingBox();
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44);
  }
  const toggleBox = await page.getByRole("button", { name: "Dark theme" }).boundingBox();
  expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(44);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `bunx playwright test tests/e2e/dock.spec.ts`
Expected: FAIL, navigation "Primary" not found.

- [ ] **Step 3: Dock component**

Create `src/components/Dock.astro`:

```astro
---
import { type Locale, otherLocale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { localeUrl } from "../lib/routes";

interface Props {
  locale: Locale;
  path: string;
  switchPath: string;
}

const { locale, path, switchPath } = Astro.props;
const section = path.split("/")[0] ?? "";
const other = otherLocale(locale);

const items = [
  { key: "nav.home", section: "", path: "", icon: "home" },
  { key: "nav.lab", section: "lab", path: "lab", icon: "lab" },
  { key: "nav.notes", section: "notes", path: "notes", icon: "notes" },
  { key: "nav.about", section: "about", path: "about", icon: "about" },
] as const;

const icons: Record<(typeof items)[number]["icon"], string> = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
  lab: '<path d="M9 3h6"/><path d="M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/>',
  notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h6M9 16h6"/>',
  about: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
const itemClass =
  "inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent";
---

<nav
  aria-label={t(locale, "nav.primary")}
  class="fixed inset-x-4 bottom-5 z-40 mx-auto flex h-14 max-w-sm items-center justify-between rounded-full border border-line bg-surface-raised/85 px-2 shadow-lg backdrop-blur md:top-5 md:bottom-auto"
>
  {
    items.map((item) => (
      <a
        href={localeUrl(locale, item.path)}
        aria-label={t(locale, item.key)}
        aria-current={section === item.section ? "page" : undefined}
        class={itemClass}
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          set:html={icons[item.icon]}
        />
      </a>
    ))
  }
  <span aria-hidden="true" class="h-6 w-px bg-line"></span>
  <a
    id="lang-switch"
    href={localeUrl(other, switchPath)}
    hreflang={other}
    lang={other}
    aria-label={t(locale, "nav.switchLocale")}
    class="inline-flex h-11 min-w-11 items-center justify-center rounded-full font-mono text-muted text-sm hover:text-ink"
    >{t(locale, "nav.switchLocaleShort")}</a
  >
  <button
    id="theme-toggle"
    type="button"
    aria-label={t(locale, "theme.toggle")}
    aria-pressed="false"
    class="inline-flex size-11 items-center justify-center rounded-full text-muted hover:text-ink aria-pressed:text-accent"
  >
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>
    </svg>
  </button>
</nav>

<script is:inline>
  // Theme toggle. The explicit choice is stored; without one the OS setting applies.
  // `aria-pressed` tells assistive tech whether dark mode is on. Storage errors are swallowed:
  // the toggle still works for this page view.
  (() => {
    const button = document.getElementById("theme-toggle");
    if (!button) return;
    const isDark = () =>
      document.documentElement.dataset.theme
        ? document.documentElement.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
    const reflect = () => button.setAttribute("aria-pressed", String(isDark()));
    reflect();
    button.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
      reflect();
    });
  })();
</script>
```

In `src/layouts/Base.astro` import `Dock` and replace `<slot name="dock" />` with `<Dock locale={locale} path={path} switchPath={switchPath} />`.

- [ ] **Step 4: Run tests**

Run: `bun run build && bunx playwright test tests/e2e/dock.spec.ts tests/e2e/smoke.spec.ts tests/e2e/theme.spec.ts`
Expected: all PASS. The 44 px test fails if Tailwind's `size-11` is not 44 px; it is (11 × 4 px).

- [ ] **Step 5: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add src/components/Dock.astro src/layouts/Base.astro tests/e2e/dock.spec.ts
git commit -m "feat: floating dock with language switch and theme toggle"
```

---

### Task 4: Content collections and seed content

**Files:**
- Create: `src/content/schemas.ts`, `src/content/schemas.test.ts`, `src/content/loaders.ts`, `src/content/loaders.test.ts`, `src/content.config.ts`, `src/lib/ids.ts`, `src/lib/ids.test.ts`, `src/lib/content.ts`, `src/content/work.yaml`, `src/content/lab/en/*.mdx` (14 files), `src/content/notes/en/workers-dev-switches-off.mdx`, `src/content/notes/pl/workers-dev-switches-off.mdx`
- Modify: `astro.config.mjs` (mdx integration), `package.json`

**Interfaces:**
- Produces: collections `lab`, `notes`, `work`; `splitId(id): { locale: Locale; slug: string }`; `labEntries(locale): Promise<CollectionEntry<"lab">[]>` (every slug once, Polish file preferred, English fallback, sorted by `order`); `noteEntries(locale)` (only that locale, newest first); `workItems(): Promise<CollectionEntry<"work">[]>`.
- Schema fields (lab): `title, question, order, status: "ready" | "building" | "planned", publishedOn?, updatedOn?, takeWrittenOn?, readingMinutes, sandbox: "none" | "island", sources[], related: reference("lab")[], notes: reference("notes")[]`.

- [ ] **Step 1: Add MDX (docs gate, then install)**

Open https://docs.astro.build/en/guides/integrations-guide/mdx/#installation, show the command, wait for confirmation, then:

```bash
bun add @astrojs/mdx
```

Expected: `"@astrojs/mdx": "^8.1.2"` in `dependencies`. Then in `astro.config.mjs` add `import mdx from "@astrojs/mdx";` and `integrations: [react(), mdx()]`.

- [ ] **Step 2: Failing schema tests**

Create `src/content/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { labBase, noteBase, refineLab, workSchema } from "./schemas";

const lab = labBase.superRefine(refineLab);

const ready = {
  title: "Client-side cache",
  question: "Why does one screen fetch the same data five times?",
  order: 1,
  status: "ready",
  publishedOn: "2026-11-20",
  takeWrittenOn: "2026-11-21",
  readingMinutes: 6,
  sources: [{ title: "TanStack Query docs", url: "https://tanstack.com/query/latest" }],
};

describe("lab schema", () => {
  it("accepts a complete ready entry", () => {
    expect(lab.safeParse(ready).success).toBe(true);
  });

  it("rejects a ready entry without takeWrittenOn", () => {
    const { takeWrittenOn: _, ...noTake } = ready;
    const result = lab.safeParse(noTake);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("takeWrittenOn");
  });

  it("rejects a ready entry without publishedOn or sources", () => {
    expect(lab.safeParse({ ...ready, publishedOn: undefined }).success).toBe(false);
    expect(lab.safeParse({ ...ready, sources: [] }).success).toBe(false);
  });

  it("accepts a building entry with only title, question, order, readingMinutes", () => {
    const result = lab.safeParse({
      title: "Event loop",
      question: "In what order?",
      order: 3,
      status: "building",
      readingMinutes: 5,
    });
    expect(result.success).toBe(true);
    expect(result.data?.sandbox).toBe("island");
    expect(result.data?.sources).toEqual([]);
  });

  it("rejects a non-positive order and a bad source url", () => {
    expect(lab.safeParse({ ...ready, order: 0 }).success).toBe(false);
    expect(lab.safeParse({ ...ready, sources: [{ title: "x", url: "not a url" }] }).success).toBe(false);
  });
});

describe("notes and work schemas", () => {
  it("note needs title, summary and publishedOn", () => {
    expect(noteBase.safeParse({ title: "A", summary: "B", publishedOn: "2026-10-31" }).success).toBe(true);
    expect(noteBase.safeParse({ title: "A", summary: "B" }).success).toBe(false);
  });

  it("work item has bilingual `what` and a known status", () => {
    const ok = {
      id: "forge",
      name: "Forge",
      what: { en: "Training journal", pl: "Dziennik treningowy" },
      status: "live",
    };
    expect(workSchema.safeParse(ok).success).toBe(true);
    expect(workSchema.safeParse({ ...ok, status: "beta" }).success).toBe(false);
    expect(workSchema.safeParse({ ...ok, what: { en: "only" } }).success).toBe(false);
  });
});
```

Create `src/lib/ids.test.ts`:

```ts
import { expect, it } from "vitest";
import { splitId } from "./ids";

it("splits a collection id into locale and slug", () => {
  expect(splitId("en/client-cache")).toEqual({ locale: "en", slug: "client-cache" });
  expect(splitId("pl/notes/deep/slug")).toEqual({ locale: "pl", slug: "notes/deep/slug" });
});

it("throws on an id without a known locale prefix", () => {
  expect(() => splitId("client-cache")).toThrow(/locale/);
  expect(() => splitId("de/x")).toThrow(/locale/);
});
```

Create `src/content/loaders.test.ts`:

```ts
import type { Loader, LoaderContext } from "astro/loaders";
import { describe, expect, it } from "vitest";
import { requirePolishForReady } from "./loaders";

function contextWith(entries: Record<string, { status: string }>): LoaderContext {
  const map = new Map(Object.entries(entries).map(([id, data]) => [id, { id, data }]));
  const store = {
    get: (key: string) => map.get(key),
    entries: () => [...map.entries()],
    has: (key: string) => map.has(key),
  };
  // Only the members `requirePolishForReady` touches are provided.
  return { collection: "lab", store } as unknown as LoaderContext;
}

const inner: Loader = { name: "fake", load: async () => {} };

describe("requirePolishForReady", () => {
  it("passes when every ready English entry has a Polish file", async () => {
    const ctx = contextWith({
      "en/cache": { status: "ready" },
      "pl/cache": { status: "ready" },
      "en/loop": { status: "building" },
    });
    await expect(requirePolishForReady(inner).load(ctx)).resolves.toBeUndefined();
  });

  it("fails naming the entry when a ready English entry has no Polish file", async () => {
    const ctx = contextWith({ "en/cache": { status: "ready" }, "en/loop": { status: "building" } });
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/en\/cache/);
  });

  it("runs the wrapped loader first", async () => {
    let called = false;
    const spy: Loader = {
      name: "spy",
      load: async () => {
        called = true;
      },
    };
    await requirePolishForReady(spy).load(contextWith({}));
    expect(called).toBe(true);
  });
});
```

- [ ] **Step 3: Run to see them fail**

Run: `bun run test:unit`
Expected: FAIL, modules `./schemas`, `./ids`, `./loaders` not found.

- [ ] **Step 4: Schemas, ids, loader wrapper**

Create `src/content/schemas.ts` (no `astro:content` import, so Vitest can load it; `reference()` is added in `content.config.ts`):

```ts
import { z } from "astro/zod";

export const labStatus = z.enum(["ready", "building", "planned"]);
export type LabStatus = z.infer<typeof labStatus>;

export const labBase = z.object({
  title: z.string().min(1),
  /** The one-sentence question the entry answers; shown on the index. */
  question: z.string().min(1),
  /** Position in the Lab index (1-based). */
  order: z.number().int().positive(),
  status: labStatus,
  publishedOn: z.coerce.date().optional(),
  updatedOn: z.coerce.date().optional(),
  /** When Krzysztof wrote "My take". Required for ready entries. */
  takeWrittenOn: z.coerce.date().optional(),
  readingMinutes: z.number().int().positive(),
  sandbox: z.enum(["none", "island"]).default("island"),
  sources: z.array(z.object({ title: z.string().min(1), url: z.string().url() })).default([]),
});

type LabInput = z.output<typeof labBase>;

/** Ready entries must be publishable: a date, Krzysztof's take, and at least one source. */
export function refineLab(value: LabInput, ctx: z.RefinementCtx): void {
  if (value.status !== "ready") return;
  if (!value.publishedOn)
    ctx.addIssue({ code: "custom", path: ["publishedOn"], message: "ready entries need publishedOn" });
  if (!value.takeWrittenOn) {
    ctx.addIssue({ code: "custom", path: ["takeWrittenOn"], message: "ready entries need takeWrittenOn (My take)" });
  }
  if (value.sources.length === 0) {
    ctx.addIssue({ code: "custom", path: ["sources"], message: "ready entries need at least one source" });
  }
}

export const noteBase = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedOn: z.coerce.date(),
  tags: z.array(z.string()).default([]),
});

export const workStatus = z.enum(["live", "repo", "in-progress"]);

export const workSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  what: z.object({ en: z.string().min(1), pl: z.string().min(1) }),
  status: workStatus,
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
});
```

Create `src/lib/ids.ts`:

```ts
import { isLocale, type Locale } from "../i18n/locales";

/** Collection ids are `<locale>/<slug>` because files live in `src/content/<collection>/<locale>/`. */
export function splitId(id: string): { locale: Locale; slug: string } {
  const slash = id.indexOf("/");
  const locale = slash === -1 ? "" : id.slice(0, slash);
  if (!isLocale(locale)) throw new Error(`Content id "${id}" must start with a locale (en/ or pl/)`);
  return { locale, slug: id.slice(slash + 1) };
}
```

Create `src/content/loaders.ts`:

```ts
import type { Loader } from "astro/loaders";

/**
 * Build-time rule from the spec: English is mandatory for every Lab entry, Polish only for
 * entries with `status: "ready"`. A per-entry zod schema cannot see sibling files, so the check
 * runs after the wrapped loader has filled the store. Throwing here fails `astro build`.
 */
export function requirePolishForReady(inner: Loader): Loader {
  return {
    name: `${inner.name}:pl-for-ready`,
    async load(context) {
      await inner.load(context);
      const missing: string[] = [];
      for (const [id, entry] of context.store.entries()) {
        if (!id.startsWith("en/")) continue;
        if ((entry.data as { status?: string }).status !== "ready") continue;
        if (!context.store.has(`pl/${id.slice("en/".length)}`)) missing.push(id);
      }
      if (missing.length > 0) {
        throw new Error(
          `Ready Lab entries need a Polish counterpart: ${missing.join(", ")}. ` +
            'Add src/content/lab/pl/<slug>.mdx or set status to "building".',
        );
      }
    },
  };
}
```

- [ ] **Step 5: Run the unit tests**

Run: `bun run test:unit`
Expected: all PASS (ui 4, schemas 7, ids 2, loaders 3).

- [ ] **Step 6: Collections config and helpers**

Create `src/content.config.ts`:

```ts
import { file, glob } from "astro/loaders";
import { defineCollection, reference, z } from "astro:content";
import { requirePolishForReady } from "./content/loaders";
import { labBase, noteBase, refineLab, workSchema } from "./content/schemas";

// Ids are `<locale>/<slug>` (see src/lib/ids.ts). `reference()` turns a wrong slug in `related`
// or `notes` into a build error instead of a dead link.
const lab = defineCollection({
  loader: requirePolishForReady(glob({ pattern: "**/*.mdx", base: "./src/content/lab" })),
  schema: labBase
    .extend({
      related: z.array(reference("lab")).default([]),
      notes: z.array(reference("notes")).default([]),
    })
    .superRefine(refineLab),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/notes" }),
  schema: noteBase.extend({ lab: z.array(reference("lab")).default([]) }),
});

const work = defineCollection({
  loader: file("./src/content/work.yaml"),
  schema: workSchema,
});

export const collections = { lab, notes, work };
```

Create `src/lib/content.ts`:

```ts
import { type CollectionEntry, getCollection } from "astro:content";
import type { Locale } from "../i18n/locales";
import { splitId } from "./ids";

export type LabEntry = CollectionEntry<"lab">;
export type NoteEntry = CollectionEntry<"notes">;
export type WorkItem = CollectionEntry<"work">;

/**
 * Every Lab slug once: the file in `locale` when it exists, otherwise the English one
 * (allowed only for non-ready entries, enforced by `requirePolishForReady`). Sorted by `order`.
 */
export async function labEntries(locale: Locale): Promise<LabEntry[]> {
  const all = await getCollection("lab");
  const bySlug = new Map<string, LabEntry>();
  for (const entry of all) {
    const { locale: entryLocale, slug } = splitId(entry.id);
    const current = bySlug.get(slug);
    if (entryLocale === locale || !current) bySlug.set(slug, entry);
  }
  return [...bySlug.values()].sort((a, b) => a.data.order - b.data.order);
}

export function labSlug(entry: LabEntry): string {
  return splitId(entry.id).slug;
}

export function entryLocale(entry: LabEntry | NoteEntry): Locale {
  return splitId(entry.id).locale;
}

/** Notes of one locale only, newest first. */
export async function noteEntries(locale: Locale): Promise<NoteEntry[]> {
  const all = await getCollection("notes", (entry) => splitId(entry.id).locale === locale);
  return all.sort((a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime());
}

export function noteSlug(entry: NoteEntry): string {
  return splitId(entry.id).slug;
}

export async function workItems(): Promise<WorkItem[]> {
  return getCollection("work");
}
```

- [ ] **Step 7: Seed content**

Create `src/content/work.yaml` (no links until the repos are public; `url`/`repo` are optional):

```yaml
- id: forge
  name: Forge
  what:
    en: Training journal for Hyrox athletes. Auth, Postgres, a handful of testers.
    pl: Dziennik treningowy dla zawodników Hyrox. Logowanie, Postgres, kilku testerów.
  status: live
- id: garmin-coach
  name: garmin-coach
  what:
    en: Running log and race plan on your own Garmin data. Runs on your machine.
    pl: Dziennik biegowy i plan startowy na własnych danych z Garmina. Działa lokalnie.
  status: repo
- id: newsletter-stories
  name: Newsletter Stories
  what:
    en: Turns a newsletter inbox into illustrated posts.
    pl: Zamienia skrzynkę z newsletterami w ilustrowane posty.
  status: in-progress
```

Create the 14 Lab entries in `src/content/lab/en/`. Each is frontmatter plus one paragraph; the body is the "What it is" draft that Plan 2 and later entries expand. Slugs, orders, titles and questions come from `docs/lab-topics.md` §4. Example, `src/content/lab/en/client-side-cache.mdx`:

```mdx
---
title: Client-side cache
question: Why does one screen fetch the same data five times, and what does staleTime actually change?
order: 1
status: building
readingMinutes: 6
---

Five taps on the same button: five requests, or one. The difference is a cache with a notion of
freshness. This entry opens with the raw `useEffect` + `fetch` version, then adds a cache with
`staleTime`, and lets you watch the request counter.
```

The other thirteen (`status: building`, `readingMinutes: 5`, one paragraph each restating the question in prose):

| file                             | title                                     | order | question                                                                                  |
| -------------------------------- | ----------------------------------------- | ----- | ----------------------------------------------------------------------------------------- |
| `re-renders-and-memoization.mdx` | Re-renders and memoization                | 2     | Which components re-render on a click, and does `useMemo` still matter with the Compiler? |
| `event-loop.mdx`                 | Event loop                                | 3     | In what order do `setTimeout(0)`, `Promise.then` and the next paint run?                  |
| `debounce-vs-throttle.mdx`       | Debounce vs throttle                      | 4     | Why does autocomplete fire 40 times when the user typed 8 letters?                        |
| `closures-and-stale-state.mdx`   | Closures and stale state in hooks         | 5     | Why does the counter inside `setInterval` always show 0?                                  |
| `async-concurrency-pool.mdx`     | Async concurrency pool                    | 6     | 200 uploads, the server survives 4 at a time: how, without a library?                     |
| `cancellation-and-races.mdx`     | Cancellation and race conditions          | 7     | You typed "re", then "react": why do you see results for "re"?                            |
| `long-tasks-and-inp.mdx`         | Long tasks and INP                        | 8     | Why does the click react after 400 ms although the code "works"?                          |
| `virtualized-lists.mdx`          | Virtualized lists and infinite scroll     | 9     | How do you render 100,000 rows without killing the tab?                                   |
| `event-emitter-and-leaks.mdx`    | Event emitter and leaks                   | 10    | Who is still listening when the component is gone?                                        |
| `optimistic-updates.mdx`         | Optimistic updates                        | 11    | How does a like appear instantly and roll back when the server says no?                   |
| `failure-isolation.mdx`          | Failure isolation: boundaries and backoff | 12    | Chat dies: why does video keep playing, and why don't you DDoS your own API?              |
| `reactivity-graph.mdx`           | Reactivity graph (signals)                | 13    | Why does a spreadsheet recompute 3 cells while React re-renders the component?            |
| `event-propagation.mdx`          | Event propagation and delegation          | 14    | One listener for 1,000 rows: how, and why?                                                |

Create the note (real content from this repo's history, commit 3625233 and learning-log T11), `src/content/notes/en/workers-dev-switches-off.mdx`:

```mdx
---
title: workers_dev switches off the moment you add a route
summary: Adding a custom domain to a Cloudflare Worker silently removes its workers.dev URL unless you keep it on by hand.
publishedOn: 2026-10-31
tags: [cloudflare, portfolio]
---

When this site got its domain, `wrangler.jsonc` gained a `routes` entry with `custom_domain: true`.
Wrangler reacts to that by defaulting `workers_dev` to `false`: the `portfolio.<account>.workers.dev`
address stops serving on the next deploy.

That default is reasonable for a product and wrong for a migration. The old address was the only
fallback while DNS and the certificate were still being confirmed. The fix is one explicit line,
`"workers_dev": true`, with a comment saying when to flip it back.

The lesson is about defaults that change when a neighbouring setting appears. Read the
configuration reference for the field you did not touch, not only for the one you added.
```

And `src/content/notes/pl/workers-dev-switches-off.mdx`:

```mdx
---
title: workers_dev wyłącza się w chwili, gdy dodasz route
summary: Dodanie własnej domeny do Workera Cloudflare po cichu usuwa jego adres workers.dev, jeśli nie zostawisz go włączonego ręcznie.
publishedOn: 2026-10-31
tags: [cloudflare, portfolio]
---

Gdy ta strona dostała domenę, w `wrangler.jsonc` pojawił się wpis `routes` z `custom_domain: true`.
Wrangler reaguje na to, ustawiając `workers_dev` domyślnie na `false`: adres
`portfolio.<konto>.workers.dev` przestaje działać przy następnym deployu.

Ten domyślny wybór jest rozsądny dla produktu i zły dla migracji. Stary adres był jedynym
zapasem, zanim DNS i certyfikat zostały potwierdzone. Poprawka to jedna jawna linia,
`"workers_dev": true`, z komentarzem, kiedy ją wyłączyć.

Lekcja dotyczy domyślnych wartości, które zmieniają się, gdy pojawia się sąsiednie ustawienie.
Czytaj dokumentację pola, którego nie dotykałeś, nie tylko tego, które dodałeś.
```

- [ ] **Step 8: Build and verify the reference and PL rules**

Run: `bun run check && bun run build`
Expected: build succeeds; `astro check` reports 0 errors (the generated `.astro/types.d.ts` now knows the collections).

Then, to prove the two build-time rules (manual, revert afterwards):

1. In `client-side-cache.mdx` set `status: ready`, `publishedOn: 2026-11-02`, `takeWrittenOn: 2026-11-02`, `sources: [{ title: MDN, url: https://developer.mozilla.org }]`. Run `bun run build`. Expected: FAIL with `Ready Lab entries need a Polish counterpart: en/client-side-cache`.
2. Revert step 1. Add `related: [en/does-not-exist]` to the same file. Run `bun run build`. Expected: FAIL, Astro reports an invalid reference for collection `lab`.
3. Revert. `bun run build` passes again. `git diff --stat src/content` shows only the new files.

- [ ] **Step 9: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add astro.config.mjs package.json bun.lock src/content.config.ts src/content src/lib
git commit -m "feat: content collections for lab, notes and work with build-time rules"
```

---

### Task 5: Home view

**Files:**
- Create: `src/views/HomeView.astro`, `src/components/Eyebrow.astro`, `src/components/SectionHeading.astro`, `src/components/ListRow.astro`, `tests/e2e/home.spec.ts`
- Modify: `src/pages/index.astro`, `src/pages/pl/index.astro`

**Interfaces:**
- Consumes: `labEntries`, `noteEntries`, `workItems`, `labSlug`, `noteSlug`, `localeUrl`, `t`.
- Produces: `HomeView` with prop `locale`; `Eyebrow` (slot), `SectionHeading` props `{ label: string; moreHref?: string; moreLabel?: string }`, `ListRow` props `{ href?: string; title: string; meta?: string; aside?: string; asideTone?: "ready" | "accent" | "muted" }`.

- [ ] **Step 1: Failing e2e**

Create `tests/e2e/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

for (const [path, labHref, texts] of [
  ["/", "/lab/", { work: "Work", lab: "Lab", notes: "Notes", cta: "See the Lab" }],
  ["/pl/", "/pl/lab/", { work: "Projekty", lab: "Lab", notes: "Notatki", cta: "Zobacz Lab" }],
] as const) {
  test(`${path} shows hero, now, work list, lab teaser and notes teaser`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("link", { name: texts.cta })).toHaveAttribute("href", labHref);

    const work = page.getByRole("region", { name: texts.work });
    await expect(work.getByRole("listitem")).toHaveCount(3);
    await expect(work.getByText("Forge")).toBeVisible();

    const lab = page.getByRole("region", { name: texts.lab });
    await expect(lab.getByRole("listitem")).toHaveCount(3);
    await expect(lab.getByText("01")).toBeVisible();

    const notes = page.getByRole("region", { name: texts.notes });
    await expect(notes.getByRole("listitem")).toHaveCount(1);
  });
}

test("home ships only inline scripts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("script[src]")).toHaveCount(0);
  await expect(page.locator("astro-island")).toHaveCount(0);
  const inlineBytes = await page
    .locator("script")
    .evaluateAll((nodes) => nodes.reduce((sum, node) => sum + (node.textContent?.length ?? 0), 0));
  expect(inlineBytes).toBeLessThan(2000);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `bunx playwright test tests/e2e/home.spec.ts`
Expected: FAIL, region "Work" not found.

- [ ] **Step 3: Presentational pieces**

Create `src/components/Eyebrow.astro`:

```astro
---
interface Props {
  as?: "p" | "span";
  class?: string;
}
const { as: Tag = "p", class: className = "" } = Astro.props;
---

<Tag class:list={["font-mono text-muted text-xs uppercase tracking-[0.08em]", className]}><slot /></Tag>
```

Create `src/components/SectionHeading.astro`:

```astro
---
import Eyebrow from "./Eyebrow.astro";

interface Props {
  id: string;
  label: string;
  moreHref?: string;
  moreLabel?: string;
}
const { id, label, moreHref, moreLabel } = Astro.props;
---

<div class="mb-2 flex items-baseline justify-between">
  <h2 id={id} class="m-0 font-normal text-base"><Eyebrow as="span">{label}</Eyebrow></h2>
  {moreHref && moreLabel && <a href={moreHref} class="text-accent text-sm hover:underline">{moreLabel}</a>}
</div>
```

Create `src/components/ListRow.astro`:

```astro
---
interface Props {
  href?: string;
  title: string;
  meta?: string;
  aside?: string;
  asideTone?: "ready" | "accent" | "muted";
}
const { href, title, meta, aside, asideTone = "muted" } = Astro.props;
const Tag = href ? "a" : "div";
const tone = { ready: "text-ready", accent: "text-accent", muted: "text-muted" }[asideTone];
---

<li class="border-line border-t">
  <Tag href={href} class:list={["flex items-baseline justify-between gap-3 py-3.5", href && "hover:text-accent"]}>
    <span class="flex min-w-0 flex-col gap-0.5">
      <span class="font-medium">{title}</span>
      {meta && <span class="text-muted text-sm">{meta}</span>}
    </span>
    {aside && <span class:list={["shrink-0 font-mono text-xs", tone]}>{aside}</span>}
  </Tag>
</li>
```

- [ ] **Step 4: Home view**

Create `src/views/HomeView.astro`:

```astro
---
import Eyebrow from "../components/Eyebrow.astro";
import ListRow from "../components/ListRow.astro";
import SectionHeading from "../components/SectionHeading.astro";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { labEntries, labSlug, noteEntries, noteSlug, workItems } from "../lib/content";
import { localeUrl } from "../lib/routes";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;

const work = await workItems();
const lab = (await labEntries(locale)).slice(0, 3);
const notes = (await noteEntries(locale)).slice(0, 3);
const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
const statusTone = { live: "ready", repo: "muted", "in-progress": "accent" } as const;
---

<header class="flex flex-col gap-4">
  <Eyebrow>{t(locale, "home.eyebrow")}</Eyebrow>
  <h1 class="font-display font-semibold text-4xl leading-[1.15] tracking-tight sm:text-5xl">
    {t(locale, "home.headline.before")}<span class="text-accent">{t(locale, "home.headline.accent")}</span>{t(locale, "home.headline.after")}
  </h1>
  <p class="text-lg text-muted leading-relaxed">{t(locale, "home.lead")}</p>
  <div class="flex flex-wrap gap-2.5 pt-1">
    <a href={localeUrl(locale, "lab")} class="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-surface-raised">
      {t(locale, "home.cta.lab")}
    </a>
    <a href="#work" class="inline-flex min-h-11 items-center rounded-full border border-line px-5 font-medium">{t(locale, "home.cta.work")}</a>
  </div>
</header>

<section aria-labelledby="now" class="mt-10 flex flex-col gap-2 border-line border-y py-4">
  <h2 id="now" class="m-0 font-normal text-base"><Eyebrow as="span">{t(locale, "home.now.label")}</Eyebrow></h2>
  <p>{t(locale, "home.now.text")}</p>
</section>

<section id="work" aria-labelledby="work-heading" class="mt-10">
  <SectionHeading id="work-heading" label={t(locale, "home.work.label")} />
  <ul class="m-0 list-none p-0">
    {
      work.map((item) => (
        <ListRow
          href={item.data.url}
          title={item.data.name}
          meta={item.data.what[locale]}
          aside={t(locale, `work.status.${item.data.status}`)}
          asideTone={statusTone[item.data.status]}
        />
      ))
    }
  </ul>
</section>

<section aria-labelledby="lab-heading" class="mt-10">
  <SectionHeading id="lab-heading" label={t(locale, "home.lab.label")} moreHref={localeUrl(locale, "lab")} moreLabel={t(locale, "home.lab.all")} />
  <ul class="m-0 list-none p-0">
    {
      lab.map((entry) => (
        <ListRow
          href={entry.data.status === "ready" ? localeUrl(locale, `lab/${labSlug(entry)}`) : undefined}
          title={`${String(entry.data.order).padStart(2, "0")}  ${entry.data.title}`}
          meta={entry.data.status === "ready" ? entry.data.question : t(locale, "lab.status.building")}
          aside={entry.data.status === "ready" ? t(locale, "lab.status.ready") : undefined}
          asideTone="ready"
        />
      ))
    }
  </ul>
</section>

<section aria-labelledby="notes-heading" class="mt-10">
  <SectionHeading id="notes-heading" label={t(locale, "home.notes.label")} moreHref={localeUrl(locale, "notes")} moreLabel={t(locale, "home.notes.all")} />
  <ul class="m-0 list-none p-0">
    {
      notes.map((note) => (
        <ListRow href={localeUrl(locale, `notes/${noteSlug(note)}`)} title={note.data.title} meta={dateFormat.format(note.data.publishedOn)} />
      ))
    }
  </ul>
</section>
```

Note on the Lab teaser title: the test looks for the text "01"; `padStart` produces it. Two spaces separate number and title; Task 6 renders the number in its own span on the index.

Replace `src/pages/index.astro`:

```astro
---
import Base from "../layouts/Base.astro";
import { t } from "../i18n/ui";
import HomeView from "../views/HomeView.astro";

const locale = "en";
---

<Base title={t(locale, "site.title")} description={t(locale, "site.description")} locale={locale} path="">
  <HomeView locale={locale} />
</Base>
```

`src/pages/pl/index.astro` is identical with `const locale = "pl";` and `../../` import paths.

- [ ] **Step 5: Run the tests**

Run: `bun run build && bunx playwright test tests/e2e/home.spec.ts tests/e2e/smoke.spec.ts`
Expected: PASS. If `getByRole("region")` finds nothing, confirm each `<section>` has `aria-labelledby` pointing at an existing `h2` id (a section without an accessible name has no `region` role).

- [ ] **Step 6: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add src/views/HomeView.astro src/components src/pages/index.astro src/pages/pl/index.astro tests/e2e/home.spec.ts
git commit -m "feat: home page with now, work, lab and notes lists in both locales"
```

---

### Task 6: Lab index

**Files:**
- Create: `src/views/LabIndexView.astro`, `src/pages/lab/index.astro`, `src/pages/pl/lab/index.astro`, `tests/e2e/lab-index.spec.ts`

**Interfaces:**
- Consumes: `labEntries`, `labSlug`, `entryLocale`, `t`, `localeUrl`.
- Produces: `LabIndexView` prop `locale`; each row `<li data-slug="…">` so the revisit script and Plan 2's "Remind me in 7 days" control share the contract: `localStorage["lab-revisit"]` is a JSON object `{ [slug]: "YYYY-MM-DD" }` (the date the reminder is due).

- [ ] **Step 1: Failing e2e**

Create `tests/e2e/lab-index.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

for (const [path, building] of [
  ["/lab/", "under construction"],
  ["/pl/lab/", "w budowie"],
] as const) {
  test(`${path} lists all 14 entries in order with status`, async ({ page }) => {
    await page.goto(path);
    const items = page.getByRole("list", { name: /lab/i }).getByRole("listitem");
    await expect(items).toHaveCount(14);
    await expect(items.first()).toContainText("01");
    await expect(items.first()).toContainText("Client-side cache");
    await expect(items.last()).toContainText("14");
    await expect(items.first().getByText(building)).toBeVisible();
    // building entries are not links
    await expect(items.first().getByRole("link")).toHaveCount(0);
  });
}

test("/pl/lab/ marks English-only entries", async ({ page }) => {
  await page.goto("/pl/lab/");
  await expect(page.getByText("Na razie tylko po angielsku").first()).toBeVisible();
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
  await expect(page.locator('[data-slug="debounce-vs-throttle"]').getByText("due for review")).toHaveCount(0);
});

test("revisit script survives corrupt storage", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("lab-revisit", "{not json"));
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/lab/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `bunx playwright test tests/e2e/lab-index.spec.ts`
Expected: FAIL (404 on `/lab/`).

- [ ] **Step 3: Lab index view**

Create `src/views/LabIndexView.astro`:

```astro
---
import Eyebrow from "../components/Eyebrow.astro";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { entryLocale, labEntries, labSlug } from "../lib/content";
import { localeUrl } from "../lib/routes";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;

const entries = await labEntries(locale);
const ready = entries.filter((e) => e.data.status === "ready").length;
const building = entries.length - ready;
---

<header class="flex flex-col gap-3">
  <Eyebrow>{t(locale, "lab.eyebrow")}</Eyebrow>
  <h1 id="lab-title" class="font-display font-semibold text-3xl leading-[1.15] tracking-tight">{t(locale, "lab.title")}</h1>
  <p class="text-muted">{t(locale, "lab.intro")}</p>
</header>

<p class="mt-6 flex flex-wrap gap-2 font-mono text-xs">
  <span class="inline-flex h-8 items-center rounded-full bg-accent-soft px-3 text-accent">{t(locale, "lab.count.all")} · {entries.length}</span>
  <span class="inline-flex h-8 items-center rounded-full border border-line px-3 text-muted">{t(locale, "lab.count.ready")} · {ready}</span>
  <span class="inline-flex h-8 items-center rounded-full border border-line px-3 text-muted">{t(locale, "lab.count.building")} · {building}</span>
</p>

<ul aria-labelledby="lab-title" class="m-0 mt-6 list-none p-0">
  {
    entries.map((entry) => {
      const slug = labSlug(entry);
      const isReady = entry.data.status === "ready";
      const englishOnly = entryLocale(entry) !== locale;
      const number = String(entry.data.order).padStart(2, "0");
      const inner = (
        <>
          <span class="flex items-baseline justify-between gap-3 font-mono text-xs">
            <span class:list={[isReady ? "text-accent" : "text-muted"]}>{number}</span>
            <span class="flex gap-3">
              <span data-revisit hidden class="text-accent">{t(locale, "lab.revisit.due")}</span>
              <span class:list={[isReady ? "text-ready" : "text-muted"]}>{t(locale, `lab.status.${entry.data.status}`)}</span>
            </span>
          </span>
          <span class:list={["font-display font-semibold text-lg leading-tight", !isReady && "text-muted"]} lang={englishOnly ? "en" : undefined}>
            {entry.data.title}
          </span>
          <span class="text-muted text-sm" lang={englishOnly ? "en" : undefined}>{entry.data.question}</span>
          {englishOnly && <span class="font-mono text-muted text-xs">{t(locale, "lab.englishOnly")}</span>}
        </>
      );
      return (
        <li data-slug={slug} class="border-line border-t">
          {isReady ? (
            <a href={localeUrl(locale, `lab/${slug}`)} class="flex flex-col gap-1.5 py-4 hover:text-accent">
              {inner}
            </a>
          ) : (
            <div class="flex flex-col gap-1 py-3.5">{inner}</div>
          )}
        </li>
      );
    })
  }
</ul>

<p class="mt-8 text-muted text-sm">{t(locale, "lab.footer")}</p>

<script is:inline>
  // "Remind me in 7 days" (Plan 2) stores { slug: "YYYY-MM-DD" } under `lab-revisit`.
  // Here we only reveal the badge on rows whose date has passed. Any storage or JSON problem
  // means no badges, never an error.
  (() => {
    try {
      const raw = localStorage.getItem("lab-revisit");
      if (!raw) return;
      const due = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10);
      for (const [slug, date] of Object.entries(due)) {
        if (typeof date !== "string" || date > today) continue;
        const badge = document.querySelector(`[data-slug="${slug}"] [data-revisit]`);
        if (badge) badge.hidden = false;
      }
    } catch {}
  })();
</script>
```

Create `src/pages/lab/index.astro`:

```astro
---
import Base from "../../layouts/Base.astro";
import { t } from "../../i18n/ui";
import LabIndexView from "../../views/LabIndexView.astro";

const locale = "en";
---

<Base title={`${t(locale, "nav.lab")} — ${t(locale, "site.name")}`} description={t(locale, "lab.intro")} locale={locale} path="lab">
  <LabIndexView locale={locale} />
</Base>
```

Create `src/pages/pl/lab/index.astro` with `const locale = "pl";` and `../../../` import paths.

- [ ] **Step 4: Run the tests**

Run: `bun run build && bunx playwright test tests/e2e/lab-index.spec.ts`
Expected: PASS. In the PL run every row shows "Na razie tylko po angielsku" because no Polish Lab file exists yet; that is the designed state.

- [ ] **Step 5: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add src/views/LabIndexView.astro src/pages/lab src/pages/pl/lab tests/e2e/lab-index.spec.ts
git commit -m "feat: lab index with status, English fallback and revisit badges"
```

---

### Task 7: Notes index and note page

**Files:**
- Create: `src/views/NotesIndexView.astro`, `src/views/NoteView.astro`, `src/pages/notes/index.astro`, `src/pages/notes/[slug].astro`, `src/pages/pl/notes/index.astro`, `src/pages/pl/notes/[slug].astro`, `tests/e2e/notes.spec.ts`

**Interfaces:**
- Consumes: `noteEntries`, `noteSlug`, `render` from `astro:content`, `Base` with `switchPath`.
- Produces: note pages at `/notes/<slug>/` and `/pl/notes/<slug>/`; the language switch on a note targets the other locale's note when it exists, else the other locale's notes index.

- [ ] **Step 1: Failing e2e**

Create `tests/e2e/notes.spec.ts`:

```ts
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

test("unknown note returns 404", async ({ page }) => {
  const response = await page.goto("/notes/does-not-exist/");
  expect(response?.status()).toBe(404);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `bunx playwright test tests/e2e/notes.spec.ts`
Expected: FAIL (404 on `/notes/`).

- [ ] **Step 3: Views**

Create `src/views/NotesIndexView.astro`:

```astro
---
import Eyebrow from "../components/Eyebrow.astro";
import ListRow from "../components/ListRow.astro";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import { noteEntries, noteSlug } from "../lib/content";
import { localeUrl } from "../lib/routes";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const notes = await noteEntries(locale);
const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
---

<header class="flex flex-col gap-3">
  <Eyebrow>{t(locale, "notes.eyebrow")}</Eyebrow>
  <h1 id="notes-title" class="font-display font-semibold text-3xl leading-[1.15] tracking-tight">{t(locale, "notes.title")}</h1>
</header>

{
  notes.length === 0 ? (
    <p class="mt-8 text-muted">{t(locale, "notes.empty")}</p>
  ) : (
    <ul aria-labelledby="notes-title" class="m-0 mt-8 list-none p-0">
      {notes.map((note) => (
        <ListRow href={localeUrl(locale, `notes/${noteSlug(note)}`)} title={note.data.title} meta={note.data.summary} aside={dateFormat.format(note.data.publishedOn)} />
      ))}
    </ul>
  )
}
```

Create `src/views/NoteView.astro`:

```astro
---
import { render } from "astro:content";
import Eyebrow from "../components/Eyebrow.astro";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";
import type { NoteEntry } from "../lib/content";
import { localeUrl } from "../lib/routes";

interface Props {
  locale: Locale;
  note: NoteEntry;
}
const { locale, note } = Astro.props;
const { Content } = await render(note);
const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
---

<article class="flex flex-col gap-6">
  <header class="flex flex-col gap-3">
    <Eyebrow>{t(locale, "notes.eyebrow")} · {dateFormat.format(note.data.publishedOn)}</Eyebrow>
    <h1 class="font-display font-semibold text-3xl leading-[1.15] tracking-tight">{note.data.title}</h1>
    <p class="text-lg text-muted">{note.data.summary}</p>
  </header>
  <div class="prose-note flex flex-col gap-4 leading-relaxed [&_code]:rounded [&_code]:bg-accent-soft [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em]">
    <Content />
  </div>
  <p><a href={localeUrl(locale, "notes")} class="text-accent hover:underline">← {t(locale, "notes.backToIndex")}</a></p>
</article>
```

- [ ] **Step 4: Routes**

Create `src/pages/notes/index.astro`:

```astro
---
import Base from "../../layouts/Base.astro";
import { t } from "../../i18n/ui";
import NotesIndexView from "../../views/NotesIndexView.astro";

const locale = "en";
---

<Base title={`${t(locale, "nav.notes")} — ${t(locale, "site.name")}`} description={t(locale, "notes.title")} locale={locale} path="notes">
  <NotesIndexView locale={locale} />
</Base>
```

Create `src/pages/notes/[slug].astro`:

```astro
---
import { getCollection } from "astro:content";
import Base from "../../layouts/Base.astro";
import { otherLocale } from "../../i18n/locales";
import { noteEntries, noteSlug } from "../../lib/content";
import NoteView from "../../views/NoteView.astro";

export async function getStaticPaths() {
  const notes = await noteEntries("en");
  return notes.map((note) => ({ params: { slug: noteSlug(note) }, props: { note } }));
}

const locale = "en";
const { note } = Astro.props;
const slug = noteSlug(note);
// Language switch: the translated note when it exists, else the other locale's index.
const translated = (await getCollection("notes")).some((n) => n.id === `${otherLocale(locale)}/${slug}`);
const switchPath = translated ? `notes/${slug}` : "notes";
---

<Base title={`${note.data.title} — Krzysztof Jakubiak`} description={note.data.summary} locale={locale} path={`notes/${slug}`} switchPath={switchPath}>
  <NoteView locale={locale} note={note} />
</Base>
```

Create `src/pages/pl/notes/index.astro` and `src/pages/pl/notes/[slug].astro` as copies with `const locale = "pl";`, `noteEntries("pl")` in `getStaticPaths`, and `../../../` import paths.

- [ ] **Step 5: Run the tests**

Run: `bun run check && bun run build && bunx playwright test tests/e2e/notes.spec.ts tests/e2e/home.spec.ts`
Expected: PASS. `astro check` may flag `Astro.props` typing in `[slug].astro`; if so, add `type Props = { note: NoteEntry }` with `import type { NoteEntry } from "../../lib/content";` above the frontmatter code.

- [ ] **Step 6: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add src/views/NotesIndexView.astro src/views/NoteView.astro src/pages/notes src/pages/pl/notes tests/e2e/notes.spec.ts
git commit -m "feat: notes index and note pages in both locales"
```

---

### Task 8: About page and bilingual 404

**Files:**
- Create: `src/views/AboutView.astro`, `src/pages/about.astro`, `src/pages/pl/about.astro`, `tests/e2e/about-404.spec.ts`
- Modify: `src/pages/404.astro`, `tests/e2e/smoke.spec.ts` (404 test text)

**Interfaces:**
- Consumes: `Base`, `t`, `localeUrl`.

- [ ] **Step 1: Failing e2e**

Create `tests/e2e/about-404.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("/about/ and /pl/about/ render with contact links", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Frontend engineer");
  await expect(page.getByRole("link", { name: /github/i })).toHaveAttribute("href", "https://github.com/kj-ninja");
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
  await expect(page.locator("html")).toHaveAttribute("data-theme", /.*|/); // theme script present: no throw
});
```

In `tests/e2e/smoke.spec.ts` the existing 404 test keeps passing (same heading and link text); leave it.

- [ ] **Step 2: Run to see it fail**

Run: `bunx playwright test tests/e2e/about-404.spec.ts`
Expected: FAIL (404 on `/about/`; Polish link missing on the 404 page).

- [ ] **Step 3: About view and pages**

Create `src/views/AboutView.astro`. Only the GitHub profile is verified public (2026-11-02). Before this task runs, Krzysztof adds his public email (`mailto:`) and LinkedIn URL to the `contacts` array, or the page ships with GitHub only:

```astro
---
import Eyebrow from "../components/Eyebrow.astro";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;

const contacts = [{ label: "GitHub", href: "https://github.com/kj-ninja" }];
---

<header class="flex flex-col gap-3">
  <Eyebrow>{t(locale, "about.eyebrow")}</Eyebrow>
  <h1 class="font-display font-semibold text-3xl leading-[1.15] tracking-tight">{t(locale, "about.title")}</h1>
  <p class="text-lg text-muted leading-relaxed">{t(locale, "about.text")}</p>
</header>

<section aria-labelledby="contact" class="mt-10 border-line border-t pt-4">
  <h2 id="contact" class="m-0 font-normal text-base"><Eyebrow as="span">{t(locale, "about.contact.label")}</Eyebrow></h2>
  <ul class="m-0 mt-3 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
    {contacts.map((c) => <li><a href={c.href} class="inline-flex min-h-11 items-center text-accent hover:underline">{c.label}</a></li>)}
  </ul>
</section>

<section aria-labelledby="colophon" class="mt-10 border-line border-t pt-4">
  <h2 id="colophon" class="m-0 font-normal text-base"><Eyebrow as="span">{t(locale, "about.colophon.label")}</Eyebrow></h2>
  <p class="mt-3 text-muted">
    {t(locale, "about.colophon.text")}
    <a href="https://github.com/kj-ninja/kj-portfolio" class="text-accent hover:underline">kj-ninja/kj-portfolio</a>
  </p>
</section>
```

Create `src/pages/about.astro`:

```astro
---
import Base from "../layouts/Base.astro";
import { t } from "../i18n/ui";
import AboutView from "../views/AboutView.astro";

const locale = "en";
---

<Base title={`${t(locale, "nav.about")} — ${t(locale, "site.name")}`} description={t(locale, "about.text")} locale={locale} path="about">
  <AboutView locale={locale} />
</Base>
```

`src/pages/pl/about.astro`: same with `const locale = "pl";` and `../../` imports.

- [ ] **Step 4: Bilingual 404**

Replace `src/pages/404.astro`:

```astro
---
import Base from "../layouts/Base.astro";
import { t } from "../i18n/ui";
import { localeUrl } from "../lib/routes";

// Served for every unknown path in both locales (Workers `not_found_handling: "404-page"`),
// so it speaks both languages. The document language stays English (the default locale).
const locale = "en";
---

<Base title={`${t("en", "notFound.title")} — ${t("en", "site.name")}`} description={t("en", "notFound.text")} locale={locale} path="404" switchPath="">
  <p class="font-mono text-muted text-xs uppercase tracking-[0.08em]">{t("en", "notFound.eyebrow")}</p>
  <h1 class="mt-3 font-display font-semibold text-4xl tracking-tight">{t("en", "notFound.title")}</h1>
  <p class="mt-4 text-lg text-muted">
    {t("en", "notFound.text")}
    <a class="text-accent underline underline-offset-4" href={localeUrl("en", "")}>{t("en", "notFound.home")}</a>.
  </p>
  <p lang="pl" class="mt-6 text-lg text-muted">
    <span class="font-display font-semibold text-ink">{t("pl", "notFound.title")}.</span>
    {t("pl", "notFound.text")}
    <a class="text-accent underline underline-offset-4" href={localeUrl("pl", "")}>{t("pl", "notFound.home")}</a>.
  </p>
</Base>
```

The 404 page's canonical and hreflang would point at `/404/`, which is not a real URL, so it must not be indexed. Extend `Base`:

```astro
// in the Props interface
noindex?: boolean;
// in the destructuring
const { ..., noindex = false } = Astro.props;
```

and in `<head>`, right after the description meta:

```astro
{noindex && <meta name="robots" content="noindex" />}
```

Then pass `noindex` on the `<Base …>` tag in `404.astro`.

- [ ] **Step 5: Run the tests**

Run: `bun run build && bunx playwright test tests/e2e/about-404.spec.ts tests/e2e/smoke.spec.ts`
Expected: PASS.

- [ ] **Step 6: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add src/views/AboutView.astro src/pages/about.astro src/pages/pl/about.astro src/pages/404.astro src/layouts/Base.astro tests/e2e/about-404.spec.ts
git commit -m "feat: about page and bilingual 404"
```

---

### Task 9: Display font (Inter Tight, self-hosted)

**Files:**
- Modify: `src/layouts/Base.astro` (import), `package.json`
- Create: `tests/e2e/fonts.spec.ts`

- [ ] **Step 1: Docs gate, then install**

Open https://fontsource.org/fonts/inter-tight/install, show the command, wait for confirmation, then:

```bash
bun add @fontsource-variable/inter-tight
```

Expected: `"@fontsource-variable/inter-tight": "^5.3.0"`. The package's `index.css` declares seven `@font-face` subsets with `unicode-range` (verified in the package 2026-11-02); browsers download only latin and latin-ext for our pages (one ≈ 50–60 KB woff2 each when a Polish glyph is on the page).

- [ ] **Step 2: Failing e2e**

Create `tests/e2e/fonts.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("headings use the self-hosted display font and nothing is fetched from third parties", async ({ page }) => {
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (url.hostname !== "127.0.0.1") thirdParty.push(r.url());
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
});
```

- [ ] **Step 3: Run to see it fail**

Run: `bunx playwright test tests/e2e/fonts.spec.ts`
Expected: FAIL, `loaded` does not contain the family.

- [ ] **Step 4: Import the font**

In `src/layouts/Base.astro` frontmatter add, before `import "../styles/global.css";`:

```ts
import "@fontsource-variable/inter-tight";
```

`--font-display` in `global.css` already names `"Inter Tight Variable"`. Fontsource ships `font-display: swap`.

- [ ] **Step 5: Run build and tests**

Run: `bun run build && bunx playwright test tests/e2e/fonts.spec.ts tests/e2e/smoke.spec.ts`
Expected: PASS. Check `dist/_astro/` contains `inter-tight-latin-*.woff2` and `inter-tight-latin-ext-*.woff2`.

- [ ] **Step 6: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add package.json bun.lock src/layouts/Base.astro tests/e2e/fonts.spec.ts
git commit -m "feat: self-hosted Inter Tight for headings"
```

---

### Task 10: Sitemap, robots and Open Graph images

**Files:**
- Create: `public/robots.txt`, `scripts/og/template.html`, `scripts/og/render.ts`, `public/og/en.png`, `public/og/pl.png`, `tests/e2e/seo.spec.ts`
- Modify: `astro.config.mjs`, `package.json`

- [ ] **Step 1: Docs gate, then install sitemap**

Open https://docs.astro.build/en/guides/integrations-guide/sitemap/, show the command, wait for confirmation, then:

```bash
bun add @astrojs/sitemap
```

In `astro.config.mjs` add `import sitemap from "@astrojs/sitemap";` and extend integrations:

```js
  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", pl: "pl" },
      },
      filter: (page) => !page.endsWith("/404/"),
    }),
  ],
```

- [ ] **Step 2: Failing e2e**

Create `tests/e2e/seo.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("robots.txt allows crawling and names the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Sitemap: https://krzysztofjakubiak.com/sitemap-index.xml");
});

test("sitemap lists both locales with alternates", async ({ request }) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.status()).toBe(200);
  const sitemap = await request.get("/sitemap-0.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("https://krzysztofjakubiak.com/pl/lab/");
  expect(xml).toContain('hreflang="pl"');
  expect(xml).not.toContain("/404/");
});

for (const locale of ["en", "pl"]) {
  test(`og image for ${locale} exists and is a PNG`, async ({ request }) => {
    const res = await request.get(`/og/${locale}.png`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const bytes = await res.body();
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  });
}
```

- [ ] **Step 3: Run to see it fail**

Run: `bunx playwright test tests/e2e/seo.spec.ts`
Expected: FAIL (no robots.txt, no og images).

- [ ] **Step 4: robots.txt**

Create `public/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://krzysztofjakubiak.com/sitemap-index.xml
```

- [ ] **Step 5: OG template and renderer**

Create `scripts/og/template.html` (static HTML, same tokens as the site, text chosen by `?locale=`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; }
      body {
        width: 1200px; height: 630px; box-sizing: border-box; padding: 72px;
        background: #f6f3ee; color: #1f2430;
        font-family: "Inter Tight Variable", "Inter Tight", ui-sans-serif, system-ui, sans-serif;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .eyebrow { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 24px; letter-spacing: 0.08em; text-transform: uppercase; color: #5f6472; }
      h1 { margin: 0; font-size: 72px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 600; max-width: 1000px; }
      h1 span { color: #c2410c; }
      .url { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 28px; color: #5f6472; }
    </style>
  </head>
  <body>
    <p class="eyebrow" data-en="Krzysztof Jakubiak · Frontend engineer" data-pl="Krzysztof Jakubiak · Frontend engineer"></p>
    <h1>
      <span data-en="Interfaces" data-pl="Interfejsy"></span>
      <span class="plain" data-en=" for products that use AI. Lab: interview concepts, taken apart." data-pl=" produktów, które używają AI. Lab: koncepty z rozmów rekrutacyjnych, rozebrane na części."></span>
    </h1>
    <p class="url">krzysztofjakubiak.com</p>
    <script>
      const locale = new URLSearchParams(location.search).get("locale") === "pl" ? "pl" : "en";
      document.documentElement.lang = locale;
      for (const el of document.querySelectorAll("[data-en]")) el.textContent = el.dataset[locale];
      document.querySelector(".plain").style.color = "#1f2430";
    </script>
  </body>
</html>
```

Create `scripts/og/render.ts` (uses the Playwright already in devDependencies; run once, commit the PNGs):

```ts
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const template = fileURLToPath(new URL("./template.html", import.meta.url));
const outDir = fileURLToPath(new URL("../../public/og/", import.meta.url));
const fontCss = fileURLToPath(
  new URL("../../node_modules/@fontsource-variable/inter-tight/index.css", import.meta.url),
);

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const locale of ["en", "pl"] as const) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.goto(`file://${template}?locale=${locale}`);
    await page.addStyleTag({ path: fontCss });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${outDir}${locale}.png`, type: "png" });
    await page.close();
    console.log(`wrote public/og/${locale}.png`);
  }
} finally {
  await browser.close();
}
```

Add to `package.json` scripts: `"og": "bun scripts/og/render.ts"`. Run: `bun run og`
Expected: two PNG files, each roughly 40–120 KB. Open them (Finder or `open public/og/en.png`) and check the text fits.

- [ ] **Step 6: Run build and tests**

Run: `bun run build && bunx playwright test tests/e2e/seo.spec.ts tests/e2e/theme.spec.ts`
Expected: PASS. `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist.

- [ ] **Step 7: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add astro.config.mjs package.json bun.lock public/robots.txt public/og scripts/og tests/e2e/seo.spec.ts
git commit -m "feat: sitemap with locales, robots.txt and Open Graph images"
```

---

### Task 11: Accessibility matrix, CI, docs

**Files:**
- Modify: `tests/e2e/smoke.spec.ts` (replace the axe loop with the matrix), `docs/learning-log.md`, `docs/superpowers/specs/2026-11-02-portfolio-shell-and-lab-design.md`, `README.md`

- [ ] **Step 1: Accessibility matrix**

In `tests/e2e/smoke.spec.ts` replace the `for (const path of ["/", "/this-page-does-not-exist"])` block with:

```ts
const PAGES = [
  "/",
  "/pl/",
  "/lab/",
  "/pl/lab/",
  "/notes/",
  "/pl/notes/",
  "/notes/workers-dev-switches-off/",
  "/about/",
  "/pl/about/",
  "/this-page-does-not-exist",
];

for (const path of PAGES) {
  for (const theme of ["light", "dark"] as const) {
    test(`no WCAG 2.2 AA violations on ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
```

Run: `bun run build && bun run test:e2e`
Expected: all suites PASS (smoke, theme, dock, home, lab-index, notes, about-404, fonts, seo). Any colour-contrast violation is fixed in `global.css` tokens, not by relaxing the test.

- [ ] **Step 2: CI already runs everything**

Confirm `.github/workflows/ci.yml` has the `Unit tests (Vitest)` step from Task 1 and that `bun run test:e2e` still runs after the build. No change needed unless Task 1 was skipped.

- [ ] **Step 3: Learning log rows**

Append to the table in `docs/learning-log.md` (same columns as T20):

```markdown
| T21 | 2026-11-02 | Theme without flash: inline head script + `data-theme` | E2 theme toggle | CSS alone cannot read localStorage, so the stored choice is applied by a tiny inline script before first paint. `@theme inline` keeps `var()` references so Tailwind utilities follow the attribute; no `dark:` variants needed. | `src/components/ThemeScript.astro`, `src/styles/global.css` |
| T22 | 2026-11-02 | i18n fallback is route-level, not per entry | `/pl/notes/<slug>` without a Polish file | Astro's `fallback` generates redirects for routes missing in a locale; a dynamic route present in both locales gets none. Content-level fallback is our code (`labEntries`), or a 404. | Astro i18n docs; `src/lib/content.ts` |
| T23 | 2026-11-02 | Build-time content rules beyond zod: a loader wrapper | "Polish mandatory for ready" Lab entries | A schema sees one entry; cross-entry rules run after the glob loader fills the store and throw to fail the build. Same place as `reference()` errors. | `src/content/loaders.ts` |
| T24 | 2026-11-02 | `font-display: swap` + unicode-range subsets | Inter Tight for headings | Only latin and latin-ext woff2 download; the swap is visible once per visit. If CLS shows up, the fix is `size-adjust` on a local fallback face, not removing the font. | Fontsource package CSS; web.dev on font loading |
```

Run `bunx biome format --write docs/learning-log.md`.

- [ ] **Step 4: Spec corrections**

In `docs/superpowers/specs/2026-11-02-portfolio-shell-and-lab-design.md`:

1. §4, the sentence `A zod \`superRefine\` in \`content.config.ts\` enforces it at build time: a ready entry without a \`pl\` counterpart fails \`astro build\`.`→`A loader wrapper (\`requirePolishForReady\` in \`src/content/loaders.ts\`) enforces it at build time after the glob loader runs: a ready entry without a \`pl\` counterpart fails \`astro build\`.`
2. §10, row `| i18n | non-ready entry missing PL | language switch targets the Lab index; Astro fallback redirects direct hits to EN |` → `| i18n | non-ready entry missing PL | language switch targets the Lab index; the index lists the English entry marked "English only"; direct hits on an unlinked Polish detail URL return 404 |`.

Run `bunx biome format --write docs/superpowers/specs/2026-11-02-portfolio-shell-and-lab-design.md`.

- [ ] **Step 5: README**

Add to `README.md` a section:

```markdown
## Develop

- `bun run dev` – Astro dev server.
- `bun run check && bun run lint` – types, templates, Biome.
- `bun run test:unit` – Vitest (schemas, i18n strings, loaders).
- `bun run build && bun run test:e2e` – Playwright against `wrangler dev` serving `dist/`.
- `bun run og` – regenerate `public/og/*.png` after changing `scripts/og/template.html`.

## Content

- `src/content/lab/<locale>/<slug>.mdx` – Lab entries. English is mandatory; Polish is mandatory for `status: ready` (build fails otherwise).
- `src/content/notes/<locale>/<slug>.mdx` – Notes.
- `src/content/work.yaml` – Work list on the home page.
- UI copy lives in `src/i18n/ui.ts`.
```

- [ ] **Step 6: Lint, then commit (after consent)**

```bash
bunx biome check --write .
git add tests/e2e/smoke.spec.ts docs/learning-log.md docs/superpowers/specs/2026-11-02-portfolio-shell-and-lab-design.md README.md
git commit -m "test: a11y matrix across pages, themes and locales; docs for E2 shell"
```

---

## Self-review against the spec

- §3 routes: `/`, `/pl/` (T2, T5); `/lab/`, `/pl/lab/` (T6); `/lab/<slug>/` is Plan 2 (no ready entries exist yet, the index renders no links); `/notes/`, `/notes/<slug>/` and PL (T7); `/about/`, `/pl/about/` (T8); `/404` (T8). Dock items, breakpoints and JS-shipped column (T3, tests in T2/T5/T7).
- §4 i18n: config (T2), typed strings (T1), PL-for-ready rule (T4, as loader wrapper), `lang`/`hreflang`/canonical (T2), switch keeps slug or targets the index (T3, T7), `Intl` formatting (T5, T7).
- §5 content model: schemas and refine (T4), `reference()` (T4, manual proof step), status semantics on index (T6), notes minimal (T4, T7), work via `file()` (T4).
- §6–§7 Lab entry anatomy and sandbox platform: Plan 2. The revisit storage contract is fixed here (T6) so Plan 2's control writes what the index reads.
- §8 visual design: tokens (T2), typography (T2, T9), layout and hairline lists (T5–T8), reduced motion (T2 CSS), theme mechanics (T2, T3).
- §9 SEO: canonical, hreflang, OG, sitemap, robots (T2, T10).
- §10 failure table: theme script try/catch (T2 test), storage blocked for revisit (T6 test), ready entry missing PL (T4), wrong reference (T4), fonts fallback (T9, swap), CI axe both themes (T11). Simulator and sandbox rows: Plan 2.
- §11 testing: unit (T1, T4), e2e as listed except the Lab 01 sandbox and JS budget (Plan 2).
- §12 deps: `@astrojs/mdx` (T4), `@astrojs/sitemap` (T10), `vitest` (T1), font (T9). `src/components/lab/*` and `src/lib/lab/*`: Plan 2.

Type consistency checked: `Locale`, `t`, `localeUrl`, `labEntries`, `labSlug`, `noteEntries`, `noteSlug`, `entryLocale`, `workItems`, `splitId`, `requirePolishForReady`, `Base` props `{ title, description, locale, path, switchPath?, ogImage?, noindex? }` are used with the same names in every task.
