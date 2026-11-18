import { open, go, shot, settle, P, measure } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1700});
  for (const [name,tag] of [["Acropolis Museum","indoor"],["Acropolis of Athens","outdoor"],["Room of the Korai","subplace"]]) {
    await go(page, `/projects/${P}/places`); await settle(page,1500);
    await page.getByRole("link",{name:new RegExp("^"+name+"$")}).first().click(); await page.waitForURL(/places\/[0-9a-f-]{36}/); await settle(page,2500);
    await shot(page,`place-${tag}__readonly-view__1440x1700`);
    const t = await page.locator("#setup").innerText(); console.log("=== "+name+"\n"+t.replace(/\n(?:\s*\n)+/g,"\n").split("\n").filter(l=>!/^\s{3}/.test(l)).slice(0,40).join("\n"));
    const m = await measure(page); console.log("scrollH", m.scrollH, m.secs[0]);
    // leave without saving
  }
} finally { await browser.close(); }
