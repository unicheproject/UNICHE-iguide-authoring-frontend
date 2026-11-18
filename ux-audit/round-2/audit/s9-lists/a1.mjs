import { open, go, shot, POP, axe } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
for (const k of kinds) {
  const t0 = Date.now();
  await go(page, `/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const q = (s) => [...document.querySelectorAll(s)];
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const sticky = q("*").filter((e) => getComputedStyle(e).position === "sticky").map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName}.${(e.className+"").slice(0,40)} top=${Math.round(r.top)} h=${Math.round(r.height)}`; });
    const heads = q("th, [role=columnheader]").filter(vis).map((e) => ({ t: e.textContent.trim(), sort: e.getAttribute("aria-sort"), btn: !!e.querySelector("button") }));
    const rows = q("tbody tr, [role=row]").filter(vis).map((e) => Math.round(e.getBoundingClientRect().height));
    const kebabs = q("button[aria-haspopup]").filter(vis).map((e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; });
    return { url: location.href, title: document.title, sticky, heads, rows: rows.length, rowH: [Math.min(...rows), Math.max(...rows)], kebab: [...new Set(kebabs)], docH: document.documentElement.scrollHeight, vh: innerHeight };
  });
  console.log(k, Date.now() - t0, JSON.stringify(info));
  console.log((await page.locator("main").innerText()).slice(0, 1400).replace(/\n+/g, " | "));
  await shot(page, `${k}-list__default`, "1440");
  await shot(page, `${k}-list__default-full`, "1440", true);
}
await browser.close();
