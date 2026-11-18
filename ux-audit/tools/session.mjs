// UX audit helper. Run with WINDOWS Node (the CMS dev server listens on Windows [::1]:5173 only):
//   cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\tools\session.mjs curator"
// CLI: signs in through the live UNICHE realm and saves the session cookies to ux-audit/tools/.auth/<account>.json.
// Library: import { open, bearer, CMS, API, VIEWPORTS } from "./session.mjs".
// Credentials live in ux-audit/tools/accounts.local (gitignored); never print or screenshot them.
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "package.json"));
// pnpm does not hoist playwright-core; @playwright/test re-exports the browsers.
const { chromium } = require("@playwright/test");

export const CMS = process.env.CMS_URL ?? "http://localhost:5173";
export const API = process.env.API_URL ?? "http://localhost:8080/iguide/api/v1";
export const VIEWPORTS = {
  "1440": { width: 1440, height: 900 },
  "1280": { width: 1280, height: 720 },
  "1024": { width: 1024, height: 768 },
  "768": { width: 768, height: 1024 },
  // 200 % zoom at 1280x720: half the CSS viewport at deviceScaleFactor 2.
  "zoom200": { width: 640, height: 360, deviceScaleFactor: 2 },
};

const stateFile = (account) => join(here, ".auth", `${account}.json`);

function accounts() {
  return JSON.parse(readFileSync(join(here, "accounts.local"), "utf8"));
}

/** Signs in on a page that shows the CMS sign-in view or the Keycloak form. */
async function signIn(page, account) {
  const creds = accounts()[account];
  if (!creds) throw new Error(`Unknown account ${account}`);
  await page.goto(CMS + "/");
  await page.waitForLoadState("networkidle").catch(() => {});
  if (!page.url().includes("/realms/")) {
    const button = page.getByRole("button", { name: /sign in/i });
    if (await button.count()) {
      await button.first().click();
      await page.waitForURL(/\/realms\//, { timeout: 30_000 });
    }
  }
  if (page.url().includes("/realms/")) {
    await page.locator("#username").fill(creds.user);
    await page.locator("#password").fill(creds.password);
    await page.locator("#kc-login").click();
    await page.waitForURL((u) => !u.toString().includes("/realms/"), { timeout: 30_000 });
  }
  // Signed in once the CMS no longer offers the sign-in button (the header text "iGuide CMS" shows on both).
  await page.waitForFunction(() => !/realms/.test(location.href) && ![...document.querySelectorAll("button")].some((b) => /sign in with uniche/i.test(b.textContent ?? "")), null, { timeout: 30_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** True when the page shows the CMS sign-in view or the identity provider's form. */
async function onSignIn(page) {
  if (page.url().includes("/realms/")) return true;
  return (await page.getByRole("button", { name: /sign in with uniche/i }).count()) > 0;
}

/**
 * Opens a browser page signed in as `account` at the named viewport.
 * Reuses the saved session (younger than 6 h); signs in again otherwise.
 * Options: { viewport: "1440"|..., headless: true, touch: false, reducedMotion, forcedColors, colorScheme }.
 */
export async function open(account = "curator", opts = {}) {
  const vp = VIEWPORTS[opts.viewport ?? "1440"] ?? VIEWPORTS["1440"];
  const browser = await chromium.launch({ headless: opts.headless ?? true });
  const fresh = existsSync(stateFile(account)) && Date.now() - statSync(stateFile(account)).mtimeMs < 6 * 3600_000;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor ?? 1,
    hasTouch: !!opts.touch,
    isMobile: false,
    reducedMotion: opts.reducedMotion ?? "no-preference",
    forcedColors: opts.forcedColors ?? "none",
    colorScheme: opts.colorScheme ?? "light",
    storageState: fresh ? stateFile(account) : undefined,
  });
  const page = await context.newPage();
  page.__account = account;
  if (!fresh) {
    await signIn(page, account);
    await context.storageState({ path: stateFile(account) });
  }
  return { browser, context, page };
}

/** Navigates to a CMS path and waits until the app settled (SSO landing included). */
export async function go(page, path) {
  await page.goto(path.startsWith("http") ? path : CMS + path);
  await page.waitForLoadState("networkidle").catch(() => {});
  if (await onSignIn(page)) {
    // The identity provider's session ended: sign in again, save it, and reopen the path.
    const account = page.__account ?? "curator";
    await signIn(page, account);
    await page.context().storageState({ path: stateFile(account) });
    await page.goto(path.startsWith("http") ? path : CMS + path);
    await page.waitForLoadState("networkidle").catch(() => {});
  }
}

/** Captures the bearer token the CMS sends to the authoring API (tokens stay in memory, so we read it off a request). */
export async function bearer(page) {
  const req = page.waitForRequest((r) => r.url().startsWith(API) && !!r.headers()["authorization"], { timeout: 45_000 });
  await go(page, "/");
  return (await req).headers()["authorization"];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const account = process.argv[2] ?? "curator";
  const { browser, context, page } = await open(account, { headless: true });
  await go(page, "/");
  await context.storageState({ path: stateFile(account) });
  console.log(`Saved session for ${account} -> ${stateFile(account)}`);
  await browser.close();
}
