import { fresh, uiSignIn, shot, text, CMS } from "./lib.mjs";
const vp = process.argv[2] ?? "1440";
const acct = process.argv[3] ?? "admin";
const { browser, context, page } = await fresh(vp);
await uiSignIn(page, acct, vp, () => {});
await page.waitForTimeout(3000);
console.log("URL after 3s more:", page.url().slice(0,80));
// pick Populated from list
await page.getByRole("link", { name: /UX Audit – Populated/ }).first().click().catch(async()=>{ console.log("not a link; trying text"); await page.getByText("UX Audit – Populated").first().click(); });
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(1500);
console.log("after pick:", page.url(), await page.title());
await shot(page, `dashboard__populated-${acct}`, vp);
console.log("=====POPULATED\n" + await text(page));
// switcher
const sw = page.getByRole("button", { name: /UX Audit – Populated|Choose a project|project/i }).first();
await sw.click(); await page.waitForTimeout(600);
await shot(page, `switcher__open-${acct}`, vp, false);
console.log("=====SWITCHER\n" + await text(page, "[role=dialog], [role=listbox], [data-reka-popper-content-wrapper], body").catch(()=>""));
await page.keyboard.type("Empty B"); await page.waitForTimeout(500);
await shot(page, `switcher__search-${acct}`, vp, false);
await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1500);
console.log("after switch:", page.url(), await page.title());
await shot(page, `dashboard__emptyB-${acct}`, vp);
console.log("=====EMPTY B\n" + await text(page));
// return to "/"
await page.goto(CMS + "/"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1500);
console.log("goto / ->", page.url());
// new page same context (silent SSO)
const p2 = await context.newPage();
const t0 = Date.now();
await p2.goto(CMS + "/", { waitUntil: "commit" });
for (let i = 0; i < 6; i++) { await p2.screenshot({ path: `shots/sso__silent-${acct}-t${i}__${vp}.png` }); await p2.waitForTimeout(250); }
await p2.waitForLoadState("networkidle").catch(()=>{});
console.log("silent SSO settled in", Date.now()-t0, "ms at", p2.url().slice(0,80), await p2.title());
await browser.close();
