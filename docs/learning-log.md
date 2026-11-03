# Learning log

Two parts. **Core concepts** (below): the five ideas this project is meant to teach, each with a measurement
from our own system; the first blog post is assembled from them. **Topics register** (end of file): everything
else the agent flags during planning, decisions and implementation as worth a post; Chris studies these later.

For each core concept:

1. **My explanation**: written by me, in my own words, after the stage where the concept came up.
2. **Verification**: what matches the sources, what is incomplete or wrong, with evidence (file:line or URL).
3. **Measured in our system**: one number or reproduced behaviour from this repo or Forge.

The first blog post (stage E4) is assembled from this file.

---

## 1. A content site does not need the React runtime; islands

Stage: E0, E2

**My explanation:**

**Verification:**

**Measured in our system:** JavaScript shipped by the home page, without an island (E0) and with one (E2).

E0, 2026-10-30, Astro 7.4.4 with the React integration enabled and no island on any page:

| File in `dist/`              | Raw       | Gzip     | Downloaded by the home page? |
| ---------------------------- | --------- | -------- | ---------------------------- |
| `index.html`                 | 885 B     | 544 B    | yes                          |
| `_astro/Base.*.css`          | 6,768 B   | 2,294 B  | yes                          |
| `_astro/client.*.js` (React) | 220,749 B | 68,073 B | no: no HTML file links to it |

The React integration builds its client runtime anyway; nothing references it until a component gets a
`client:*` directive. Guarded by the test "home page ships no JavaScript" in `tests/e2e/smoke.spec.ts`.

E2: _to fill in when the first island lands._

---

## 2. A Worker with static assets vs a Worker with `main`

Stage: E0, E1

**My explanation:**

**Verification:**

**Measured in our system:** `portfolio/wrangler.jsonc` next to `forge/wrangler.jsonc`.

E0, 2026-10-30: `wrangler deploy --dry-run` for the portfolio takes `dist/` (4 files) as assets and uploads a
Worker of 0.31 KiB (0.22 KiB gzip), because there is no `main` script: Cloudflare serves the files directly.
The dry-run prints "Read 5 files" for those 4 files. The first real deploy (2026-10-31, CI run 41059211446,
attempt 2) printed "Uploaded 4 files" and went live at `https://portfolio.kj-forge.workers.dev`, so the upload
matches `dist/`. Why the dry-run counts 5 is still unexplained (hypothesis: it also counts the `_astro/` directory).
Forge sets `"main": "@tanstack/react-start/server-entry"` and the `nodejs_compat` flag, because its Worker renders
pages and runs server functions on every request.

E1: _to fill in: Forge's dry-run upload size for comparison._

---

## 3. Why `VITE_APP_URL` is baked into the build, and what a wrong value does

Stage: E1

**My explanation:**

**Verification:**

**Measured in our system:** the failure reproduced on purpose on Forge staging; what the user sees.

---

## 4. A file contract decouples the portfolio from the newsletter app

Stage: E2

**My explanation:**

**Verification:**

**Measured in our system:** the build rejects a post without `sources`; no runtime call between the two systems.

---

## 5. A 6-hour restore window is not a backup

Stage: E4

**My explanation:**

**Verification:**

**Measured in our system:** a test restore of a `pg_dump` from R2: how long it took, whether the data matched.

---

# Topics register

Captured by the agent during planning, decisions and implementation: things worth a blog post later.
Chris studies them on his own schedule. Each entry: when it came up, where, why it matters, source.
Newest at the bottom. When a topic gets its own section above or a published post, link it here.

| #   | Date       | Topic                                                                | Where it came up                                                                   | Why it matters                                                                                                                                                                                                                                                                                                                                                                                         | Source / evidence                                                                                      |
| --- | ---------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| T1  | 2026-10-30 | A hosting decision can be contractual, not technical                 | garmin-coach: multi-user hosting on Garmin Personal API keys                       | Terms §1 ("only by you ... for your own use", no sharing) ruled hosting out before any architecture question. Read the terms before the stack.                                                                                                                                                                                                                                                         | Garmin Personal API Supplemental Terms; FAQ "not intended for applications serving multiple end users" |
| T2  | 2026-10-30 | Subscription LLM access vs API billing in a hosted app               | Newsletter Stories hosting                                                         | Agent SDK on a Max plan spawns Claude Code and is for personal use only; a hosted product needs API-key billing. Hosting flips the cost model.                                                                                                                                                                                                                                                         | Anthropic: "Use the Claude Agent SDK with your Claude plan"; Agent SDK overview                        |
| T3  | 2026-10-30 | Content site without a React runtime; islands                        | Choosing Astro for the portfolio                                                   | Zero JS by default, React only where there is interaction; measured in concept 1 above.                                                                                                                                                                                                                                                                                                                | Astro docs: islands, `client:*` directives; `tests/e2e/smoke.spec.ts`                                  |
| T4  | 2026-10-30 | Build-time diagram rendering (Mermaid → SVG)                         | Blog post contract                                                                 | Rendering in the browser ships mermaid.js to every reader; rendering at build needs either a DOM-free renderer (beautiful-mermaid, 6 diagram types) or headless Chromium in CI (rehype-mermaid).                                                                                                                                                                                                       | npm registry metadata, GitHub READMEs (2026)                                                           |
| T5  | 2026-10-30 | Runtime minimums move under you                                      | Astro 7.4.2 requires Node ≥ 22.23.4, released the day before; local Node was 22.19 | Pin the runtime (`.nvmrc`) and read `engines` when a tool "suddenly" refuses to run.                                                                                                                                                                                                                                                                                                                   | `node_modules/astro/package.json` engines; npm `time` for 7.4.0 → 7.4.2                                |
| T6  | 2026-10-30 | Deploy the artifact you tested                                       | CI design                                                                          | The deploy job downloads `dist/` from the verify job instead of rebuilding, so what ships is exactly what passed. Static-asset deploys are atomic: a failed upload keeps the previous version live.                                                                                                                                                                                                    | `.github/workflows/ci.yml`; Cloudflare static assets docs                                              |
| T7  | 2026-10-30 | Fail fast with a message, not a stack trace                          | CI deploy job                                                                      | Missing secrets produce one `::error::` line naming them; the site is unchanged. First real run proved it.                                                                                                                                                                                                                                                                                             | CI run 41059211446, attempt 1                                                                          |
| T8  | 2026-10-31 | Git credentials have scopes; SSH keys do not                         | First push rejected: OAuth token lacked `workflow` scope for `.github/workflows/`  | Same account, two credentials, different powers. Choose the credential by the operation.                                                                                                                                                                                                                                                                                                               | GitHub push error message; `gh auth status`                                                            |
| T9  | 2026-10-31 | Environment secrets + deployment branch policy                       | Where to put `CLOUDFLARE_API_TOKEN`                                                | Secrets scoped to `production`, allowed only from `main`: a PR branch cannot read them. Repo-level secrets would leak to any workflow run.                                                                                                                                                                                                                                                             | GitHub environments settings; `gh api .../deployment-branch-policies`                                  |
| T10 | 2026-10-31 | Token scope: template vs least privilege; IP filtering vs CI         | Cloudflare API token for deploys                                                   | "Edit Cloudflare Workers" grants account-wide Workers write (can touch Forge too). IP allowlists are useless for GitHub-hosted runners (8350 published ranges, weekly changes). Mitigate with where the token lives (T9), not with IP.                                                                                                                                                                 | Cloudflare token templates; GitHub `GET /meta`                                                         |
| T11 | 2026-10-31 | `workers_dev` default flips when routes exist                        | Adding the custom domain                                                           | Wrangler turns off the `workers.dev` URL as soon as `routes` is set, unless `workers_dev: true` is explicit. A silent default would have removed the fallback.                                                                                                                                                                                                                                         | Wrangler configuration docs                                                                            |
| T12 | 2026-10-31 | Custom Domains issue certificates, including deep subdomains         | Choosing `krzysztofjakubiak.com`                                                   | A Worker Custom Domain creates the DNS record and an Advanced Certificate; Universal SSL alone covers only one subdomain level. Issued cert: 90 days, `*.krzysztofjakubiak.com` in SAN.                                                                                                                                                                                                                | Cloudflare Custom Domains docs (2026-09-29); `openssl s_client` output                                 |
| T13 | 2026-10-31 | Negative DNS caching and IPv6-only answers                           | Site "down" locally right after deploy                                             | The Mac cached "no A record" from before the deploy and had only AAAA; without IPv6 connectivity the site was unreachable locally while fine from outside. SOA minimum TTL 1800 s bounds the wait.                                                                                                                                                                                                     | `dig SOA`, `dscacheutil -q host`, `curl --resolve`                                                     |
| T14 | 2026-11-01 | Dependabot ignore rules also silence security updates                | PRs bumping TypeScript to 7 and `@types/node` to 26                                | Pinning majors is right here (astro check rejects TS 7; types must match the Node major), but the ignore has a cost. Also: Dependabot has a `bun` ecosystem; `npm` would not update `bun.lock`.                                                                                                                                                                                                        | GitHub Dependabot options reference; CI run 41059357893                                                |
| T15 | 2026-10-31 | A 6-hour restore window is not a backup                              | Forge on Neon Free                                                                 | Point-in-time restore covers 6 h; a nightly `pg_dump` to R2 is the backup. Planned for E4.                                                                                                                                                                                                                                                                                                             | Neon docs: history window, backups                                                                     |
| T16 | 2026-11-02 | Lab = interview concepts with a clickable sandbox; a fact lives once | Defining the portfolio Lab section                                                 | One concept per entry: plain explanation, real code, interactive sandbox, Chris's own conclusion. Posts tell the story and link to Lab for proof. Rejected: Lab as replayed LLM recordings (unreadable without context, depended on an app that does not exist yet).                                                                                                                                   | Session 2026-11-02; mockup artifact (Design canvas)                                                    |
| T17 | 2026-11-02 | A sandbox simulates its backend                                      | Lab 01 client-side cache sandbox                                                   | A `setTimeout` "server" with fixed latency and a request counter makes results repeatable, free and offline. State in the entry what it cannot show (network variance, HTTP cache headers).                                                                                                                                                                                                            | Mockup `LabCache.dc.html`                                                                              |
| T18 | 2026-11-02 | JS budget per page with islands                                      | Only Lab pages ship JS                                                             | `client:visible` loads the sandbox when it scrolls into view; home stays at 0 JS (measured in concept 1). Measure bytes per Lab page in E2.                                                                                                                                                                                                                                                            | Astro docs: client directives                                                                          |
| T19 | 2026-11-02 | `prefers-reduced-motion` for animated visualisations                 | Bars, counters and timelines in sandboxes                                          | Same numbers, no animation. Reduced motion is one global CSS rule in `src/styles/global.css` (animations and transitions cut to 0.01 ms, smooth scroll off). No automated test covers it: axe does not test `prefers-reduced-motion`, and SC 2.3.3 is AAA, outside the tags we run.                                                                                                                    | WCAG 2.2 SC 2.3.3; MDN `prefers-reduced-motion`                                                        |
| T20 | 2026-11-02 | Cross-collection references validated at build                       | Notes post ↔ Lab entry links                                                       | Astro 7.4.4 `reference()` only logs `Invalid content reference` and the build still exits 0. The gate is ours: `assertReferences()` in `src/lib/content.ts` (pure check in `src/content/references.ts`) throws, so a wrong slug fails `astro build`.                                                                                                                                                   | Astro 7.4.4 `content-layer.js` `#validateReferences`; `src/content/references.ts`                      |
| T21 | 2026-11-02 | Theme without flash: inline head script + `data-theme`               | E2 theme toggle                                                                    | CSS alone cannot read localStorage, so the stored choice is applied by a tiny inline script before first paint. `@theme inline` keeps `var()` references so Tailwind utilities follow the attribute; no `dark:` variants needed.                                                                                                                                                                       | `src/components/ThemeScript.astro`, `src/styles/global.css`                                            |
| T22 | 2026-11-02 | i18n fallback is route-level, not per entry                          | `/pl/notes/<slug>` without a Polish file                                           | Astro's `fallback` is route-level: it generates redirects for routes missing in a locale, and a dynamic route present in both locales gets none. Here every route has both locale files, so the route-level `fallback` was removed (it only produced a `/pl/404/` stub with HTTP 200 and a build warning). A Polish URL without a page returns 404; content-level fallback is our code (`labEntries`). | Astro i18n docs; `astro.config.mjs`; `src/lib/content.ts`                                              |
| T23 | 2026-11-02 | Build-time content rules beyond zod: a loader wrapper                | "Polish mandatory for ready" Lab entries                                           | A schema sees one entry; cross-entry rules run after the glob loader fills the store and throw to fail the build. The same build-time idea guards references: see T25. A Polish file without its English counterpart also fails the build (English is mandatory).                                                                                                                                      | `src/content/loaders.ts`                                                                               |
| T24 | 2026-11-02 | `font-display: swap` + unicode-range subsets                         | Inter Tight for headings                                                           | Only latin and latin-ext woff2 download; the swap is visible once per visit. latin-ext is about 90 KB and the Polish home heading needs it, which makes the swap more visible on `/pl/`. If CLS shows up, the fix is `size-adjust` on a local fallback face, not removing the font.                                                                                                                    | Fontsource package CSS; web.dev on font loading                                                        |
| T25 | 2026-11-02 | A library guarantee measured, not assumed: `reference()` warns       | Spec promised build failure on a wrong slug                                        | A temporary bad slug showed exit 0 with only a log line. Measure what a dependency guarantees before relying on it; the build-level proof is a temporary bad slug and a non-zero exit.                                                                                                                                                                                                                 | Build proofs while adding the content rules (2026-11-02); `src/content/references.ts`                  |
| T26 | 2026-11-02 | Language of parts (WCAG 3.1.2) for fallback content                  | English Lab entries shown on Polish pages                                          | Text from an English fallback file inside `<html lang="pl">` gets `lang="en"` on the element, otherwise Polish screen readers mispronounce it. UI strings around it stay unmarked.                                                                                                                                                                                                                     | WCAG 2.2 SC 3.1.2; `src/views/LabIndexView.astro`, `src/components/ListRow.astro`                      |
| T27 | 2026-11-02 | Contrast is measured by axe, not estimated from OKLCH lightness      | Accent chip on accent-soft                                                         | Estimates said about 4.7:1; axe measured 4.43:1 (fails AA). Fixed at the token (`--accent` 53% → 50% L), not per component, so every accent use passes.                                                                                                                                                                                                                                                | axe run in `tests/e2e/lab-index.spec.ts`; `src/styles/global.css`                                      |
| T28 | 2026-11-02 | Label in name (WCAG 2.5.3) vs a compact control                      | Dock language switch "PL"                                                          | Visible text must start the accessible name: visible `PL` with `aria-label="PL, Polski"`. A full word overflowed the dock at 320 px (targets shrank to 41 px).                                                                                                                                                                                                                                         | WCAG 2.2 SC 2.5.3, 2.5.8; `src/components/Dock.astro`                                                  |
