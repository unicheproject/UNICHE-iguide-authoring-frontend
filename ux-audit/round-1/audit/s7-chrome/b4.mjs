import { open, go, shot, log, P, focused, VIEWPORTS, chromium } from "./lib.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { AxeBuilder } = require("@axe-core/playwright");
const { browser, page } = await open("admin", { viewport: "1440" });
async function axe(name){ const r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); log("AXE", name, r.violations.map(v=>`${v.id}(${v.impact}) x${v.nodes.length}`).join("; ")||"clean"); }
await go(page, "/"); await page.waitForSelector("main ul li",{timeout:60000}); await page.waitForTimeout(800);
await axe("home");
for (const vp of ["1280","1024","768","zoom200"]) { await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height}); await page.waitForTimeout(400); await shot(page, `home__list__${vp}`); log(vp, await page.evaluate(()=>document.documentElement.scrollWidth)); }
await page.setViewportSize({width:1440,height:900});
await go(page, `/projects/${P}`); await page.waitForSelector("nav#workspace-nav",{timeout:60000}); await page.waitForTimeout(1500);
await axe("dashboard-chrome");
await page.locator("header button[aria-controls=project-switcher-menu]").click(); await page.waitForTimeout(300); await axe("picker-open");
// picker keyboard: arrow? type to search?
await page.keyboard.type("Pop"); await page.waitForTimeout(200); log("typeahead focus", await focused(page));
await page.keyboard.press("Escape");
await go(page, "/projects/new"); await page.waitForSelector("#project-name",{timeout:60000}); await axe("create-step1");
// contrast of tiny type sizes
log("min font sizes", JSON.stringify(await page.evaluate(()=>{const s={};document.querySelectorAll("body *").forEach(e=>{if(!e.childNodes.length)return; const t=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!t)return; const f=parseFloat(getComputedStyle(e).fontSize); s[f]=(s[f]||0)+1;}); return s;})));
await browser.close();
