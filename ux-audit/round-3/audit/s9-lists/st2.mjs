import { open, go, P, shot, settle, KINDS } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const API = "http://localhost:8080/iguide/api/v1";
const txt = () => page.locator("main").innerText().then(t => t.replace(/\n+/g, " | ").slice(0, 500));
// filtered empty
for (const k of KINDS) {
  await go(page, `/projects/${P}/${k}?q=zzzqqq`); await settle(page, 1800);
  console.log("== FEMPTY", k, await txt());
  console.log("   btns:", await page.evaluate(() => [...document.querySelectorAll("main button")].map(b => b.innerText.trim()).filter(Boolean)));
  if (k==="guides") await shot(page, `${k}__filtered-empty__1440`);
}
// loading (slow) for guides and pois
const h = async (route) => { await new Promise(r => setTimeout(r, 6000)); await route.continue(); };
for (const k of ["guides","places"]) {
  const fn = (u) => u.toString().startsWith(API) && new RegExp(`/projects/${P}/${k}(\\?|$)`).test(u.toString());
  await page.route(fn, h);
  await page.goto(`http://localhost:5173/projects/${P}/${k}`); await settle(page, 2500);
  console.log("== LOADING", k, await txt());
  console.log("   busy:", await page.evaluate(() => [...document.querySelectorAll("[aria-busy=true]")].length), "skeletons", await page.evaluate(() => document.querySelectorAll(".skeleton,[class*=skeleton],[class*=animate-pulse]").length), "status", await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map(e=>e.textContent.trim()).filter(Boolean)));
  await shot(page, `${k}__loading__1440`);
  await page.unroute(fn, h); await settle(page, 5000);
}
await browser.close();
