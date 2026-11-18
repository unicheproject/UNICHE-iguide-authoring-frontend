import { open, go, P, shot, settle, KINDS } from "./h.mjs";
import fs from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
const created = {};
const ctx = page.context();
page.on("response", async r => { if (r.request().method() === "POST" && /\/(places|pois|routes|guides|events|categories)$/.test(r.url())) { try { const j = await r.json(); created[r.url().split("/").pop()] = { id: j.id, slug: j.slug ?? j.code, status: r.status() }; } catch {} } });
const names = { places: "UX-R3-s9 Place", pois: "UX-R3-s9 POI", routes: "UX-R3-s9 Route", guides: "UX-R3-s9 Guide", events: "UX-R3-s9 Event", categories: "UX-R3-s9 Category" };
// 1. ?create=1 and typed-Esc confirm on pois
await go(page, `/projects/${P}/places?create=1`); await settle(page, 1800);
console.log("create=1 dialog open:", await page.locator("[role=dialog]").count(), "url", await page.evaluate(() => location.pathname + location.search), "focus", await page.evaluate(() => document.activeElement.labels?.[0]?.innerText));
// Sub-place without parent
await page.locator("[role=dialog] input[type=text]").first().fill("UX-R3-s9 Sub-place check");
await page.getByRole("radio", { name: /Sub-place/ }).check({ force: true }); await settle(page, 500);
await shot(page, "places__create-subplace__1440");
console.log("subplace fields:", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] select")].map(s => (s.labels?.[0]?.innerText||"") + " opts:" + [...s.options].slice(0,3).map(o=>o.text.trim()).join("/"))));
await page.locator("[role=dialog] button", { hasText: /^Create/ }).click(); await settle(page, 700);
console.log("subplace submit:", await page.evaluate(() => ({ alert: [...document.querySelectorAll("[role=dialog] [role=alert]")].map(a=>a.innerText.replace(/\n+/g," | ")), dlg: !!document.querySelector("[role=dialog]"), url: location.pathname })));
await shot(page, "places__create-subplace-error__1440");
// typed Esc
await page.keyboard.press("Escape"); await settle(page, 500);
console.log("typed Esc:", await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].map(d => d.innerText.replace(/\n+/g," | ").slice(0,200))));
await shot(page, "places__create-esc-discard__1440");
await page.keyboard.press("Escape"); await settle(page, 300);
console.log("after second Esc:", await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].map(d => d.innerText.replace(/\n+/g," | ").slice(0,120))));
// slug disclosure
await go(page, `/projects/${P}/guides`); await settle(page, 1500);
await page.getByRole("button", { name: /^New guide/ }).click(); await settle(page, 500);
await page.locator("[role=dialog] input[type=text]").first().fill("UX-R3-s9 Guide Ωραία διαδρομή");
await settle(page, 300);
console.log("slug preview:", await page.evaluate(() => document.querySelector("[role=dialog]").innerText.match(/Slug:[\s\S]*?(?=Cancel)/)?.[0].replace(/\n+/g," | ")));
await page.getByRole("button", { name: /Edit slug/ }).click(); await settle(page, 400);
console.log("slug open:", await page.evaluate(() => { const d=document.querySelector("[role=dialog]"); const i=[...d.querySelectorAll("input")].filter(x=>x.offsetWidth>0).pop(); return { val: i.value, maxlength: i.maxLength, label: i.labels?.[0]?.innerText, desc: i.getAttribute("aria-describedby") && document.getElementById(i.getAttribute("aria-describedby").split(" ")[0])?.innerText, text: d.innerText.replace(/\n+/g," | ").slice(-260), focus: document.activeElement.id }; }));
await shot(page, "guides__create-slug-open__1440");
await page.keyboard.press("Escape"); await settle(page, 300); await page.keyboard.press("Escape"); await settle(page, 300);
console.log("dialogs left", await page.locator("[role=dialog],[role=alertdialog]").count());
fs.writeFileSync(new URL("./created.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), JSON.stringify(created));
await browser.close();
