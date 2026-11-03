/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro's Vite config gives tests the same aliases and virtual modules as the site.
export default getViteConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
