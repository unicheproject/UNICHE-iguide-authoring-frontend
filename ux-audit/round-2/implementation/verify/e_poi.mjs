import { open, CMS, P, settle, here, attach } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const seed = JSON.parse(readFileSync(here + "/../../../tools/seed.json", "utf8"));
const id = (k, key) => seed[k].find((x) => x.key === key).id;
const base = `${CMS}/projects/${P}`;
const log = (...a) => console.log(...a);
const { browser, page } = await open("admin", { viewport: "1440" });
await page.goto(`${base}/pois`); await settle(page, 1200);
await page.getByRole("button", { name: /New point of interest/i }).first().click();
await page.getByLabel(/^Title/).first().fill("UX-R2-verify Empty POI");
await page.getByRole("button", { name: /Create and open/i }).click();
await page.waitForURL(/\/pois\/[0-9a-f-]{36}$/, { timeout: 15000 }); await settle(page, 2000);
log("created", page.url());
const h = () => page.evaluate(() => { const m = document.querySelector("main"); return { mainScroll: m.scrollHeight, docScroll: document.documentElement.scrollHeight, client: m.clientHeight }; });
log("empty DRAFT POI 1440", JSON.stringify(await h()));
await page.screenshot({ path: join(here, "shots", "1440-poi-empty-draft-full.png"), fullPage: true });
await page.goto(`${base}/pois/${id("pois","frieze")}`); await settle(page, 2000);
log("populated frieze 1440", JSON.stringify(await h()));
await page.goto(`${base}/pois/${id("pois","pediment")}`); await settle(page, 2000);
log("populated pediment (ACTIVE) 1440", JSON.stringify(await h()));
await page.goto(`${base}/pois/${id("pois","horsemen")}`); await settle(page, 2000);
log("populated horsemen (DRAFT) 1440", JSON.stringify(await h()));
// toast attempt on own POI: go back to own poi, type a title and save
await page.goBack().catch(()=>{});
await page.goto(`${base}/pois`); await settle(page, 1500);
await page.getByRole("searchbox").first().fill("UX-R2-verify"); await page.waitForTimeout(1200);
await page.getByRole("link", { name: /UX-R2-verify Empty POI/ }).first().click(); await settle(page, 1500);
await page.getByLabel(/^Title/).first().fill("UX-R2-verify Empty POI saved");
await page.keyboard.press("Control+s"); await page.waitForTimeout(1500);
const toasts = async (tag) => { const t = await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert],[data-toast],li[data-sonner-toast]")].map((e) => ({ role: e.getAttribute("role"), text: e.innerText.slice(0, 80), r: e.getBoundingClientRect().toJSON() }))); log("toast-probe", tag, JSON.stringify(t)); };
await toasts("after save");
await page.screenshot({ path: join(here, "shots", "1440-poi-own-after-save.png") });
// try Archive / Activate from header or status card
for (const re of [/^Activate/i, /^Archive/i]) {
  const b = page.getByRole("button", { name: re }).first();
  if (await b.count()) { await b.click().catch(()=>{}); await page.waitForTimeout(900); await page.screenshot({ path: join(here, "shots", `1440-poi-own-${re.source.replace(/\W/g,"")}.png`) }); await page.keyboard.press("Escape"); await page.waitForTimeout(400); }
}
await browser.close();
