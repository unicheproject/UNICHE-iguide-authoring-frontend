import { start, log, state } from "./lib.mjs";
for (const vp of ["1024","768","zoom200"]) {
  const s = await start(vp); const { page } = s;
  await page.goto("http://localhost:5173" + state().routeUrl);
  await page.locator("main h1").first().waitFor({timeout:40000}).catch(()=>{}); await page.waitForTimeout(2500);
  const r = await page.evaluate(() => { const m = document.querySelector("main"); const q = t => [...document.querySelectorAll("h2,h3,section,div")].find(e => e.children.length && e.firstElementChild && /^(status and visibility)$/i.test(e.firstElementChild.textContent.trim())); const st = [...document.querySelectorAll("*")].find(e=>e.children.length===0 && /^Status and visibility$/i.test(e.textContent.trim())); return { scrollH: m.scrollHeight, statusTop: st ? Math.round(st.getBoundingClientRect().top - m.getBoundingClientRect().top + m.scrollTop) : null }; });
  log(vp, JSON.stringify(r));
  await s.tall("route-active-tall", vp === "zoom200" ? 4200 : 5200);
  await s.browser.close();
}
