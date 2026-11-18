import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url.replace("ux-audit/round-2/implementation/P7b/editor.mjs","package.json"));
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", A = "6cd2aef3-e6b4-4adf-a2bf-7f4121090093";
const out = "ux-audit/round-2/implementation/P7b/after/";
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/media/${A}`);
  await page.waitForSelector("textarea[data-path]", { timeout: 30000 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const t = document.querySelector("textarea[data-path]");
    const r = t.getBoundingClientRect();
    const stuck = [...document.querySelectorAll("*")].filter(e => getComputedStyle(e).position === "sticky").map(e => { const b = e.getBoundingClientRect(); return `${e.tagName}.${(e.className+"").slice(0,30)} h${Math.round(b.height)}`; });
    return { altTop: Math.round(r.top), altBottom: Math.round(r.bottom), vh: innerHeight, sticky: stuck.slice(0,5), ready: document.body.innerText.match(/Before you activate[\s\S]{0,200}/)?.[0]?.replace(/\n+/g," | "), trans: document.body.innerText.includes("Next missing") };
  });
  console.log(vp, JSON.stringify(m));
  await page.screenshot({ path: `${out}editor-${vp}.png` });
  if (vp === "1024" || vp==="zoom200") {
    const ax = await new AxeBuilder({ page }).analyze();
    console.log(vp, "axe", ax.violations.filter(v=>["serious","critical"].includes(v.impact)).map(v=>v.id+":"+v.nodes.length));
  }
  await browser.close();
}
