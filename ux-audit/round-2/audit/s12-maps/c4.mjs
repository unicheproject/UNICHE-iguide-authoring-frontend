import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const PLAN = "3b81f75c-3a3e-45a2-9676-89f1d283457b";
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1280" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/floor-plans/${PLAN}`);
  await page.waitForTimeout(1500);
  const btn = page.getByRole("button", { name: "Place East Pediment Fragments on the plan" });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(400);
  console.log("btn visible text", await btn.innerText(), "aria-pressed", await btn.getAttribute("aria-label"));
  const banner = page.locator("[role=status]").filter({hasText:/the plan to place/});
  console.log("banner", await banner.allInnerTexts(), JSON.stringify(await banner.first().boundingBox()));
  const plane = page.locator("[data-plane], .cursor-crosshair").first();
  await plane.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(page, "plan-editor__armed", "1280");
  console.log("banner covers plan top?", await page.evaluate(()=>{const b=[...document.querySelectorAll("[role=status]")].find(e=>/to place/.test(e.textContent)); const p=document.querySelector(".cursor-crosshair"); if(!b||!p) return "n/a"; const rb=b.getBoundingClientRect(), rp=p.getBoundingClientRect(); return JSON.stringify({banner:[rb.top,rb.bottom],plane:[rp.top,rp.bottom,rp.height],vh:innerHeight})}));
  const pb = await plane.boundingBox();
  await page.mouse.click(pb.x+pb.width*0.3, pb.y+pb.height*0.4);
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Place Rampin Rider on the plan" }).click();
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  console.log("after Esc banner", await banner.count());
  // fan-out for 3 more via keyboard Enter on button? use 'Place near centre' if exists
  console.log("placed text", (await t(page,"#placed")).slice(0,700).replace(/\n+/g," | "));
  console.log("fields", await page.locator("#placed input").evaluateAll(es=>es.map(e=>e.getAttribute("aria-label")+"="+e.value)));
  // invalid x
  await page.locator("#pos-0-x").fill("1,5"); await page.locator("#pos-0-x").blur();
  await page.getByRole("button",{name:"Save",exact:true}).click(); await page.waitForTimeout(1200);
  console.log("errs", JSON.stringify(await page.locator("[role=alert]").allInnerTexts()));
  await shot(page, "plan-editor__x-invalid", "1280");
  await page.locator("#pos-0-x").fill("0,25"); await page.locator("#pos-0-y").fill("abc"); await page.locator("#pos-0-y").blur();
  await page.getByRole("button",{name:"Save",exact:true}).click(); await page.waitForTimeout(1200);
  console.log("errs2", JSON.stringify(await page.locator("[role=alert]").allInnerTexts()));
  await page.locator("#pos-0-y").fill("0.5");
  await page.getByRole("button",{name:"Save",exact:true}).click(); await page.waitForTimeout(1500);
  await shot(page, "plan-editor__saved-pins", "1280", true);
  // search unplaced
  await page.locator("#unplaced-search").fill("kore"); await page.waitForTimeout(300);
  console.log("search kore", await page.locator("#placed li").count());
  await browser.close();
});
