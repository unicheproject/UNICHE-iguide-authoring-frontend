import { start, go, P } from "./common.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { default: AxeBuilder } = require("@axe-core/playwright");
const s = await start("1440"); const { page } = s;
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr"); await page.waitForTimeout(500);
const search = page.locator("input[type=search]");
await search.fill("103"); await page.waitForTimeout(300); console.log("code 103 rows", await page.locator("tbody tr").count());
await search.fill("");
for (const k of ["places","pois","routes","guides","events","categories"]) {
  await go(page, `${P}/${k}`); await page.waitForSelector("tbody tr"); await page.waitForTimeout(400);
  const r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
  console.log(k,"AXE", r.violations.map(v=>`${v.id}(${v.nodes.length}) ${v.impact}`).join("; ")||"clean");
}
// reorder with mocked PUT
await go(page, `${P}/guides`); await page.waitForSelector("tbody tr");
let put=null; await page.route(/:8080\/.*:order/, r=>{ put=r.request().postData(); r.fulfill({status:204}); });
const down = page.getByRole("button",{name:/^Move .* down$/}).first();
await down.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log("PUT body", put?.slice(0,120), "| live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.innerText).join("|")), "| focus:", await page.evaluate(()=>document.activeElement.getAttribute("aria-label")));
await s.shot("guides__reorder-after-move-down");
await page.unrouteAll({behavior:"ignoreErrors"});
// drag handle attributes
console.log("handle", await page.evaluate(()=>{const h=document.querySelector("tbody tr span[draggable]"); return h? {aria:h.getAttribute("aria-hidden"), draggable:h.draggable, w:h.getBoundingClientRect().width,h:h.getBoundingClientRect().height, tab:h.tabIndex}:null}));
// row click target: click non-link area
await go(page, `${P}/guides`); await page.waitForSelector("tbody tr");
const before=page.url(); await page.locator("tbody tr").nth(1).locator("td").nth(2).click(); await page.waitForTimeout(500);
console.log("click status cell navigates?", page.url()!==before);
// focus visible ring on title link
await page.locator("tbody tr a").first().focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
await s.shot("guides__focus-title-link");
await s.browser.close();
