import { open, go, P, OUT } from "./lib.mjs";
for (const vp of ["1440", "1024"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await page.route((u) => u.toString().includes(`/projects/${P.pop}/settings`), async (r) => { await new Promise((x) => setTimeout(x, 4000)); await r.continue(); });
  await go(page, "/"); await page.goto(`http://localhost:5173/projects/${P.pop}`, { waitUntil: "commit" });
  const h = () => page.evaluate(() => ({ h1: Math.round(document.querySelector("main h1")?.getBoundingClientRect().y), sub: Math.round(document.querySelector("main h1").closest(".mb-6").getBoundingClientRect().height), first: Math.round(document.querySelector("[data-testid=dashboard-skeleton],[aria-labelledby=status-title]")?.getBoundingClientRect().y), sk: !!document.querySelector("[data-testid=dashboard-skeleton]") }));
  await page.waitForSelector("[data-testid=dashboard-skeleton]", { timeout: 8000 });
  const a = await h(); await page.screenshot({ path: `${OUT}loading-${vp}.png` });
  await page.waitForSelector("[aria-labelledby=status-title]", { timeout: 15000 }); await page.waitForTimeout(300);
  console.log(vp, "skeleton", JSON.stringify(a), "loaded", JSON.stringify(await h()));
  await browser.close();
}
