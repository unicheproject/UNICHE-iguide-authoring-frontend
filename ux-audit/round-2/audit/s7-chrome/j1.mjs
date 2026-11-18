import { open, go, shot, axe, run, CMS, POP, AP, t, focusDesc } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1440" });
  const routes = ["dashboard","places","pois","routes","guides","events","categories","maps","floor-plans","media","preview"];
  for (const r of routes) {
    await go(page, `/projects/${POP}/${r}`); await page.waitForTimeout(2200);
    const info = await page.evaluate(()=>{ const h=document.querySelector("main h1"); if(!h) return "no h1"; const hr=h.getBoundingClientRect(); const head=h.closest("header,div"); const btns=[...document.querySelectorAll("main button, main a")].filter(b=>{const r=b.getBoundingClientRect(); return r.top<hr.bottom+30 && r.top>hr.top-30 && r.left>800;}).map(b=>b.innerText.trim()+"@"+Math.round(b.getBoundingClientRect().left)+","+Math.round(b.getBoundingClientRect().top)); const fs=getComputedStyle(h).fontSize; const sub=h.parentElement.parentElement.innerText.split("\n").slice(0,4).join(" / "); return {h1:h.innerText, top:Math.round(hr.top), left:Math.round(hr.left), fs, btns, sub:sub.slice(0,160), title:document.title}; });
    console.log(r, JSON.stringify(info));
    await shot(page, `pagehead__${r}`, "1440");
  }
  // bad ids
  for (const [label, path] of [["record-404", `/projects/${POP}/pois/00000000-0000-4000-8000-000000000000`],["bad-project-id", `/projects/not-a-uuid/dashboard`],["unknown-route", `/nope/whatever`],["unknown-section", `/projects/${POP}/nonsense`]]) {
    await go(page, path); await page.waitForTimeout(2500);
    console.log("====",label, "url", page.url().replace(CMS,""), "| title", await page.title(), "| focus", await focusDesc(page)); console.log((await t(page,"main")).slice(0,400).replace(/\n+/g," | "));
    await shot(page, `error__${label}`, "1440");
  }
  await browser.close();
});
