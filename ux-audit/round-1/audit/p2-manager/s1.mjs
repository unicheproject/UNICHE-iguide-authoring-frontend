import { fresh, shot, creds, CMS } from "./h.mjs";
const { browser, context, page } = await fresh("1440");
const c = creds("admin");
await page.goto(CMS + "/");
await page.waitForTimeout(800);
await shot(page, "signin__initial", "1440");
console.log("url", page.url().replace(/\?.*/, ""));
console.log(await page.locator("body").innerText());
const btn = page.getByRole("button", { name: /sign in/i });
if (await btn.count()) { await btn.first().click(); await page.waitForURL(/realms/, { timeout: 30000 }); }
await page.waitForLoadState("networkidle").catch(()=>{});
await shot(page, "signin__idp-form", "1440");
await page.locator("#username").fill(c.user); await page.locator("#password").fill(c.password);
await page.locator("#kc-login").click();
await page.waitForURL(u=>!u.toString().includes("/realms/"),{timeout:30000});
await page.waitForLoadState("networkidle").catch(()=>{});
await page.waitForTimeout(1500);
await shot(page, "home__after-signin", "1440");
console.log("after", page.url());
console.log(await page.locator("body").innerText());
// second visit in same context: silent SSO
const p2 = await context.newPage();
await p2.goto(CMS + "/");
const seen=[]; p2.on("framenavigated", f=>seen.push(f.url().replace(/\?.*/,"")));
await p2.waitForLoadState("networkidle").catch(()=>{}); await p2.waitForTimeout(1500);
console.log("silent", p2.url(), seen);
await browser.close();
