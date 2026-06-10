import { defineConfig } from "@playwright/test";

/**
 * E2E against the real product: `node server.js` serving the built export.
 * Run `npm run build` first (CI does; `npm run e2e` does not rebuild so
 * local iteration stays fast — use `npm run build` when src changed).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 420_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "node server.js",
    port: 3100,
    reuseExistingServer: true,
  },
});
