// @ts-check
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Static output (Astro's default): `astro build` writes plain HTML/CSS to ./dist and the
// Cloudflare Worker serves it as static assets (see wrangler.jsonc). No adapter is needed
// until a page has to render on request.
//
// `site` is set once the domain is registered; it drives canonical URLs and the sitemap (E2).
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
