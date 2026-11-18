import { open, go, P, seed, shot, settle } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
// new tab variants
const base = `/projects/${P}/app-preview`;
for (const q of ["?surface=mobile&lang=EL&mode=live", "?surface=BOGUS&lang=zz&mode=x", "?surface=KIOSK&real=1&orientation=landscape"]) {
  await go(page, base + q); await settle(page, 2500);
  console.log(q, "=>", page.url().split("app-preview")[1], "| title:", await page.title(), "|", (await page.locator("body").innerText()).slice(0, 220).replace(/\n/g, " | "));
  await shot(page, `newtab__${q.replace(/\W+/g, "_").slice(0, 30)}__1440`);
}
// QR code t=
const poi = seed.pois[0];
console.log("poi", poi.title, poi.id);
await go(page, `/projects/${P}/pois/${poi.id}`); await settle(page, 3000);
await shot(page, "poi-editor__full__1440");
const sec = page.locator("section", { hasText: "How visitors reach it" }).first();
console.log("triggers text:", (await sec.innerText()).slice(0, 1200).replace(/\n/g, " | "));
await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
await sec.screenshot({ path: "ux-audit/round-2/audit/p4-kiosk/shots/poi-triggers__card__1440.png" });
const link = await sec.locator("a[href*='t=']").first().getAttribute("href").catch(()=>null);
const txt = await sec.locator("input[readonly],code").first().textContent().catch(()=>null);
console.log("qr link", link, txt);
const links = await sec.locator("a").evaluateAll(a => a.map(x => x.textContent.trim() + " -> " + x.getAttribute("href")));
console.log("links", links);
console.log("buttons", await sec.getByRole("button").allTextContents());
const dl = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
await sec.getByRole("button", { name: /Download/ }).first().click().catch(()=>console.log("no download btn"));
const d = await dl; console.log("download", d && d.suggestedFilename());
await sec.getByRole("button", { name: /Copy/ }).first().click().catch(()=>{}); await page.waitForTimeout(500);
console.log("after copy status:", await page.locator("[role=status]").allTextContents());
await shot(page, "poi-triggers__after-copy__1440", false);
await browser.close();
