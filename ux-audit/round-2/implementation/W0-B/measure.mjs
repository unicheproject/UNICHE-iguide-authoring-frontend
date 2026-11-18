// W0-B measurement: node measure.mjs <before|after> [viewports...]
import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const tag = process.argv[2] ?? "after";
const vps = process.argv.slice(3).length ? process.argv.slice(3) : ["1440", "1280", "zoom200"];
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const pages = {
  "poi-editor": `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`,
  "route-editor": `/projects/${P}/routes/9743e460-8351-4897-8ee5-eecc13fcbf19`,
  "category-editor": `/projects/${P}/categories/79aaf581-d009-4294-a11b-bf5a8fa980f3`,
  "poi-list": `/projects/${P}/pois`,
};
const out = {};
for (const vp of vps) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const [name, path] of Object.entries(pages)) {
    await go(page, path);
    await page.waitForSelector(name.endsWith("list") ? "thead th" : "[data-sticky-bar]", { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(1500);
    const key = `${name}@${vp}`;
    const m = await page.evaluate(async () => {
      const main = document.getElementById("main");
      const vh = window.innerHeight;
      const scroll = async (y) => { main.scrollTop = y; await new Promise((r) => setTimeout(r, 150)); };
      await scroll(600);
      // bottom edge of everything that is position: sticky and stuck at the top
      let stuckBottom = 0; const stuck = [];
      for (const el of main.querySelectorAll("[data-sticky-bar], thead th, [role=search]")) {
        const cs = getComputedStyle(el);
        if (cs.position !== "sticky") continue;
        const r = el.getBoundingClientRect();
        if (r.height && r.top < 200 && r.bottom > 0 && r.width > 100) { stuckBottom = Math.max(stuckBottom, r.bottom); stuck.push(`${el.tagName}.${(el.className||"").toString().slice(0,40)}:${Math.round(r.top)}-${Math.round(r.bottom)}`); }
      }
      const mainTop = main.getBoundingClientRect().top;
      const prop = getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h");
      const sp = getComputedStyle(main).scrollPaddingTop;
      await scroll(0);
      return { vh, mainTop, stuckBottom, stuckHeight: Math.round(stuckBottom - mainTop), pct: Math.round(((stuckBottom - mainTop) / vh) * 100), stuck, prop, scrollPadding: sp, scrollH: main.scrollHeight };
    });
    out[key] = m;
    await page.screenshot({ path: `${tag}/${name}-${vp}.png` });
    // Form share at top of editors: height of viewport not covered by stuck bars after scrolling
    if (name === "poi-editor") {
      // Tab through the form: focused field never under the stack
      await page.evaluate(() => { document.getElementById("main").scrollTop = 0; document.querySelector("h1")?.focus(); });
      const under = [];
      for (let i = 0; i < 70; i++) {
        await page.keyboard.press("Tab");
        const r = await page.evaluate(() => {
          const el = document.activeElement; if (!el || el === document.body) return null;
          const b = el.getBoundingClientRect();
          const stack = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h")) || 0;
          const mainTop = document.getElementById("main").getBoundingClientRect().top;
          const inMain = !!el.closest("main");
          return { inMain, top: Math.round(b.top - mainTop), stack, tag: el.tagName, id: el.id, sticky: !!el.closest("[data-sticky-bar]") };
        });
        if (r && r.inMain && !r.sticky && r.top < (r.stack || 0) - 1 && r.top > -2000) under.push(r);
      }
      out[key].tabUnderBar = under.length;
      out[key].tabUnderSample = under.slice(0, 3);
    }
  }
  await browser.close();
}
writeFileSync(`${tag}/measure-${tag}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
