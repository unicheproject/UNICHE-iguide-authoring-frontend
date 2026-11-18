import { open, go, shot, settle, measure, path } from "./lib2.mjs";
const key = process.argv[3] ?? "poiA";
for (const vp of process.argv[2].split(",")) {
  const { browser, page } = await open("admin", { viewport: vp });
  try {
    await go(page, path(key)); await settle(page,2000);
    await shot(page, `${key}__empty-draft__${vp}`);
    const m = await measure(page); console.log(vp, m.vw+"x"+m.vh, "scrollH", m.scrollH); console.log(m.secs.join("\n"));
  } finally { await browser.close(); }
}
