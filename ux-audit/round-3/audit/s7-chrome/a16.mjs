import { open, go, P, shot, settle } from "./h.mjs";
for (const vp of ["1280", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, "/"); await settle(page, 2000);
  const m = await page.evaluate(() => ({ docScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth, h1: document.querySelector("h1").getBoundingClientRect().top, createBtn: (()=>{const b=[...document.querySelectorAll("button,a")].find(x=>/Create Project/.test(x.textContent)); const r=b.getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)];})() }));
  console.log("HOME", vp, JSON.stringify(m)); await shot(page, `home__default__${vp}`);
  if (vp === "1280") {
    const g = page.getByRole("button", { name: /Needs setup/ }); console.log("group btn", await g.evaluate(e => ({ exp: e.getAttribute("aria-expanded"), fs: getComputedStyle(e).fontSize, fw: getComputedStyle(e).fontWeight, left: e.getBoundingClientRect().left })));
    const g2 = await page.locator("h2").evaluateAll(es => es.map(e => [e.textContent.trim(), getComputedStyle(e).fontSize, getComputedStyle(e).fontWeight, Math.round(e.getBoundingClientRect().left)]));
    console.log("h2s", JSON.stringify(g2));
    await g.click(); await settle(page, 600); await shot(page, "home__needs-setup-open__1280");
    console.log("expanded text", (await page.locator("main").innerText()).slice(300, 900).replace(/\n+/g, " | "));
    await page.keyboard.press("Tab"); 
    await page.getByPlaceholder(/Search projects/).fill("chrome"); await settle(page, 500); await page.keyboard.press("ArrowDown"); console.log("arrow focus", await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,50)));
    await shot(page, "home__search__1280");
    await page.getByPlaceholder(/Search projects/).fill("zzzqq"); await settle(page, 400); console.log("empty search:", (await page.locator("main").innerText()).slice(200, 600).replace(/\n+/g," | ")); await shot(page, "home__search-empty__1280");
  }
  await browser.close();
}
