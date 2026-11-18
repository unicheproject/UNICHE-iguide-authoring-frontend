import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
const kinds = [["pois","New point of interest","#poi-title"],["routes","New route",null],["guides","New guide",null],["events","New event",null],["categories","New category",null],["places","New place",null]];
for (const [seg, btn, tsel] of kinds) {
  await page.unrouteAll({behavior:"ignoreErrors"});
  await go(page, `/projects/${P}/${seg}`); await page.waitForTimeout(800);
  let posts = 0;
  await page.route("**/iguide/api/v1/**", async (route) => { if (route.request().method()==="POST") { posts++; await new Promise(r=>setTimeout(r,6000)); } return route.continue(); });
  await page.getByRole("button",{name:new RegExp(btn,"i")}).first().click(); await page.waitForTimeout(500);
  const dlg = page.locator("[role=dialog]").first();
  log(`\n=== ${seg} dialog fields:`, await dlg.locator("input:visible,select:visible,textarea:visible").evaluateAll(e=>e.map(x=>`${x.tagName}#${x.id}:${x.type}`)), "focus", await focused(page));
  // empty submit
  await dlg.getByRole("button",{name:/^create|^add/i}).last().click(); await page.waitForTimeout(500);
  log("empty-submit alerts", await alerts(page), "focus", await focused(page));
  await shot(page, `create-${seg}__empty__1440`);
  const first = dlg.locator("input:visible").first(); await first.fill(`UX-p6-edge dup ${seg}`); 
  await page.waitForTimeout(200);
  await first.press("Enter"); await first.press("Enter").catch(()=>{});
  await dlg.getByRole("button",{name:/creat|add/i}).last().click({force:true,timeout:800}).catch(()=>{});
  await page.waitForTimeout(700);
  log("mid-flight buttons", (await dlg.getByRole("button").allTextContents()).map(s=>s.trim()), "POSTs", posts, "alerts", await alerts(page));
  await shot(page, `create-${seg}__slow__1440`);
  // Esc while busy
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  log("dialog after Esc while busy:", await page.locator("[role=dialog]").count());
  await page.waitForTimeout(7000);
  log("final POSTs", posts, "url", page.url().replace(/.*5173/,""), "alerts", await alerts(page));
}
await browser.close();
