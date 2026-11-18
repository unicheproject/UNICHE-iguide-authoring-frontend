import { open, go, shot, P, settle } from "./lib.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright").AxeBuilder;
const { browser, page } = await open("curator", { viewport: "1440" });
const axe=async(name)=>{ const r=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log("AXE",name, r.violations.map(v=>v.impact+":"+v.id+"x"+v.nodes.length).join(", ")||"clean"); };
// create dialogs per kind
for (const [k,label] of [["places",/new place/i],["pois",/new point/i],["routes",/new route/i],["guides",/new guide/i],["events",/new event/i],["categories",/new categor/i]]) {
  await go(page, `/projects/${P}/${k}`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1000);
  await page.getByRole("button",{name:label}).click(); await settle(page,500);
  const d=page.getByRole("dialog");
  console.log("CREATE",k,"|", (await d.innerText()).replace(/\n+/g," | ").slice(0,330));
  await shot(page,`${k}-create-dialog__1440`);
  if(k==="pois") await axe("poi-create-dialog");
  await page.keyboard.press("Escape");
}
await go(page, `/projects/${P}/pois`); await settle(page,1500); await axe("pois-list");
await go(page, `/projects/${P}/pois/061eca49-e97e-483a-b48f-3dff0d96a3cc`); await settle(page,2000); await axe("poi-editor");
await go(page, `/projects/${P}/media`); await settle(page,2000); await axe("media-grid");
await page.getByRole("button",{name:/^List$/}).click(); await settle(page,800); await shot(page,"media__list-view__1440"); await axe("media-list");
console.log("media list url", page.url());
// search through other language: Greek search in pois
await go(page, `/projects/${P}/pois?q=${encodeURIComponent("Παρθενώνας")}`); await settle(page,1500);
console.log("greek q rows", (await page.locator("main").innerText()).match(/Showing[^\n]*/)?.[0]);
await shot(page,"pois-list__greek-search__1440");
console.log((await page.locator("tbody tr").first().innerText().catch(()=>"none")).replace(/\s+/g," ").slice(0,200));
await browser.close();
