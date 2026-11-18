import { open, CMS, P, settle, attach, rec, tryDo, here } from "./lib.mjs";
const log = console.log;
const { browser, page } = await open("curator", { viewport: "1440" }); const e = attach(page, "keys");
const act = async () => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName}${a.id?"#"+a.id:""} "${(a.getAttribute("aria-label")||a.textContent||"").trim().replace(/\s+/g," ").slice(0,40)}"` : "none"; });
// list 503 (API origin only)
await page.route(/localhost:8080.*\/projects\/[^/]+\/pois(\?.*)?$/, (route) => route.request().method()==="GET" ? route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ title: "x", status: 503, code: "SERVICE_UNAVAILABLE", requestId: "verify-req-list" }) }) : route.continue());
await page.goto(`${CMS}/projects/${P}/pois`); await settle(page, 2500); let r = await rec(page, "forced-list-503", {}); log("list503", r.h1, r.violations.map(v=>v.id+":"+v.impact).join(","), (await page.locator("main").innerText()).slice(0,300).replace(/\n/g," | "));
await page.unroute(/localhost:8080.*\/projects\/[^/]+\/pois(\?.*)?$/);
// route change focus
await page.goto(`${CMS}/projects/${P}`); await settle(page);
await page.getByRole("link", { name: "Routes", exact: true }).first().click(); await page.waitForTimeout(1500);
log("route-change focus:", await act(), "| title:", await page.title());
// skip link
await page.goto(`${CMS}/projects/${P}/guides`); await settle(page); await page.evaluate(() => document.body.focus?.()); await page.keyboard.press("Tab");
log("first tab:", await act()); await page.keyboard.press("Enter"); await page.waitForTimeout(300); log("after skip activate:", await act(), page.url().replace(CMS,""));
// kebab Esc
await page.goto(`${CMS}/projects/${P}/pois`); await settle(page);
const kb = page.getByRole("button", { name: /^Actions for/ }).first(); await kb.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
log("kebab open focus:", await act()); const items = await page.getByRole("menuitem").allInnerTexts(); log("kebab items:", items.join(" / "));
await page.keyboard.press("Escape"); await page.waitForTimeout(400); log("kebab esc focus:", await act());
// set position dialog
await kb.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
const sp = page.getByRole("menuitem", { name: /position/i }).first();
if (await sp.count()) { await sp.click(); await page.waitForTimeout(700); log("set-position dialog:", await act(), "dialog count", await page.getByRole("dialog").count()); await rec(page, "set-position-dialog", { full:false }); await page.keyboard.press("Escape"); await page.waitForTimeout(400); log("set-position esc focus:", await act()); } else log("no set position item");
// Activate Esc
await page.goto(`${CMS}/projects/${P}/pois/cb763579-1082-45a7-8038-ed6a91ecc3d4`); await settle(page);
const ab = page.getByRole("button", { name: /^Activate$/ }).first(); await ab.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(600);
log("activate dialog focus:", await act(), "dialogs", await page.getByRole("dialog").count()); await page.keyboard.press("Escape"); await page.waitForTimeout(500); log("activate esc focus:", await act(), "dialogs", await page.getByRole("dialog").count());
// Preview in app Esc
const pb = page.getByRole("button", { name: /Preview in app/ }).first(); await pb.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(1200);
log("preview opened focus:", await act()); const before = await page.getByRole("button", { name: /Close preview/ }).count(); await page.keyboard.press("Escape"); await page.waitForTimeout(600);
log("preview esc: close btn before", before, "after", await page.getByRole("button", { name: /Close preview/ }).count(), "focus", await act());
// Esc while Frame has focus? tab into frame region
// asset picker
await page.goto(`${CMS}/projects/${P}/pois/9d32bf3f-6d1b-4ab1-a129-f52f4a890403`); await settle(page);
await tryDo("picker", async () => { await page.getByRole("button", { name: /Replace.*Primary image|Choose.*(image|primary)/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(1500); });
await rec(page, "asset-picker", {}); log("picker dialogs", await page.getByRole("dialog").count(), await act()); await page.keyboard.press("Escape"); await page.waitForTimeout(500); log("picker esc focus", await act());
// drawer at 768
await page.setViewportSize({ width: 768, height: 1024 }); await page.goto(`${CMS}/projects/${P}/pois`); await settle(page);
const mb = page.getByRole("button", { name: /^Menu$/ }); await mb.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
log("drawer open focus:", await act()); await rec(page, "drawer-open", { vp: "768" });
await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); log("drawer tab focus:", await act());
await page.keyboard.press("Escape"); await page.waitForTimeout(500); log("drawer esc focus:", await act(), "nav visible", await page.locator("#workspace-nav").isVisible());
// switcher at 768 and kebab with Esc already; switcher keyboard
await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(`${CMS}/projects/${P}`); await settle(page);
const sw = page.getByRole("button", { name: /Switch project/ }); await sw.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(700); log("switcher focus:", await act()); await page.keyboard.press("Escape"); await page.waitForTimeout(400); log("switcher esc focus:", await act());
log("errs", JSON.stringify(e));
await browser.close();
