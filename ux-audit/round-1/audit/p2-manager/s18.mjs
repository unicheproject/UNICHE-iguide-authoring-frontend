import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright").AxeBuilder;
const P="/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5", E="/projects/65f8958a-144a-46fe-851b-f1176b2a597e";
const { browser, page } = await open("admin", { viewport: "1280" });
async function axe(name){ const r=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log("AXE",name, r.violations.map(v=>v.id+"("+v.nodes.length+"):"+v.nodes[0].target.join(" ").slice(0,60)).join("; ")||"clean"); }
for (const [n,p] of [["home","/"],["create","/projects/new"],["dash-pop",P],["dash-empty",E],["places-empty",E+"/places"],["pois-list",E+"/pois"]]) { await go(page,p); await page.waitForTimeout(1800); await axe(n); }
await go(page, "/"); await page.waitForTimeout(1200);
await page.getByRole("button",{name:/select a project/i}).click(); await page.waitForTimeout(400); await axe("switcher-open");
await page.keyboard.press("ArrowDown"); console.log("arrowdown focus:", await page.evaluate(()=>document.activeElement?.textContent?.slice(0,40)));
await page.keyboard.press("Escape"); await page.waitForTimeout(200);
console.log("esc focus:", await page.evaluate(()=>document.activeElement?.textContent?.slice(0,40)));
console.log("switcher aria:", await page.getByRole("button",{name:/select a project/i}).evaluate(e=>[e.getAttribute("aria-expanded"),e.getAttribute("aria-haspopup"),e.getAttribute("aria-controls")]));
await browser.close();
// zoom200
const z = await open("admin", { viewport: "zoom200" });
for (const [n,p] of [["create","/projects/new?resume=ef9a58e0-8f16-45a4-93ff-ab6590ddfc37"],["dash-pop",P],["home","/"]]) { await go(z.page,p); await z.page.waitForTimeout(1800); await z.page.screenshot({path:`ux-audit/round-1/audit/p2-manager/shots/${n}__zoom200__zoom200.png`}); }
await z.page.getByRole("button",{name:/select a project|UX/i}).first().click().catch(()=>{}); await z.page.waitForTimeout(400);
await z.page.screenshot({path:`ux-audit/round-1/audit/p2-manager/shots/switcher__zoom200__zoom200.png`});
await z.browser.close();
