# Learning log

Concepts this project is meant to teach. For each one:

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
Open question: wrangler prints "Read 5 files" for those 4 files; not explained yet.
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
