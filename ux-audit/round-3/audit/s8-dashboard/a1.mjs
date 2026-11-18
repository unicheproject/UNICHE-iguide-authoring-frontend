import { open, go, shot, settle, measure, dash, P, B, T, D } from "./h.mjs";
import { writeFileSync } from "node:fs";
const out = {};
for (const vp of ["1440","1280","1024","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const [name, id] of [["pop", P], ["draftsB", B], ["trail", T]]) {
    await go(page, dash(id)); await settle(page, 2500);
    await shot(page, `dashboard-${name}__populated__${vp}`);
    out[`${name}-${vp}`] = await measure(page);
  }
  await browser.close();
}
writeFileSync(new URL("./a1.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), JSON.stringify(out, null, 1));
console.log("done");
