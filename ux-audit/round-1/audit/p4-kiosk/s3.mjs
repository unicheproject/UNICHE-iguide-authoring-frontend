import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
const FRIEZE = "546c5177-effd-49c8-acae-85d751f89bbe", NEIGH="a12564e2-1d45-4441-b421-ef3497979ef6", LIONS="00ee3bc2-afdb-4931-a515-03b96a76b7a4";
const { browser, context, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${FRIEZE}`); await page.waitForTimeout(2000);
await shot(page, "poi-frieze__top__1440", true);
const card = page.locator("section,div").filter({ has: page.getByText("How visitors reach it", {exact:false}) }).last();
await page.getByText("How visitors reach it").first().scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
await shot(page, "poi-frieze__reach__1440");
log("buttons", await page.getByRole("button").allTextContents().then(a=>a.map(s=>s.trim()).filter(Boolean).join(" | ")));
for (const n of ["Copy link","Download PNG","Open"]) { log(n, await page.getByRole("button",{name:n}).count(), await page.getByRole("link",{name:n}).count()); }
await page.getByRole("button",{name:"Copy link"}).first().click().catch(e=>log("copy err", e.message.slice(0,80))); await page.waitForTimeout(500); await shot(page, "poi-frieze__copied__1440");
const dl = page.waitForEvent("download",{timeout:5000}).catch(()=>null);
await page.getByRole("button",{name:/Download PNG/}).first().click().catch(()=>{}); const d = await dl; log("download", d && d.suggestedFilename());
log("img", await page.locator("img[alt*=QR i]").evaluateAll(a=>a.map(i=>[i.alt,i.naturalWidth,i.getBoundingClientRect().width])));
log("hrefs", await page.locator("a[href*=app-preview]").evaluateAll(a=>a.map(x=>[x.textContent.trim(),x.href,x.target])));
// Preview in app
await page.getByRole("button",{name:/Preview in app/}).first().click(); await page.waitForTimeout(1200);
await shot(page, "poi-frieze__preview-in-app__1440", true);
log("preview buttons", await page.getByRole("button").allTextContents().then(a=>a.map(s=>s.trim()).filter(Boolean).join(" | ")));
await go(page, `/projects/${P}/pois/${NEIGH}`); await page.waitForTimeout(2000);
await page.getByText("How visitors reach it").first().scrollIntoViewIfNeeded(); await shot(page, "poi-neigh-beacon__reach__1440");
await go(page, `/projects/${P}/pois/${LIONS}`); await page.waitForTimeout(2000);
await page.getByText("How visitors reach it").first().scrollIntoViewIfNeeded(); await shot(page, "poi-lions-geo__reach__1440");
await browser.close();
