import { start, go, P, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const routes = ["", "/places", "/pois", "/routes", "/guides", "/events", "/categories", "/media", "/maps", "/floor-plans", "/preview"];
const all = []; const info = {};
for (const r of routes) {
  await go(page, P + r); await page.waitForTimeout(1500);
  const v = await axe(page, r || "dashboard"); all.push(...v);
  info[r||"dashboard"] = await page.evaluate(() => ({
    title: document.title,
    landmarks: [...document.querySelectorAll("header,nav,main,aside,footer,[role=banner],[role=navigation],[role=main],[role=search],[role=complementary],[role=region]")].map(e => e.tagName + (e.getAttribute("role")?"[" + e.getAttribute("role") + "]":"") + (e.getAttribute("aria-label")? ":" + e.getAttribute("aria-label"):"")),
    headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]")].map(h => h.tagName + ":" + h.textContent.trim().slice(0,40)),
    live: [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => (e.getAttribute("role")||"") + "/" + e.getAttribute("aria-live") + ":" + e.textContent.trim().slice(0,60)),
    skip: [...document.querySelectorAll("a")].filter(a => /skip/i.test(a.textContent)).map(a => a.textContent + a.getAttribute("href")),
    activeEl: document.activeElement?.tagName + "." + (document.activeElement?.className||"").toString().slice(0,40),
  }));
  await s.shot("scan__" + (r.replace("/","")||"dashboard"));
}
s.save("scan.json", { info, all });
const by = {}; for (const v of all) by[v.impact] = (by[v.impact]||0) + v.nodes;
console.log(JSON.stringify(by)); console.log(all.map(v => `${v.label} ${v.impact} ${v.id} x${v.nodes}`).join("\n"));
await s.browser.close();
