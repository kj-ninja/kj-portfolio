// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Static output (Astro's default): `astro build` writes plain HTML/CSS to ./dist and the
// Cloudflare Worker serves it as static assets (see wrangler.jsonc). No adapter is needed
// until a page has to render on request.
//
// `site` is the production origin: canonical links, hreflang alternates and the sitemap use it.
//
// i18n: English is the default and lives at `/`; Polish lives at `/pl/`. Every route exists in
// both locales as a file (src/pages/*.astro and src/pages/pl/*.astro; the bilingual 404 page is
// shared), so no `fallback` is set: dynamic routes never got a per-slug fallback from it, and it
// only produced a `/pl/404/` redirect stub (HTTP 200) plus a route-conflict build warning.
// A Polish URL without a page returns the 404.
export default defineConfig({
  site: "https://krzysztofjakubiak.com",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "pl"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", pl: "pl" },
      },
      // Astro passes absolute URLs; this drops the 404 page (noindex, not a real URL).
      filter: (page) => !page.endsWith("/404/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
