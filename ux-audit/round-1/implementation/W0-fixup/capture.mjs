import { createRequire } from "node:module";
import { open, go } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { default: AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const out = (n) => new URL(`./after/${n}.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const settle = (p) => p.waitForTimeout(2500);
async function links(page, path, sel) {
  await go(page, `/projects/${P}/${path}`); await settle(page);
  return page.locator(`main a[href*="/${path}/"]`).evaluateAll((as) => as.map((a) => a.getAttribute("href")).filter((h) => h && !/new/.test(h)));
}
const base = await open("curator", { viewport: "1440" });
const poi = (await links(base.page, "pois"))[0];
const asset = (await links(base.page, "media"))[0];
await base.browser.close();
console.log({ poi, asset });
const pages = { picker: "/", dashboard: `/projects/${P}`, list: `/projects/${P}/pois`, poi, asset, preview: `/projects/${P}/preview` };
for (const vp of ["1440", "768", "zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  for (const [name, href] of Object.entries(pages)) {
    await go(page, href); await settle(page);
    await page.screenshot({ path: out(`${name}__${vp}`) });
    if (vp === "zoom200" && (name === "poi" || name === "asset")) {
      await page.evaluate(() => { const m = document.getElementById("main"); if (m) m.scrollTop = 500; document.scrollingElement.scrollTop = 500; });
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => { const m = document.getElementById("main"); const h = document.querySelector("#main h1"); return { mainScrolls: m.scrollHeight > m.clientHeight, mainTop: m.scrollTop, docTop: document.scrollingElement.scrollTop, h1y: Math.round(h?.getBoundingClientRect().y ?? -1) }; });
      console.log(name, "zoom200 scrolled", r);
      await page.screenshot({ path: out(`${name}-scrolled__${vp}`) });
    }
    if (vp === "1440") {
      const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
      console.log("axe", name, res.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "none");
    }
  }
  await browser.close();
}
