import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
for (const vp of ["1280","1024","768","zoom200"]) {
  const s = await start(vp, { touch: vp==="768" }); const { page } = s;
  for (const [name, path] of [["maps-list", "/maps"], ["floorplans-list","/floor-plans"], ["mapeditor", `/maps/${ids.map}`], ["fpeditor", `/floor-plans/${ids.plan}`]]) {
    await go(page, P + path); await page.waitForTimeout(name==="mapeditor"?5000:2500);
    const ov = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
    console.log(vp, name, JSON.stringify(ov), ov.sw>ov.cw?"HSCROLL":"");
    await s.shot(name+"__top");
    if (name.endsWith("editor")) await s.shot(name+"__full", true);
  }
  await s.browser.close();
}
