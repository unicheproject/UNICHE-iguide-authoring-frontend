import { start, go, P, focusInfo, tabWalk, tabTo, live, axe, seed } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const r = (x)=>x[0].id;
const routes = {
 "place-editor": `/places/${seed.places[1].id}`, "route-editor": `/routes/${seed.routes[0].id}`, "guide-editor": `/guides/${seed.guides[0].id}`,
 "event-editor": `/events/${seed.events[0].id}`, "category-editor": `/categories/${seed.categories[0].id}`, "map-editor": `/maps/${seed.maps[0].id}`,
 "floorplan-editor-existing": `/floor-plans/${seed.floorPlans[0].id}`, "asset-editor": `/media/${seed.assets[0].id}`, "navigation": "/navigation", "translations":"/translations",
};
const all=[]; const info={};
for (const [k,pth] of Object.entries(routes)) {
  await go(page, P + pth); await page.getByRole("heading",{level:1}).first().waitFor({timeout:15000}).catch(()=>{}); await page.waitForTimeout(2500);
  const v = await axe(page,k); all.push(...v);
  info[k] = await page.evaluate(()=>({h:[...document.querySelectorAll("h1,h2,h3,h4")].map(h=>h.tagName[1]).join(""), lm:[...document.querySelectorAll("main,nav,aside,[role=region]")].length, active: document.activeElement.tagName, title: document.title}));
  await s.shot("axe__"+k);
  console.log(k, JSON.stringify(info[k]), v.map(x=>x.id+":"+x.impact+":"+x.nodes+" "+x.sample[0]?.slice(0,200)).join(" || "));
}
s.save("scan2.json",{all,info});
await s.browser.close();
