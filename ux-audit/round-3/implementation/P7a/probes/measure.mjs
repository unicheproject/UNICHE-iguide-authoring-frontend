import { open, go, P, OUT, shot, settle, save, API } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const out = { vp };
// cold load: requests and time to first tile
const reqs = [];
page.on("response", async (r) => { if (/\/assets\?/.test(r.url())) { let len = 0; try { len = (await r.body()).length; } catch {} reqs.push({ url: r.url().replace(API, ""), t: Date.now() - t0, bytes: len }); } });
const t0 = Date.now();
await page.goto(`http://localhost:5173/projects/${P}/media`);
await page.waitForSelector("ul[aria-label='Media files'] > li", { timeout: 30000 });
out.firstTileMs = Date.now() - t0;
await settle(page);
out.reqs = reqs;
const grid = () => page.evaluate(() => {
  const lis = [...document.querySelectorAll("ul[aria-label='Media files'] > li")];
  const rows = {};
  for (const li of lis) { const b = li.getBoundingClientRect(); const chips = li.querySelector(".mt-auto"); const cb = chips?.getBoundingClientRect(); (rows[Math.round(b.top + scrollY)] ??= []).push({ cardBottom: Math.round(b.bottom + scrollY), chipBottom: cb ? Math.round(cb.bottom + scrollY) : null, chipTop: cb ? Math.round(cb.top + scrollY) : null }); }
  return { n: lis.length, count: document.querySelector("[data-media-count]")?.textContent.trim(), firstCardY: Math.round(lis[0]?.getBoundingClientRect().top), rows: Object.values(rows).slice(0, 4).map((r) => ({ chipBottoms: r.map((x) => x.chipBottom), spread: Math.max(...r.map((x) => x.chipBottom)) - Math.min(...r.map((x) => x.chipBottom)) })) };
});
out.grid = await grid();
await shot(page, `grid__${vp}`);
// Filters badge and count with filters
const probes = {};
for (const [k, q] of Object.entries({ alt: "alt=1", audioAlt: "type=AUDIO&alt=1", unused: "unused=1", dec: "decorative=1", typeOnly: "type=DOCUMENT", archivedFilter: "type=AUDIO&alt=1&status=NOT_ARCHIVED" })) {
  await go(page, `/projects/${P}/media?${q}`); await page.waitForTimeout(1500);
  probes[k] = await page.evaluate(() => ({ filters: [...document.querySelectorAll("button")].find((b) => /^Filters/.test(b.textContent.trim()))?.textContent.trim(), count: document.querySelector("[data-media-count]")?.textContent.trim(), chips: [...document.querySelectorAll("[aria-label='Active filters'] li")].map((l) => l.textContent.trim()), empty: document.querySelector("h2")?.textContent, text: document.body.innerText.includes("no alternative") }));
}
out.probes = probes;
await shot(page, `audio-alt__${vp}`);
// skeleton jump
await page.route(`**/assets?*`, async (route) => { await new Promise((r) => setTimeout(r, 2500)); route.continue(); });
await go(page, `/projects/${P}/media`).catch(() => {});
await page.goto(`http://localhost:5173/projects/${P}/media`);
await page.waitForSelector("[aria-label='Loading media']", { timeout: 10000 });
out.skeleton = await page.evaluate(() => { const s = document.querySelector("[aria-label='Loading media']"); return { top: Math.round(s.getBoundingClientRect().top), firstChild: Math.round(s.firstElementChild.getBoundingClientRect().top) }; });
await shot(page, `skeleton__${vp}`);
await page.waitForSelector("ul[aria-label='Media files'] > li", { timeout: 30000 });
out.skeleton.loadedFirstCard = await page.evaluate(() => Math.round(document.querySelector("ul[aria-label='Media files'] > li").getBoundingClientRect().top));
save("measure-" + vp, out);
console.log(JSON.stringify(out, null, 1));
await browser.close();
