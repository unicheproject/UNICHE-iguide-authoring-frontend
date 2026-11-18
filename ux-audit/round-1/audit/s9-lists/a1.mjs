import { start, go, CMS, P } from "./common.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const vp = process.argv[2] ?? "1440";
const s = await start(vp);
const { page } = s;
for (const k of kinds) {
  await go(page, `${P}/${k}`);
  await page.waitForSelector("table, [role=alert]", { timeout: 20000 }).catch(()=>console.log("no table", k));
  await page.waitForTimeout(800);
  await s.shot(`${k}__list-default`);
  const info = await page.evaluate(() => {
    const m = document.querySelector("main");
    return { rows: document.querySelectorAll("tbody tr").length, ths: [...document.querySelectorAll("thead th")].map(t=>t.textContent.trim()), count: [...document.querySelectorAll("main div")].map(d=>d.textContent.trim()).filter(t=>/^\d+( of \d+)? [a-z ]+$/.test(t)).slice(-1)[0], sticky: getComputedStyle(document.querySelector("thead th")||document.body).position, mainScroll: m.scrollHeight+"/"+m.clientHeight };
  });
  console.log(k, JSON.stringify(info));
}
await s.browser.close();
