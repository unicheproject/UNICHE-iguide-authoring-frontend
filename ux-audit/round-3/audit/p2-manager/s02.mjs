import { open, go } from "../../../tools/session.mjs";
import { shot, text } from "./lib.mjs";
for (const vp of ["1440","1280","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, "/");
  await page.waitForTimeout(1200);
  await shot(page, `home__list__${vp}`);
  console.log(vp, "home url", page.url(), "scrollW", await page.evaluate(()=>[document.documentElement.scrollWidth, innerWidth]));
  if (vp === "1440") {
    const r = await page.evaluate(() => { const o = {}; for (const s of ["h1","input[type=search],input[placeholder*=Search]"]) { const e=document.querySelector(s); if(e){const b=e.getBoundingClientRect(); o[s]=[b.x,b.y,b.width,b.height]}} return o;});
    console.log(JSON.stringify(r));
    // Open groups
    const grp = page.getByRole("button", { name: /Needs setup/ });
    console.log("needs setup grp", await grp.count());
    await grp.first().click().catch(()=>{});
    await page.waitForTimeout(1500);
    await shot(page, "home__needs-setup-open__1440");
    console.log("NEEDS SETUP TEXT\n", (await text(page)).slice(0,1800));
  }
  // switcher
  await page.getByRole("button", { name: /choose a project|switch project|UX Audit/i }).first().click().catch(e=>console.log("sw click fail"));
  await page.waitForTimeout(1500);
  await shot(page, `switcher__open__${vp}`);
  if (vp === "1440") {
    console.log("SWITCHER TEXT\n", await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText.slice(0,1500)));
    console.log("dialog name", await page.evaluate(()=>{const d=document.querySelector("[role=dialog]"); return d && (d.getAttribute("aria-label")||d.getAttribute("aria-labelledby"))}));
  }
  await browser.close();
}
