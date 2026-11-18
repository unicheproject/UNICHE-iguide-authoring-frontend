import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
const icon = () => page.evaluate(() => [...document.querySelectorAll("button")].filter(b => b.offsetParent && !(b.textContent||"").trim()).map(b => { const r=b.getBoundingClientRect(); return [b.getAttribute("aria-label")||"?", Math.round(r.width), Math.round(r.height)]; }));
await go(page, `/projects/${P}/pois`);
await page.waitForSelector("main h1");
console.log("POI list icon buttons", JSON.stringify(await icon()));
const link = await page.locator("main a[href*='/pois/']").first().getAttribute("href");
console.log("first poi link", link);
await go(page, link);
await page.waitForSelector("main h1");
await page.waitForTimeout(1500);
console.log("POI editor icon buttons", JSON.stringify(await icon()));
// reload tests
for (let i = 1; i <= 4; i++) {
  await page.goto(`http://localhost:5173/projects/${P}/pois`);
  const t0 = Date.now();
  await page.waitForSelector("main h1");
  const title0 = await page.title();
  let chip = null;
  for (let k = 0; k < 40; k++) { chip = await page.evaluate(() => { const b=[...document.querySelectorAll("header button")].find(x=>/Switch project/.test(x.textContent||"")); return b ? b.innerText.replace(/\n/g," | ") : null; }); if (chip && /App:/.test(chip)) break; await page.waitForTimeout(250); }
  console.log(`reload ${i}: title0="${title0}" final="${await page.title()}" chip="${chip}" t=${Date.now()-t0}ms`);
}
// 404
await page.goto("http://localhost:5173/projects/not-a-uuid");
await page.waitForSelector("main h1");
console.log("404:", await page.title(), "| focus:", await page.evaluate(() => document.activeElement?.tagName + ":" + document.activeElement?.textContent));
await page.goto(`http://localhost:5173/projects/${P}/nonsense`);
await page.waitForSelector("main h1");
console.log("project 404:", await page.title(), "| focus:", await page.evaluate(() => document.activeElement?.tagName + ":" + document.activeElement?.textContent));
await page.screenshot({ path: "after/notfound__1440.png" });
await browser.close();
