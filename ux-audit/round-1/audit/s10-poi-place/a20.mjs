import { start, goEd, P, poi, place, MINE } from "./common.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { AxeBuilder } = require("@axe-core/playwright");
const s = await start("1440"); const { page } = s;
for (const [k, path] of [["poi-wc", "/pois/"+poi("frieze").id], ["poi-draft", "/pois/"+MINE.poi2], ["place-outdoor", "/places/"+place("site").id], ["place-indoor", "/places/"+place("parthenon").id]]) {
  await goEd(page, path);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  console.log("AXE", k, r.violations.map(v=>`${v.id}(${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0,2).map(n=>n.target.join(" ").slice(0,60)).join("; ")}`));
}
await goEd(page, "/places/"+place("site").id);
// semantics of level cards
console.log("level cards:", await page.evaluate(()=>[...document.querySelectorAll("button")].filter(b=>/Top-level|Sub-place/.test(b.textContent)).map(b=>({role:b.getAttribute("role"), pressed:b.getAttribute("aria-pressed"), checked:b.getAttribute("aria-checked")}))));
// tab stops inside map
await page.locator("#f-lat").count();
// map tab count (place editor map)
const stops = await page.evaluate(()=>[...document.querySelectorAll("main .leaflet-container *")].filter(e=>e.tabIndex>=0).length);
console.log("focusable inside place map:", stops);
await goEd(page, "/pois/"+poi("frieze").id);
console.log("focusable inside poi map:", await page.evaluate(()=>[...document.querySelectorAll("main .leaflet-container *")].filter(e=>e.tabIndex>=0).length));
console.log("Choose buttons names:", await page.evaluate(()=>[...document.querySelectorAll("main button")].filter(b=>/^choose$/i.test(b.textContent.trim())).map(b=>b.getAttribute("aria-label")||"(none)")));
console.log("lang tablist:", await page.evaluate(()=>{const t=document.querySelector("[role=tablist]"); return t? [...t.querySelectorAll("[role=tab]")].map(x=>({sel:x.getAttribute("aria-selected"), ti:x.tabIndex})):null}));
await s.browser.close();
