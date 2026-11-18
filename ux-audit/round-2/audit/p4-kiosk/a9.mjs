import { open, go, P, seed, shot, settle, targets } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1024", touch: true });
const norm = (n) => n.replace(/^(Actions for|Move|Open|Edit) .*/, "$1 …").replace(/\d+/g, "N").slice(0, 28);
const routes = ["", "/places", "/pois", "/routes", "/guides", "/events", "/categories", "/maps", "/media", "/preview", "/app-settings"];
const out = {};
for (const r of routes) {
  await go(page, `/projects/${P}${r}`); await settle(page, 2000);
  const t = await targets(page);
  const g = {}; for (const s of t.small) { const k = `${s.t} "${norm(s.n)}" ${s.w}x${s.h}`; g[k] = (g[k]||0)+1; }
  console.log(`## ${r||"/dashboard"} total ${t.total} small ${t.small.length}`);
  for (const [k,v] of Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,14)) console.log("   ", v, k);
  await shot(page, `sweep__${(r||"dashboard").replace("/","")}__1024`, false);
}
await browser.close();
