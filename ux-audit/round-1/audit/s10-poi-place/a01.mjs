import { start, go, goEd, P, poi, place } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const targets = { "poi-active-wc": `/pois/${poi("frieze").id}`, "poi-draft": `/pois/${poi("horsemen").id}`, "poi-archived": `/pois/${poi("copies").id}`, "poi-active": `/pois/${poi("pediment").id}`,
 "place-active-outdoor": `/places/${place("site").id}`, "place-indoor-plan": `/places/${place("parthenon").id}`, "place-draft": `/places/${place("gf").id}`, "place-parent": `/places/${place("museum").id}` };
for (const [k, path] of Object.entries(targets)) {
  await goEd(page, path);
  const m = await page.evaluate(() => { const main = document.querySelector("main"); return { scrollH: main.scrollHeight, clientH: main.clientHeight, docH: document.documentElement.scrollHeight,
    h2: [...main.querySelectorAll("h2,h3")].map(h => ({t: h.textContent.trim().slice(0,50), y: Math.round(h.getBoundingClientRect().top + main.scrollTop - main.getBoundingClientRect().top)})) }; });
  console.log(k, JSON.stringify(m));
  await s.shot(k + "__top"); 
  await page.screenshot({ path: s.constructor && (new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")) + `${k}__full__1440.png` });
}
await s.browser.close();
