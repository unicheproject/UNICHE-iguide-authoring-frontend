import { open, go, shot, text, axe, P, T, settle, mockDash } from "./lib.mjs";
for (const vp of ["1280","1024","768","zoom200"]) {
  for (const mode of ["pristine","none"]) {
    const id = mode === "none" ? P : T;
    const { browser, page } = await open("admin", { viewport: vp });
    if (mode !== "none") await mockDash(page, id, mode);
    await go(page, `/projects/${id}`); await settle(page, 3000);
    await shot(page, `dashboard__${mode === "none" ? "populated" : mode}__${vp}`, true);
    // tab order
    const stops = [];
    await page.evaluate(() => document.activeElement?.blur()); 
    await page.mouse.click(1, 1).catch(()=>{});
    await page.keyboard.press("Tab");
    for (let i = 0; i < 45; i++) {
      const s = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const r = e.getBoundingClientRect(); return { n: (e.getAttribute("aria-label") || e.innerText || e.tagName).trim().replace(/\s+/g, " ").slice(0, 28), y: Math.round(r.y + scrollY), x: Math.round(r.x), inMain: !!e.closest("main") }; });
      if (s?.inMain) stops.push(s);
      await page.keyboard.press("Tab");
    }
    let back = 0; for (let i = 1; i < stops.length; i++) if (stops[i].y < stops[i - 1].y - 4 && stops[i].x <= stops[i-1].x + 5) back++;
    console.log(vp, mode, "main stops", stops.length, "y-jumps-back", back, stops.map(s => `${s.n}@${s.y}`).join(" > ").slice(0, 700));
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
    console.log(vp, mode, ov, "axe", await axe(page));
    await browser.close();
  }
}
