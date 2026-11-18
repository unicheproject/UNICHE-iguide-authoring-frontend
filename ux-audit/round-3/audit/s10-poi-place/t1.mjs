import { open, go, settle, path } from "./lib2.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright").AxeBuilder;
for (const vp of ["1440","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  try {
    for (const k of ["poiB","poiA","place"]) {
      await go(page, path(k)); await settle(page,2000);
      const r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
      console.log(vp,k,"violations:",r.violations.map(v=>v.id+"("+v.impact+")x"+v.nodes.length+" "+v.nodes[0].target.join(" ").slice(0,60)).join(" ; ")||"none");
    }
    await go(page, path("poiB")); await settle(page,1500);
    await page.getByRole("button",{name:/Deactivate/}).first().click(); await settle(page,900);
    const r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze(); console.log(vp,"deactivate dialog:", r.violations.map(v=>v.id+"x"+v.nodes.length).join(",")||"none");
    console.log(vp, "DEACT DLG:", (await page.getByRole("dialog").innerText()).replace(/\n+/g," / ").slice(0,500));
  } finally { await browser.close(); }
}
