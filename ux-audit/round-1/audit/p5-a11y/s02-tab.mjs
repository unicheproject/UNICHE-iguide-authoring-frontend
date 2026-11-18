import { start, go, P, tabWalk } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/pois"); await page.waitForTimeout(1500);
const w = await tabWalk(page, 70);
s.save("tab-pois.json", w);
w.forEach((x,i)=>console.log(i+1, x.tag, x.role, x.name, "|", x.ring.slice(0,40), x.w+"x"+x.h, x.vis?"":"OFFSCREEN"));
await s.browser.close();
