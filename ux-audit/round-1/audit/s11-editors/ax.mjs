import { start, log, state } from "./lib.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { AxeBuilder } = require("@axe-core/playwright");
const s = await start("1440"); const { page } = s;
for (const [k, u] of [["route", state().routeUrl], ["guide", state().guideUrl], ["event", state().eventUrl], ["category", state().catUrl]]) {
  await page.goto("http://localhost:5173" + u); await page.locator("main h1").first().waitFor({timeout:40000}).catch(()=>{}); await page.waitForTimeout(3000);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  log("AXE", k, r.violations.length);
  for (const v of r.violations) log("  ", v.id, v.impact, v.nodes.length, v.nodes.slice(0,2).map(n=>n.target.join(" ").slice(0,90)).join(" | "));
}
await s.browser.close();
