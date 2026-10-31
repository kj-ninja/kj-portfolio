// @ts-check
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Static output (Astro's default): `astro build` writes plain HTML/CSS to ./dist and the
// Cloudflare Worker serves it as static assets (see wrangler.jsonc). No adapter is needed
// until a page has to render on request.
//
// `site` is the production origin. Astro uses it to build absolute URLs (`Astro.site`), which the
// canonical link and the sitemap will rely on (E2).
export default defineConfig({
  site: "https://krzysztofjakubiak.com",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
