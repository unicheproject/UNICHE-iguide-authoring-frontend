import { start, go, P } from "./common.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { default: AxeBuilder } = require("@axe-core/playwright");
const s = await start("1440"); const { page } = s;
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr"); await page.waitForTimeout(500);
const r = await new AxeBuilder({page}).withTags(["wcag2aa","wcag22aa"]).analyze();
for (const v of r.violations) for (const n of v.nodes.slice(0,3)) console.log(v.id, n.target.join(" "), (n.any[0]?.message||"").slice(0,160));
await s.browser.close();
