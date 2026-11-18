import * as H from "./h.mjs";
const log = H.LOG("a1"); const vp = process.argv[2] || "1440";
const { browser, page } = await H.session({ viewport: vp });
const S = H.seed; const res = [];
const poi = (k) => S.pois.find((p) => p.key === k).id;
const routes = [
 ["dashboard", ""], ["places", "/places"], ["pois", "/pois"], ["routes", "/routes"], ["guides", "/guides"], ["events", "/events"], ["categories", "/categories"], ["maps", "/maps"], ["floorplans", "/floor-plans"], ["media", "/media"], ["preview", "/preview"],
 ["poi-active-wc", `/pois/${poi("frieze")}`], ["poi-draft", `/pois/${poi("horsemen")}`], ["place", `/places/${S.places[1].id}`], ["route", `/routes/${S.routes[0].id}`], ["guide", `/guides/${S.guides[0].id}`], ["event", `/events/${S.events[0].id}`], ["category", `/categories/${S.categories[0].id}`],
 ["map", `/maps/${S.maps[0].id}`], ["floorplan", `/floor-plans/${S.floorPlans[0].id}`], ["asset", `/media/${S.assets[0].id}`],
 ["oos-overview", "/overview"], ["oos-languages", "/languages"], ["oos-surfaces", "/surfaces"], ["oos-translations", "/translations"], ["oos-navigation", "/navigation"], ["oos-pages", "/pages"], ["oos-launch", "/launch"], ["oos-audit", "/audit-log"],
];
for (const [name, path] of routes) {
  try {
    await H.go(page, H.P(path)); await H.sleep(2500);
    const v = await H.axe(page, name, res);
    log(vp, name, "title=", await page.title(), "h1=", await page.locator("h1").first().innerText().catch(() => "none"), "viol=", JSON.stringify(v));
    if (name.startsWith("oos-")) await H.shot(page, `${name}__render__${vp}`);
  } catch (e) { log(vp, name, "ERR", e.message.slice(0, 200)); }
}
for (const [name, path] of [["home", "/"], ["create-project", "/projects/new"], ["notfound", "/nope/zzz"], ["project404", "/projects/00000000-0000-4000-8000-000000000000/pois"], ["app-preview", `/projects/${H.PID}/app-preview`]]) {
  try { await H.go(page, path); await H.sleep(2500); const v = await H.axe(page, name, res); log(vp, name, "title=", await page.title(), "viol=", JSON.stringify(v)); } catch (e) { log(vp, name, "ERR", e.message.slice(0, 200)); }
}
H.dump(`axe-routes-${vp}.json`, res);
await browser.close();
