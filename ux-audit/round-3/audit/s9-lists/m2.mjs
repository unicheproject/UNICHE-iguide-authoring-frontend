import { open, go, P, shot, settle, KINDS } from "./h.mjs";
const vp = process.argv[2] || "1440";
const { browser, page } = await open("admin", { viewport: vp });
for (const k of KINDS) {
  await go(page, `/projects/${P}/${k}`); await settle(page, 2000);
  const tb = await page.evaluate(() => {
    const m = document.querySelector("main");
    const seg = m.querySelector("[role=radiogroup], [role=tablist], [aria-label*=tatus]");
    const search = m.querySelector("input[type=search], input[placeholder]");
    const f = [...m.querySelectorAll("button")].find(b => /Filters/.test(b.textContent));
    const foot = [...m.querySelectorAll("*")].filter(e => /Showing \d/.test(e.textContent) && e.children.length < 4).pop();
    const r = e => e ? (b => [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)])(e.getBoundingClientRect()) : null;
    return { segTag: seg && seg.tagName + "/" + seg.getAttribute("role") + "/" + seg.getAttribute("aria-label"), seg: seg && seg.innerText.replace(/\n/g, " | "), segR: r(seg), search: search && search.placeholder, searchR: r(search), filterBtn: f && { txt: f.innerText, label: f.getAttribute("aria-label"), r: r(f), exp: f.getAttribute("aria-expanded"), haspopup: f.getAttribute("aria-haspopup") }, foot: foot && foot.innerText.replace(/\n/g, " | "), footR: r(foot), h1: r(m.querySelector("h1")) };
  });
  console.log(k, JSON.stringify(tb));
  await shot(page, `${k}__toolbar__${vp}`);
  const fb = page.getByRole("button", { name: /Filters/ }).first();
  await fb.click(); await settle(page, 600);
  const pop = await page.evaluate(() => {
    const p = document.querySelector("[role=dialog], [data-reka-popper-content-wrapper] > *, [data-radix-popper-content-wrapper] > *");
    if (!p) return null;
    const b = p.getBoundingClientRect();
    return { tag: p.tagName, role: p.getAttribute("role"), name: p.getAttribute("aria-label") || p.getAttribute("aria-labelledby"), r: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], text: p.innerText.replace(/\n+/g, " | "), ctrls: [...p.querySelectorAll("button,select,input,[role=combobox],[role=checkbox],[role=switch],[role=radio]")].map(c => `${c.tagName}${c.getAttribute("role")?"/"+c.getAttribute("role"):""}:${(c.getAttribute("aria-label")||c.innerText||c.id||"").trim().slice(0,30)}:${Math.round(c.getBoundingClientRect().height)}`), focus: document.activeElement.tagName + ":" + (document.activeElement.getAttribute("aria-label") || document.activeElement.innerText || "").slice(0, 30) };
  });
  console.log(k, "POP", JSON.stringify(pop));
  await shot(page, `${k}__filters-open__${vp}`);
  await page.keyboard.press("Escape"); await settle(page, 300);
  console.log(k, "after Esc focus", await page.evaluate(() => document.activeElement.tagName + ":" + (document.activeElement.getAttribute("aria-label")||"")));
}
await browser.close();
