import { defineConfig, devices } from "@playwright/test";

const PORT = 8788;
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Smoke tests run against `wrangler dev` serving the built ./dist, not `astro dev`.
 * That way the tests exercise the same static-assets rules as production
 * (404 handling, trailing slashes), not the Astro dev server's behaviour.
 * Run `bun run build` first; CI does.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `bunx wrangler dev --port ${PORT} --ip 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
