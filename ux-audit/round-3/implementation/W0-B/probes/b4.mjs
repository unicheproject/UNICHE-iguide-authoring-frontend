import { session, go, P, ids, LOG, shot, sleep, AE } from "./h.mjs";
const log = LOG("b4");
for (const vp of ["1440", "zoom200"]) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P(`/pois/${ids.actB}`));
  await page.waitForSelector("#tab-en", { timeout: 20000 });
  await sleep(500);
  const geo = await page.evaluate(() => { const b = document.querySelector("[data-next-missing]")?.getBoundingClientRect(); const t = document.querySelector("#tab-en")?.getBoundingClientRect(); const tabs = [...document.querySelectorAll("[role=tab]")].map((x) => x.getBoundingClientRect()); const lastTab = tabs[tabs.length - 1]; return b && t ? { btnTop: Math.round(b.top), tabTop: Math.round(t.top), dy: Math.round(Math.abs(b.top - t.top)), btnLeft: Math.round(b.left), lastTabRight: Math.round(lastTab.right), btnRight: Math.round(b.right) } : null; });
  log(vp, "button vs tabs:", geo);
  const seq = [];
  for (let i = 0; i < 14; i++) {
    const btn = page.locator("[data-next-missing]").first();
    if (!(await btn.count())) { seq.push("(button gone)"); break; }
    await btn.click(); await sleep(350);
    const info = await page.evaluate(() => { const a = document.activeElement; const r = a?.getBoundingClientRect(); const stack = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h")) || 0; return { id: a?.id || a?.tagName, lang: document.querySelector("[role=tab][aria-selected=true]")?.id, top: r ? Math.round(r.top) : null, stack, expanded: [...document.querySelectorAll("button[aria-expanded]")].filter((b) => /details|settings/i.test(b.textContent)).map((b) => b.textContent.trim().slice(0, 20) + "=" + b.getAttribute("aria-expanded")) }; });
    seq.push(info);
  }
  log(vp, "clicks:", seq.map((s) => typeof s === "string" ? s : `${s.lang}:${s.id}@${s.top}/${s.stack}`));
  log(vp, "title focused any time:", seq.some((s) => s.id === "f-title"), JSON.stringify(seq[0]?.expanded), JSON.stringify(seq[seq.length-1]?.expanded));
  await shot(page, `b4-next-missing-${vp}`);
  await browser.close();
}
