import { open, go, shot, text, axe, rect, P, T, settle } from "./lib.mjs";
for (const vp of ["1440","1280"]) {
const { browser, page } = await open("admin", { viewport: vp });
const samples = [];
await page.goto("http://localhost:5173/");
for (let i = 0; i < 14; i++) {
  samples.push(await page.evaluate(() => { const t = document.body.innerText; return { needs: (t.match(/Needs setup \([^)]*\)/)||[""])[0], notChecked: (t.match(/Setup not checked/g)||[]).length, orgs: (t.match(/^.*\(\d+\+?\)$/mg)||[]).join(" | "), note: (t.match(/\d+ projects? (have|has) not been checked[^.]*/)||[""])[0], checking: /Checking setup/.test(t) }; }));
  await page.waitForTimeout(700);
}
const uniq = [...new Set(samples.map(s => JSON.stringify(s)))];
console.log(vp, "HOME samples (unique)", uniq.join("\n"));
await shot(page, `home__settled__${vp}`, false);
// header
const hdr = await page.evaluate(() => { const b = document.querySelector("header button[aria-haspopup], header [aria-controls]"); return b ? { text: b.innerText, w: b.getBoundingClientRect().width, sw: b.scrollWidth, cw: b.clientWidth } : null; });
console.log("switcher at home", hdr);
console.log("axe home", await axe(page));
await go(page, `/projects/${P}/dashboard`); await settle(page, 2500);
const sw = await page.evaluate(() => { const els=[...document.querySelectorAll("header button")]; return els.map(b=>({t:b.innerText.trim().slice(0,60), w:Math.round(b.getBoundingClientRect().width), trunc: [...b.querySelectorAll("*")].some(c=>c.scrollWidth>c.clientWidth+1 && getComputedStyle(c).overflow!=="visible")})); });
console.log(vp, "header buttons populated", JSON.stringify(sw));
const logo = await page.evaluate(() => { const a = document.querySelector("header a"); const r = a.getBoundingClientRect(); return { href: a.getAttribute("href"), label: a.getAttribute("aria-label")||a.innerText, w: Math.round(r.width), h: Math.round(r.height) }; });
console.log("logo", logo);
await shot(page, `header__populated__${vp}`);
await browser.close();
}
