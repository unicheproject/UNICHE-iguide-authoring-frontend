import { open, go, P, KINDS, ready, save } from "./h.mjs";
const res = {};
for (const vp of ["1440", "1280", "1024"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    await go(page, `/projects/${P}/${k}`); await ready(page);
    res[`${k}@${vp}`] = await page.evaluate(() => {
      const cells = [...document.querySelectorAll("[data-row-id] td.list-tree-cell")].map((c) => Math.round(c.getBoundingClientRect().width));
      const textW = [...document.querySelectorAll("[data-row-id] td.list-tree-cell .min-w-0.flex-1")].map((c) => Math.round(c.getBoundingClientRect().width));
      const ths = [...document.querySelectorAll("main thead th")].map((t) => Math.round(t.getBoundingClientRect().width));
      const cap = [...document.querySelectorAll("[data-row-id] ul.list-none")].map((u) => [...u.children].map((l) => l.textContent.trim().slice(0, 14)).join("|")).filter((s) => /\+\d/.test(s)).slice(0, 2);
      return { cellMin: Math.min(...cells), cellMax: Math.max(...cells), textMin: Math.min(...textW), ths, capSample: cap };
    });
  }
  await browser.close();
}
save("cell", res);
for (const [k, v] of Object.entries(res)) console.log(k, JSON.stringify(v));
