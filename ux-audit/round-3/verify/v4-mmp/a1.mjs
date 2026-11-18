import { go, shot, POP, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1440"; const touch = process.argv[3] === "touch";
await run(async () => {
  const { browser, page } = await start(vp, { touch });
  log("=== A1 media library", vp, touch ? "touch" : "mouse");
  const reqs = []; const t0 = Date.now(); let tDone = 0;
  page.on("response", r => { if (/\/assets(\?|$)/.test(r.url())) { reqs.push(new URL(r.url()).search + " @" + (Date.now() - t0)); } });
  await go(page, `/projects/${POP}/media`); await page.waitForTimeout(2500);
  log("asset list requests", reqs);
  await shot(page, "media__grid-default", vp);
  const txt = (await page.locator("main").innerText());
  log("head text", txt.replace(/\n+/g, " | ").slice(0, 600));
  log("NBSP in sizes", await page.evaluate(() => { const t = document.querySelector("main").innerText; return { nbsp: (t.match(/\d (KB|MB|B)\b/g) || []).length, plainSpace: (t.match(/\d (KB|MB)\b/g) || []).length, dotZero: (t.match(/\d\.0 ?MB/g) || []).length }; }));
  log("Unused words", await page.evaluate(() => { const t = document.querySelector("main").innerText; return { notUsedYet: (t.match(/Not used yet/g) || []).length, unused: (t.match(/\bUnused\b/g) || []).length }; }));
  // chip row alignment
  log("chip rows", await page.evaluate(() => { const cards = [...document.querySelectorAll("main li, main article")].filter(c => c.querySelector("img, [data-asset-thumb]")).slice(0, 8); return cards.map(c => { const chips = [...c.querySelectorAll("[class*=chip], .chip, span")].filter(s => /Used in|Not used yet|alt|Needs|Archived|Draft|Active|Decorative/i.test(s.textContent) && s.children.length === 0 || /Not used yet|Used in/.test(s.textContent) && s.children.length < 2); const bs = chips.map(s => Math.round(s.getBoundingClientRect().bottom)); const cb = Math.round(c.getBoundingClientRect().bottom); return { cardBottom: cb, chipBottoms: bs.slice(-3) }; }); }));
  // toggle list view
  const listBtn = page.getByRole("button", { name: /^List/ }).or(page.getByRole("radio", { name: /List/ }));
  log("list btn", await listBtn.count());
  await axe(page, `media grid ${vp}`);
  await browser.close();
});
