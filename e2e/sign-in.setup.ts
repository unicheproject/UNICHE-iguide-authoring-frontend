import { expect, test as setup } from "@playwright/test";
import { PASSWORD, USER } from "./support/api.ts";

/** Signs in once through the local Keycloak; the other tests reuse its session cookies. */
setup("sign in as the test user", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  if (!page.url().includes("/realms/uniche/")) {
    // The CMS may offer a sign-in button instead of redirecting at once.
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/realms\/uniche\//);
  }
  await page.locator("#username").fill(USER);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("#kc-login").click();
  await page.waitForURL((url) => !url.toString().includes("/realms/uniche/"));
  // The CMS header shows once the session is up, whatever organisations the realm's user has.
  await expect(page.getByText("iGuide CMS", { exact: true })).toBeVisible({ timeout: 30_000 });
  await page.context().storageState({ path: "e2e/.auth/curator.json" });
});
