# portfolio

Personal site of Krzysztof Jakubiak: who I am, case studies of my projects, and a blog.

Built with [Astro](https://astro.build) (static output, React only where a page needs interaction),
Tailwind CSS 4, and served by a Cloudflare Worker as static assets.

## Run locally

Requirements: Node ≥ 22.23.4 (required by Astro 7.4.2+, see `.nvmrc`) and Bun 1.4.

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
(`wrangler.jsonc`), served at https://krzysztofjakubiak.com and, as a fallback during the switch,
https://portfolio.kj-forge.workers.dev. A failed deploy leaves the previous version live.

One-time setup (manual, in the Cloudflare and GitHub dashboards; done on 2026-10-31):

1. The domain `krzysztofjakubiak.com` is registered in Cloudflare Registrar, in the same Cloudflare
   account as the Worker, so its DNS zone is active there.
2. An Account API token made from the _Edit Cloudflare Workers_ template, scoped to that one account.
   It expires on 2027-10-31; renew it and update the secret before then.
3. In the GitHub repository, the `production` environment allows deployments from `main` only and
   holds the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (environment secrets, not
   repository secrets, so jobs on other branches cannot read them).
4. The domain is attached in `wrangler.jsonc` (`routes` with `custom_domain: true`); Cloudflare creates
   its DNS record and certificate on deploy. `site` in `astro.config.mjs` matches it.

## Docs

- [`docs/learning-log.md`](docs/learning-log.md): concepts this project is meant to teach, explained and verified
  as the work goes. The first blog post is written from it.
