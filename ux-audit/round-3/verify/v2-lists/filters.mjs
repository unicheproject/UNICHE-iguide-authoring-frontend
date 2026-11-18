import AxeBuilder from "@axe-core/playwright";
import { open, go, P, KINDS, ready, shot, save, focusDesc, loadList } from "./h.mjs";
const res = {};
const sv = () => save("filters", res);
const pop = (page) => page.evaluate(() => {
  const d = document.querySelector("[role=dialog]"); if (!d) return null; const r = d.getBoundingClientRect();
  const sc = [...d.querySelectorAll("*")].find((e) => e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY)) || d;
  const labels = [...d.querySelectorAll("label,legend")].map((l) => l.textContent.replace(/\s+/g, " ").trim().slice(0, 30));
  const lang = labels.filter((l) => /language/i.test(l)).length;
  const done = [...d.querySelectorAll("button")].find((b) => b.textContent.trim() === "Done"); const dr = done?.getBoundingClientRect();
  const selW = [...d.querySelectorAll("select,[role=combobox],button[aria-haspopup=listbox]")].map((s) => Math.round(s.getBoundingClientRect().width));
  return { name: d.getAttribute("aria-label") || d.getAttribute("aria-labelledby"), top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), innerHeight, scrolls: sc.scrollHeight > sc.clientHeight + 2, done: !!done, doneVisible: dr ? dr.top >= 0 && dr.bottom <= innerHeight : false, labels, langControls: lang, selW };
});
for (const vp of ["1440", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    await loadList(page, `/projects/${P}/${k}?status=DRAFT`);
    const btn = page.getByRole("button", { name: /^Filters/ });
    const key = `${k}@${vp}`;
    res[key] = { btnText: await btn.evaluate((b) => b.textContent.replace(/\s+/g, " ").trim()), btnName: await btn.evaluate((b) => b.getAttribute("aria-label") || b.textContent.replace(/\s+/g, " ").trim()) };
    await btn.click(); await page.waitForTimeout(500);
    res[key].pop = await pop(page);
    if (vp === "1440") { const ax = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(); res[key].axe = ax.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`); }
    await shot(page, `${k}__filters-popover__${vp}`);
    await page.getByRole("button", { name: "Done" }).click().catch(() => {}); await page.waitForTimeout(300);
    res[key].afterDone = await focusDesc(page);
    await btn.click(); await page.keyboard.press("Escape"); await page.waitForTimeout(300); res[key].afterEsc = await focusDesc(page);
  }
  await browser.close(); sv();
}
// worklist chip below 1180: 1024 + 768 on all six
for (const vp of ["1024", "768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    await loadList(page, `/projects/${P}/${k}?status=DRAFT&missing=it&lang=it`);
    res[`${k}@chips@${vp}`] = await page.evaluate(() => [...document.querySelectorAll("[role=search] button[aria-label^='Remove filter'], main button[aria-label^='Remove filter']")].map((b) => b.getAttribute("aria-label")));
    if (k === "pois") await shot(page, `${k}__worklist-chips__${vp}`, { clip: { x: 0, y: 0, width: Number(vp), height: 330 } });
  }
  await browser.close(); sv();
}
// sort cycle
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  for (const k of KINDS) {
    await loadList(page, `/projects/${P}/${k}`);
    const seq = [], firstTitles = [];
    const th = page.locator("thead th button.list-sort").first(); if (!(await th.count())) { res[`${k}@sort`] = "NO ROWS"; continue; }
    for (let i = 0; i < 3; i++) { await th.click(); await page.waitForTimeout(400); seq.push(new URL(page.url()).search || "(clean)"); firstTitles.push(await page.locator("[data-row-id] a").first().innerText()); }
    res[`${k}@sort`] = { seq, firstTitles, status: await page.locator("[role=status]").allInnerTexts().then((a) => a.filter(Boolean).slice(-2)) };
  }
  await browser.close(); sv();
}
save("filters", res);
for (const [k, v] of Object.entries(res)) console.log(k, JSON.stringify(v));
