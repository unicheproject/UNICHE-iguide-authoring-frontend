import { open, go, CMS, VIEWPORTS } from "../../../../tools/session.mjs";
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5", POI="1e3e76c9-d9c2-48eb-8419-e54b7143180c";
const out="C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/implementation/P4/after/";
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await open("admin",{viewport:vp});
  await go(page,`/projects/${PID}/pois/${POI}`);
  await page.waitForSelector("[data-trigger-row]",{timeout:20000});
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const main=document.querySelector("main"); 
    const rows=[...document.querySelectorAll("[data-trigger-row]")].map(r=>{const b=r.getBoundingClientRect();return Math.round(b.height)});
    const card=document.querySelector("#triggers"); 
    return {mainScroll: main?.scrollHeight, doc: document.documentElement.scrollHeight, rows, card: Math.round(card.getBoundingClientRect().height)};
  });
  console.log(vp, JSON.stringify(m));
  await page.locator("#triggers").scrollIntoViewIfNeeded();
  await page.screenshot({path:out+`poi-triggers-collapsed__${vp}.png`});
  if (vp==="1440") {
    await page.screenshot({path:out+`poi-full__1440.png`,fullPage:true});
    // expand all
    for (const b of await page.getByRole("button",{name:/^Edit /}).all()) await b.click();
    const e = await page.evaluate(()=>({rows:[...document.querySelectorAll("[data-trigger-row]")].map(r=>Math.round(r.getBoundingClientRect().height)), main: document.querySelector("main").scrollHeight}));
    console.log("expanded",JSON.stringify(e));
    await page.locator("#triggers").scrollIntoViewIfNeeded();
    await page.screenshot({path:out+`poi-triggers-expanded__1440.png`});
  }
  await browser.close();
}
