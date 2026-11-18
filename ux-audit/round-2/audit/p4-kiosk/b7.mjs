import { createRequire } from "node:module";
import { open, go, P, POI, seed, shot, settle, targets, API } from "./lib.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const axe = async (page, n) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log("axe", n, r.violations.map(v=>`${v.id}(${v.impact}):${v.nodes.length}`).join(", ") || "clean"); };
let { browser, context, page } = await open("curator", { viewport: "1024", touch: true });
// A. 768x600 drawer + dialogs
await page.setViewportSize({ width: 768, height: 600 });
await go(page, `/projects/${P}/pois`); await settle(page, 5000);
console.log("switcher chip text @6s:", (await page.locator("header").first().innerText()).replace(/\n/g," | "));
await page.getByRole("button", { name: /menu/i }).first().tap(); await page.waitForTimeout(600);
const nav = page.getByRole("dialog"); console.log("drawer at 600 tall: scrollHeight/clientHeight", await nav.evaluate(e=>{ const s=[e,...e.querySelectorAll("*")].find(x=>x.scrollHeight>x.clientHeight+2&&getComputedStyle(x).overflowY!=="visible"); return s?[s.scrollHeight,s.clientHeight]:"fits/no scroller"; }));
await shot(page, "nav-drawer__open__768x600", false);
await page.keyboard.press("Escape");
// Move to position dialog
await page.getByRole("button", { name: /^Actions for/ }).first().tap(); await page.waitForTimeout(500);
await page.getByRole("menuitem", { name: /Move to position/ }).tap(); await page.waitForTimeout(700);
const d = page.getByRole("dialog"); console.log("move dialog box", JSON.stringify(await d.boundingBox()));
await shot(page, "pois-list__move-to-position-dialog__768x600", false);
report: { const t = await d.evaluate(e=>[...e.querySelectorAll("button,input,select")].map(x=>{const r=x.getBoundingClientRect(); return (x.getAttribute("aria-label")||x.textContent||x.id).trim().slice(0,20)+" "+Math.round(r.width)+"x"+Math.round(r.height)})); console.log("move dialog controls", t); }
await page.keyboard.press("Escape");
// Activate dialog from row of a draft? just open Archive confirm on my own POI later. B. active POI sticky at 768x400
await page.setViewportSize({ width: 768, height: 400 });
await go(page, `/projects/${P}/pois/${seed.pois[0].id}`); await settle(page, 2500);
console.log("active POI sticky stack @400:", await page.evaluate(()=>[...document.querySelectorAll("*")].filter(e=>{const p=getComputedStyle(e).position; return (p==="sticky"||p==="fixed")&&e.getBoundingClientRect().width>300&&e.getBoundingClientRect().height>20}).map(e=>`${e.tagName}.${(e.className||"").toString().slice(0,20)} top ${Math.round(e.getBoundingClientRect().top)} h ${Math.round(e.getBoundingClientRect().height)}`)));
await page.getByLabel(/^Summary/).first().tap(); await page.waitForTimeout(600);
const sb = await page.getByLabel(/^Summary/).first().boundingBox(); console.log("summary focus box @400", JSON.stringify(sb));
await shot(page, "poi-editor__active-pending-typing__768x400", false);
await page.setViewportSize({ width: 768, height: 1024 });
// C. axe on tablet surfaces
await go(page, `/projects/${P}/preview`); await settle(page, 3500);
await page.getByRole("tab", { name: "Kiosk", exact: true }).tap(); await page.waitForTimeout(800);
await axe(page, "preview kiosk 768");
await go(page, `/projects/${P}/pois/${POI}`); await settle(page, 2500); await axe(page, "poi editor 768");
await page.getByRole("button", { name: /Preview in app/ }).first().tap(); await page.waitForTimeout(1500); await axe(page, "poi editor + panel 768");
// D. failure states on preview
await page.route(`${API}/**/pois*`, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type:"about:blank", title:"Service unavailable", status:503, code:"platform_unavailable", requestId:"req-r2p4-503" }) }));
await go(page, `/projects/${P}/preview`); await settle(page, 4000);
console.log("503 preview body:", (await page.locator("main").innerText()).slice(0,300).replace(/\n/g," | "));
await shot(page, "preview__503__768", false);
await page.unroute(`${API}/**/pois*`);
await context.setOffline(true);
await page.getByRole("tab", { name: "Live", exact: true }).tap().catch(()=>{}); await page.waitForTimeout(1500);
await shot(page, "preview__offline__768", false);
console.log("offline banner:", await page.locator("[role=alert],[role=status]").allTextContents());
await browser.close();
