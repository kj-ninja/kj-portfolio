# Portfolio shell + Lab platform: design

Status: accepted 2026-11-02 after review (one Lab track, no systems engine; topic list in `docs/lab-topics.md`). Scope of this spec = stage E2 of the plan: the site shell (layout, dock, PL/EN, theme, home, about, work list, notes list, 404, SEO) and the Lab platform with its first entry (01 Client-side cache). Content for Work and Notes, the blog block contract for Newsletter Stories, Forge under the domain (E1), analytics and uptime (E4) are out of scope and get their own specs.

## 1. Goal

A minimalist, warm, editorial portfolio for Krzysztof Jakubiak at `krzysztofjakubiak.com`, positioned as "frontend engineer, interfaces for products that use AI". The differentiating section is **Lab**: evergreen frontend concepts that recur in job interviews, each taken apart with a plain explanation, real code and a clickable sandbox. Krzysztof is the first learner; an entry is good when he can explain the concept without looking a week later. The topic list and its order come from a separate research document, `docs/lab-topics.md` (interview-frequency signal from public question catalogues, relevance in 2027, sandbox idea per topic). The first three entries are fixed: 01 client-side cache, 02 re-renders and memoization, 03 event loop.

Non-goals: no CMS, no backend for the site, no accounts, no cookies banner, no analytics in this stage.

## 2. Decisions already made (do not reopen)

- Astro 7 static output (no adapter), served as Cloudflare Workers static assets; React islands only where there is interaction; Tailwind 4; Biome; Playwright + axe; CI as in `.github/workflows/ci.yml`.
- PL and EN from the start, **EN is the default** (`/` is English, `/pl/` is Polish).
- Theme toggle (light/dark) from the start.
- Visual direction: warm palette with one accent, floating dock, typography as structure, mono for metadata, mobile-first, no card grids with shadows, no long multi-section home.
- Lab stands on its own. Notes (blog) and Work plug in later. Lab is **one list of small, evergreen frontend concepts**, each explained plainly and shown in a browser-only sandbox. Browser-level event patterns (event emitter, BroadcastChannel) are ordinary entries. Distributed-systems topics (Kafka, outbox, idempotency, failure paths between services) are **out of scope for Lab**: if such a topic appears as a Notes post, a separately hosted mini-app showing the whole architecture is a separate decision, linked from the post and from a Lab entry that keeps only a few clickable things and results. Lab itself never needs a backend.
- No credit line to other people's demos: we borrow no content, only present known technology our own way.
- Division of labour: Claude writes the example code, the sandboxes and the shared blocks; Krzysztof picks the topic and question, reviews, runs the sandbox and writes "My take". An entry without "My take" does not publish.

## 3. Information architecture and routes

| Route (EN)       | Route (PL)          | Page                                                                                                                    | JS shipped                                                |
| ---------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `/`              | `/pl/`              | Home: one sentence about Krzysztof, "Now", Work list (3 products with status), Lab teaser (3 entries), Notes teaser (3) | theme script only (~0.5 KB inline)                        |
| `/lab/`          | `/pl/lab/`          | Lab index: one list, entries ordered by `order`, status shown per entry; no filter UI                                   | theme script + revisit script (inline, ~0.5 KB, no React) |
| `/lab/<slug>/`   | `/pl/lab/<slug>/`   | Lab entry (see §6)                                                                                                      | theme script + sandbox island(s)                          |
| `/notes/`        | `/pl/notes/`        | Notes index (list)                                                                                                      | theme script only                                         |
| `/notes/<slug>/` | `/pl/notes/<slug>/` | Note (plain MDX, no custom blocks in this stage)                                                                        | theme script only                                         |
| `/about/`        | `/pl/about/`        | Short bio, how to reach, colophon (stack, fonts, source link)                                                           | theme script only                                         |
| `/404`           | —                   | Existing 404 page, bilingual text, link to `/` and `/pl/`                                                               | theme script only                                         |

Work has no dedicated pages in this stage: the Work list on Home links to the apps and repos. `/work/<slug>` case studies are stage E3.

Dock items: Home, Lab, Notes, About (About replaces the earlier "Work" icon; Work is on Home). Then a divider, the language switch (`PL`/`EN`, a link to the same page in the other locale) and the theme toggle. On viewports narrower than 768 px the dock is fixed at the bottom; from 768 px it sits at the top centre. The dock is a plain `<nav>`; only the theme button needs JS.

## 4. Internationalisation

Astro built-in i18n:

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "pl"],
  routing: { prefixDefaultLocale: false },
  fallback: { pl: "en" },
}
```

`fallback: { pl: "en" }` means a Polish URL without a Polish page redirects to the English page instead of 404 (verified in `node_modules/astro/dist/types/public/config.d.ts`, `i18n.fallback`).

- UI strings live in `src/i18n/en.ts` and `src/i18n/pl.ts` with one shared TypeScript type, so a missing key is a type error (`astro check` fails).
- Content is per locale in the collections (§5). Rule: **English is mandatory for every entry; Polish is mandatory for entries with `status: "ready"`** and optional otherwise. A zod `superRefine` in `content.config.ts` enforces it at build time: a ready entry without a `pl` counterpart fails `astro build`.
- `<html lang>` follows the locale; `hreflang` alternates and a canonical URL are emitted per page.
- The language switch keeps the current slug. When the other locale has no page (allowed only for non-ready entries), the switch links to the other locale's Lab index.
- Dates and numbers are formatted with `Intl` per locale.

## 5. Content model (Astro content layer, zod)

`src/content.config.ts` defines three collections with `glob()` loaders. Files are organised by locale: `src/content/lab/en/client-cache.mdx`, `src/content/lab/pl/client-cache.mdx`. The entry id is `<locale>/<slug>`; a helper derives `locale` and `slug`.

### 5.1 `lab`

```ts
const lab = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lab" }),
  schema: z
    .object({
      title: z.string(),
      question: z.string(), // the one-sentence question the entry answers
      order: z.number().int().positive(), // position in the Lab index
      status: z.enum(["ready", "building", "planned"]),
      publishedOn: z.coerce.date().optional(),
      updatedOn: z.coerce.date().optional(),
      takeWrittenOn: z.coerce.date().optional(), // "My take" written by Krzysztof
      readingMinutes: z.number().int().positive(),
      sandbox: z.enum(["none", "island"]).default("island"),
      sources: z.array(z.object({ title: z.string(), url: z.string().url() })),
      related: z.array(reference("lab")).default([]),
      notes: z.array(reference("notes")).default([]),
    })
    .superRefine((v, ctx) => {
      if (v.status === "ready") {
        if (!v.publishedOn) ctx.addIssue({ code: "custom", message: "ready entries need publishedOn" });
        if (!v.takeWrittenOn) ctx.addIssue({ code: "custom", message: "ready entries need takeWrittenOn (My take)" });
        if (v.sources.length === 0) ctx.addIssue({ code: "custom", message: "ready entries need at least one source" });
      }
    }),
});
```

`reference("lab")` and `reference("notes")` make a wrong slug a build error (Astro content references, verified present in `node_modules/astro/dist/content/runtime.js`). Links between Notes and Lab therefore cannot rot silently.

Status semantics: `ready` is published with sandbox and My take; `building` is listed with its question and shown as "under construction"; `planned` is listed in a shorter form at the bottom of the index. Only `ready` entries have a detail page; `building` and `planned` ids render no route (the index items are not links).

### 5.2 `notes`

Minimal in this stage: `title`, `summary`, `publishedOn`, `tags[]`, `lab: reference("lab")[]`. Body is plain MDX rendered with Astro's default components. The block contract for posts generated by Newsletter Stories is a separate spec.

### 5.3 `work`

Data collection from `src/content/work.yaml` (`file()` loader): `name`, `what` (per locale), `status: live | repo | in-progress`, `url?`, `repo?`. Used only by the Home list in this stage.

## 6. Anatomy of a Lab entry

An entry page renders, in this order. Sections 1, 3, 5, 6, 8 are static HTML from MDX. Sections 2+4 (one island), 7 and 9 are React islands.

1. **Header**: number + status, title, the question, metadata line (`concept · sandbox · N code samples · M min · YYYY-MM`).
2. **Predict**: one multiple-choice question rendered by the sandbox island at its top ("Five taps with `staleTime: 60 s`: how many requests? 1 / 5 / 15"). It is part of the same island as the sandbox, so the choice can be compared with the sandbox result when the reader runs the matching scenario. No persistence. Sections 2 and 4 are therefore one island.
3. **What it is**: plain-language explanation, best practices, typical mistakes. Written to be repeatable in an interview. Terms defined on first use.
4. **Sandbox** (island, `client:visible`): the interactive part, built from the shared blocks (§7). Always has a simulated backend, a "what happened" log and a reset.
5. **What to look at**: three to five things to try, in order, each with the expected observation.
6. **The code**: real snippets with a comment at every decision, plus a link to the full sandbox source in the repo. Snippets are extracted from the sandbox source at build time where possible (a `<CodeFrom file="…" region="…" />` MDX component), so the text never drifts from the code.
7. **Interview questions**: three to five questions with an answer behind a "reveal" control. Plain `<details>`/`<summary>` HTML, no island.
8. **My take**: Krzysztof's conclusion. Required for `ready` (§5.1). Visually distinct (accent border).
9. **Go further**: related Lab entries, linked Notes, sources. A "Remind me in 7 days" control (small island, `client:idle`) stores the slug and a date in `localStorage`; the Lab index's inline revisit script marks "due for review" items for that reader. All `localStorage` access is wrapped: when unavailable the control hides itself and the index marks nothing.

Depth is the point: an entry is long-form. The reading-time estimate is honest.

## 7. Sandbox platform

### 7.1 Shared blocks (`src/components/lab/blocks/`)

React components, no external UI library. Each has one purpose and a props-only interface; none reads global state.

- `Counter` (label, value, unit, tone)
- `Bar` (value, max, tone; animated width, static when reduced motion)
- `EventLog` (list of `{ t, who, text, tone }`, newest first, capped)
- `Controls` (buttons and chips; 44 px targets)
- `Predict` (question, options, correct, onAnswer; rendered inside `SandboxFrame`)
- `SandboxFrame`: the wrapper every sandbox uses. It provides the title row ("Sandbox · fake server · 400 ms"), the reset button, the reduced-motion flag, and an **error boundary** whose fallback says "The sandbox failed to load. The text and code above are complete." A failing sandbox never blanks the page.

### 7.2 Simulated backends

Every sandbox owns a `FakeServer` (`src/lib/lab/fake-server.ts`): fixed latency, optional failure injection (`failNext(n)`, `failRate`), a request counter and an event hook. Latency is simulated with timers. No sandbox performs network I/O; a Playwright test asserts zero requests to anything but same-origin assets on every Lab page.

### 7.3 JS budget and loading

- Home, indexes, About, Notes: no React. Only the inline theme script.
- Lab entry: React runtime + blocks + the entry's sandbox. Budget **≤ 120 KB gzipped JavaScript per Lab page**, asserted by a test that reads `dist/` after build and sums the scripts referenced by each Lab HTML file. The number is a ceiling to be measured against, not a target to fill.
- The sandbox island (with Predict) uses `client:visible` and hydrates when scrolled into view. The revisit control uses `client:idle`. Interview questions are plain HTML.

## 8. Visual design

### 8.1 Tokens (`src/styles/global.css`, Tailwind `@theme`, OKLCH)

Light: surface warm off-white (≈ `#f6f3ee`), ink near-black blue (≈ `#1f2430`), muted (≈ `#5f6472`), line (≈ `#e4dfd6`), accent burnt orange (≈ `#c2410c`). Dark: surface `#15171d`, ink `#f1efe9`, muted `#a7a8ad`, line `#2c2f38`, same accent lightened for contrast. Exact OKLCH values are set in implementation and checked with axe (WCAG 2.2 AA) in both themes. Status colours: ready/teal `#0f766e`, building/muted.

### 8.2 Typography

Display: a self-hosted variable sans with tight tracking for headings (Inter Tight, latin + latin-ext subsets for Polish, `font-display: swap`, ≈ 60 KB). Body: system UI stack (no download). Metadata and code: `ui-monospace` stack. One display font is the compromise between "has something" and the performance budget; if Lighthouse shows CLS from the swap, the fallback is a size-adjusted local font via `@font-face` descriptors.

### 8.3 Layout

Single column, max width 42 rem for prose, 48 rem for sandboxes; 16 px side gutters on phones; dock as in §3. Lists are rows separated by hairlines, not cards. Motion: 120–240 ms transitions; everything respects `prefers-reduced-motion` (bars and tokens jump instead of animating; numbers are identical).

### 8.4 Theme mechanics

- Tokens are defined on `:root` (light) and redefined under `:root[data-theme="dark"]` and under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`. Tailwind's `dark:` variant is remapped with `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` plus the media query for the no-preference case.
- An inline script in `<head>` (before any CSS paint) reads `localStorage.theme` and sets `data-theme`; wrapped in `try/catch`, so a blocked storage falls back to the OS setting. The toggle writes the explicit choice. Until a choice is made the OS setting applies; there is no UI to return to "follow system" in this stage (clearing site data does it).
- `color-scheme` follows the active theme so form controls and scrollbars match.

## 9. SEO and sharing

Per page: `<title>`, description, canonical, `hreflang` for `en`/`pl`/`x-default`, Open Graph with a static 1200×630 image per locale (generated once in the repo, not at build), `sitemap-index.xml` via `@astrojs/sitemap` with i18n config, `robots.txt`. RSS for Notes is stage E3.

## 10. Failure behaviour (adversarial sweep)

| Interaction                          | Failure                                       | Designed behaviour                                                                                                                                                |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sandbox island                       | JS error at render or during a scenario       | `SandboxFrame` error boundary shows the fallback; text and code remain; nothing else on the page is affected                                                      |
| Sandbox island                       | never hydrates (script blocked, slow network) | the static shell shows the sandbox title and "Loading sandbox…" text; after 10 s a static note "The sandbox needs JavaScript" (CSS animation-delay reveal, no JS) |
| Theme script                         | storage blocked or throws                     | OS theme applies; toggle still works for the session (state in memory)                                                                                            |
| `localStorage` (revisit list, theme) | unavailable or full                           | controls hide or degrade; no exception reaches the page                                                                                                           |
| i18n                                 | ready entry missing PL                        | build fails with the refine message; nothing deploys                                                                                                              |
| i18n                                 | non-ready entry missing PL                    | language switch targets the Lab index; Astro fallback redirects direct hits to EN                                                                                 |
| Content references                   | wrong `related`/`notes` slug                  | build fails (`reference()`)                                                                                                                                       |
| Fonts                                | font fails to load                            | system fallback, `font-display: swap`, size-adjust fallback if CLS appears                                                                                        |
| CI                                   | axe violation in one theme or locale          | PR blocked; both themes × both locales are tested on every page type                                                                                              |

No runtime calls to external services exist, so there is no amplification and no cascade beyond a single island.

## 11. Testing

Unit (Vitest, to add): zod schemas (ready entry without `takeWrittenOn` rejected; wrong reference rejected by Astro build test), i18n completeness (every key in `en` exists in `pl`), `FakeServer` (latency, failure injection, counter), cache sandbox logic (`staleTime` 0 / 5 s / 60 s request counts).

E2E (Playwright against `wrangler dev`): every route in both locales returns 200 with correct `lang` and `hreflang`; Home ships no React (asserts no `astro-island` and no `.js` other than the inline theme script); theme toggle sets `data-theme`, persists across reload, and the first paint has no flash (checks the inline script is in `<head>` and `data-theme` is set before `DOMContentLoaded`); language switch keeps the slug; Lab 01 sandbox: five taps with 60 s ⇒ right counter 1, left 5; reduced-motion media emulation renders identical numbers; no network requests from Lab pages except same-origin assets; axe WCAG 2.2 AA on Home, Lab index, Lab 01, Notes index, About, 404 in light and dark, EN and PL; JS budget test on each Lab page.

Manual QA: phone and desktop, both themes, both languages, VoiceOver on Lab 01 (predict, sandbox controls, reveal), keyboard-only through the dock and the sandbox.

## 12. Files and systems in scope

New: `src/i18n/*`, `src/content.config.ts`, `src/content/{lab,notes,work}`, `src/layouts/Base.astro` (extended: head, theme script, dock, locale), `src/components/{Dock,ThemeToggle(script),LangSwitch,Lists}.astro`, `src/components/lab/blocks/*`, `src/components/lab/sandboxes/client-cache/*`, `src/lib/lab/fake-server.ts`, `src/pages/{index,about,lab/index,lab/[slug],notes/index,notes/[slug]}.astro` and their `pl/` counterparts via Astro i18n routing, `public/og/*.png`, `public/fonts/*`, tests. Dependencies to add (each through `bun add`, after checking the official install docs): `@astrojs/mdx`, `@astrojs/sitemap`, `vitest`, the font package or files.

Unchanged: `wrangler.jsonc`, CI workflow structure (new scripts are appended to the verify job), Dependabot.

## 13. Open points for review

1. Dock items: Home · Lab · Notes · About (Work lives on Home). Alternative: keep a Work icon that anchors to `/#work`.
2. Polish for `building` entries optional (EN only) until they are ready. Alternative: require both languages for everything.
3. One self-hosted display font (Inter Tight) vs system fonts only.
4. JS budget ceiling 120 KB gz per Lab page.

## 14. Learning-log topics raised by this design

Error boundary per island (each island is its own React tree); `reference()` validation; theme without flash (inline head script); i18n fallback vs 404; JS budget as a CI test; `font-display` and size-adjust against CLS. Entries T16–T20 already cover the Lab definition, simulated backends, per-page JS budget, reduced motion and build-time references; the rest are added when implemented.
