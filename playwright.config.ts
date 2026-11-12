import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests of the CMS against a running stack (AGENTS.md §8, §11; GAPS.md G-012, G-013): the CMS at
 * `CMS_URL`, the backend at `API_URL`, and the local Keycloak and Catalogue stand-ins of `dev/`. Nothing here
 * starts them; `e2e/README.md` says how. One worker, because every test signs in as the same user and the
 * Catalogue stand-in keeps its Projects in memory; no retries, because a test that needs one is a finding.
 */
export const CMS_URL = process.env.CMS_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: CMS_URL,
    viewport: { width: 1400, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "sign-in", testMatch: /sign-in\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1400, height: 900 }, storageState: "e2e/.auth/curator.json" },
      dependencies: ["sign-in"],
    },
  ],
});
