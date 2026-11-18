import { open, go, P, seed, shot, settle, targets, report } from "./lib.mjs";
const map = seed.maps[0].id, fp = seed.floorPlans[0].id;
for (const vp of ["1024","768"]) {
  const { browser, page } = await open("curator", { viewport: vp, touch: true });
  const errs=[]; page.on("pageerror", e=>errs.push(e.message));
  await go(page, `/projects/${P}/maps/${map}`); await settle(page, 3500);
  await shot(page, `map-editor__top__${vp}`, false);
  const mc = page.locator(".leaflet-container").first(); console.log(vp, "map box", JSON.stringify(await mc.boundingBox()));
  console.log(vp, "map hint", await page.getByText(/Tap|Click/).allTextContents());
  const t = await targets(page); const small = t.small.filter(s=>!/^(Skip|UNICHE)/.test(s.n)); console.log(vp, "map editor small", t.total, JSON.stringify(small.slice(0,25).map(s=>`${s.t}:${s.n.slice(0,22)} ${s.w}x${s.h}`)));
  await shot(page, `map-editor__full__${vp}`, true);
  await go(page, `/projects/${P}/floor-plans/${fp}`); await settle(page, 3500);
  console.log(vp, "fp url", page.url());
  await shot(page, `floorplan-editor__top__${vp}`, false);
  const t2 = await targets(page); const s2 = t2.small.filter(s=>!/^(Skip|UNICHE)/.test(s.n));
  const g = {}; for (const s of s2) { const k=`${s.t}:${s.n.replace(/\d+/g,"N").slice(0,24)} ${s.w}x${s.h}`; g[k]=(g[k]||0)+1; }
  console.log(vp, "fp small", t2.total, JSON.stringify(Object.entries(g).slice(0,20)));
  console.log(vp, "fp buttons", await page.getByRole("button", { name: /^Place/ }).count(), "hint", await page.getByText(/Tap the plan|Click the plan/).allTextContents());
  await shot(page, `floorplan-editor__full__${vp}`, true);
  console.log(vp, "errs", errs);
  await browser.close();
}
