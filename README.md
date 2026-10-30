# portfolio

Personal site of Krzysztof Jakubiak: who I am, case studies of my projects, and a blog.

Built with [Astro](https://astro.build) (static output, React only where a page needs interaction),
Tailwind CSS 4, and served by a Cloudflare Worker as static assets.

## Run locally

Requirements: Node ≥ 22.12 (see `.nvmrc`) and Bun 1.4.

```bash
bun install --frozen-lockfile
bun run dev          # Astro dev server with hot reload
```

To see the site exactly as production serves it (404 handling, trailing slashes):

```bash
bun run build
bun run preview      # wrangler dev on http://127.0.0.1:8788
```

## Checks

| Command            | What it checks                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| `bun run lint`     | Biome lint and formatting                                                              |
| `bun run check`    | `astro check`: TypeScript and Astro templates                                          |
| `bun run build`    | static build into `dist/`                                                              |
| `bun run test:e2e` | Playwright smoke tests and axe (WCAG 2.2 AA) against `wrangler dev`; run `build` first |

CI (`.github/workflows/ci.yml`) runs all of them on every pull request and on `main`.

## Deploy

A push to `main` that passes CI deploys `dist/` to the Cloudflare Worker named `portfolio`
(`wrangler.jsonc`). A failed deploy leaves the previous version live.

One-time setup (manual, in the Cloudflare and GitHub dashboards):

1. Register the domain in Cloudflare Registrar; its DNS zone is then active in the same account.
2. Create an API token with the _Edit Cloudflare Workers_ template, scoped to this account only.
3. In the GitHub repository: Settings → Secrets and variables → Actions → add
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Create a `production` environment.
4. After the first deploy, attach the domain: add to `wrangler.jsonc`
   `"routes": [{ "pattern": "<domain>", "custom_domain": true }]` and set `site` in `astro.config.mjs`.

## Docs

- [`docs/learning-log.md`](docs/learning-log.md): concepts this project is meant to teach, explained and verified
  as the work goes. The first blog post is written from it.
