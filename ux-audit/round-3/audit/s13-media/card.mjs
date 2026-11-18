import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/media?sort=name&dir=asc`); await settle(page);
// load all via "Load more"?
const more = await page.getByRole("button", { name: /show more|load more|more/i }).count();
console.log("more buttons", more, await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>b.textContent.trim()).filter(Boolean).slice(-6)));
const r = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("ul[aria-label='Media files'] > li")];
  const rows = {};
  for (const li of cards) {
    const top = Math.round(li.getBoundingClientRect().top + scrollY);
    const chip = li.querySelector("span[class*=rounded-full]");
    const cb = chip?.getBoundingClientRect();
    const img = li.querySelector("img, svg");
    const ib = img?.getBoundingClientRect();
    (rows[top] ??= []).push({ n: li.querySelector("h2,h3,a,p")?.textContent.trim().slice(0, 28), chipY: cb && Math.round(cb.top + scrollY) - top, h: Math.round(li.getBoundingClientRect().height), imgH: ib && Math.round(ib.height), kind: li.innerText.split("\n")[0] });
  }
  return Object.entries(rows).slice(0, 12).map(([t, a]) => `${t}: chipY ${a.map((x) => x.chipY).join("/")} h ${a.map((x) => x.h).join("/")} ${a.map(x=>x.kind.slice(0,10)).join(",")}`);
});
console.log(r.join("\n"));
await shot(page, `lib__grid-byname__${vp}`);
// thumbnails types
const t = await page.evaluate(() => [...document.querySelectorAll("ul[aria-label='Media files'] > li")].map(li => { const im = li.querySelector("img"); return { type: li.innerText.match(/(Image|Audio|Video|Document|3D model|Floor plan|Other) ·/)?.[1], img: !!im, nat: im && [im.naturalWidth, im.naturalHeight], fit: im && getComputedStyle(im).objectFit, status: li.innerText.match(/Active|Draft|Archived/)?.[0] }; }));
const seen = {}; for (const x of t) { const k = `${x.type}/${x.img}/${x.fit}/${x.status}`; seen[k] = (seen[k] || 0) + 1; }
console.log(seen);
await browser.close();
