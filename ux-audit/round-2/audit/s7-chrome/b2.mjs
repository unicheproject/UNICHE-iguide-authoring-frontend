import { open, go, shot, run, POP, EMPTY_D, EMPTY_B, AP, CMS } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await open("curator", { viewport: "1440" });
  const chip = () => page.evaluate(()=>{const h=document.querySelector("header"); if(!h) return "noheader"; if(h.querySelector(".animate-skeleton")) return "SKELETON"; const m=h.innerText.match(/App: \w+/); return m?m[0]:"nochip";});
  for (const [n,id] of [["POP",POP],["EMPTY_D",EMPTY_D],["EMPTY_B",EMPTY_B],["EMPTY_C","ceee1b24-e7c4-474e-93ba-f77067ed8a72"]]) {
    const out=[]; for (let i=0;i<4;i++){ await page.goto(CMS+`/projects/${id}/dashboard`); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2500); out.push(await chip()); }
    // via picker click (in-app)
    await go(page,"/"); await page.waitForTimeout(1500);
    console.log(n, "deep-link x4:", out.join(","));
  }
  // in-app: open switcher, choose Empty D
  await go(page, `/projects/${POP}/dashboard`); await page.waitForTimeout(1500);
  await page.locator("header button[aria-haspopup]").first().click(); await page.waitForTimeout(800);
  await page.getByPlaceholder(/search/i).fill("Empty D"); await page.waitForTimeout(500);
  await shot(page,"switcher__search-empty-d","1440");
  await page.getByRole("option").first().click().catch(async()=>{ await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); });
  await page.waitForTimeout(3000); console.log("EMPTY_D via switcher:", await chip(), page.url());
  await browser.close();
});
