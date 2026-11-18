import { open, go, P, shot, settle } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await go(page, `/projects/${P}/preview`); await settle(page, 3000);
const info = () => page.evaluate(() => { const f = document.querySelector("[data-preview-frame]"); const r = f?.getBoundingClientRect(); return { scale: f?.getAttribute("data-scale"), w: r && Math.round(r.width), h: r && Math.round(r.height), caption: [...document.querySelectorAll("p,span")].map(e=>e.textContent.trim()).filter(t=>/Shown at|× \d+/.test(t) && t.length<120).slice(0,2), url: location.search, status: [...document.querySelectorAll('[role=status],[aria-live]')].map(e=>e.textContent.trim().slice(0,100)).filter(Boolean) }; });
for (const s of ["Kiosk", "Mobile", "Web"]) {
  await page.getByRole("tab", { name: s, exact: true }).click(); await page.waitForTimeout(800);
  for (const z of ["Fit", "100 %", "50 %"]) {
    await page.getByRole("tab", { name: z, exact: true }).click(); await page.waitForTimeout(600);
    console.log(s, z, JSON.stringify(await info()));
    await shot(page, `preview__${s.toLowerCase()}-${z.replace(/\W/g,"")}__1440`);
  }
  await page.getByRole("tab", { name: "Fit", exact: true }).click();
}
// kiosk orientation
await page.getByRole("tab", { name: "Kiosk", exact: true }).click(); await page.waitForTimeout(500);
await page.getByRole("tab", { name: "Landscape" }).click(); await page.waitForTimeout(600);
console.log("kiosk landscape", JSON.stringify(await info())); await shot(page, "preview__kiosk-landscape__1440");
await page.getByRole("tab", { name: "Portrait" }).click();
// language
await page.getByRole("tab", { name: "Ελληνικά" }).click(); await page.waitForTimeout(800);
console.log("greek", JSON.stringify(await info())); await shot(page, "preview__kiosk-greek__1440");
console.log("frame text greek:", (await page.locator("[data-preview-frame]").innerText()).slice(0, 400).replace(/\n/g," | "));
console.log("region", await page.locator('[role=region][aria-label^=Preview]').getAttribute("aria-label"));
await page.getByRole("tab", { name: "English" }).click();
// modes
for (const m of ["Live", "Working"]) { await page.getByRole("tab", { name: m, exact: true }).click(); await page.waitForTimeout(1500);
  console.log("mode", m, "|", (await page.locator("main").innerText()).split("\n").filter(l=>/shown|hidden|pending|missing|trigger/i.test(l)).join(" || "));
  await shot(page, `preview__kiosk-${m}__1440`); }
await page.getByRole("tab", { name: "Working", exact: true }).click();
// fire
const sel = page.locator("#fire-trigger");
for (const surf of ["Kiosk", "Mobile"]) {
  await page.getByRole("tab", { name: surf, exact: true }).click(); await page.waitForTimeout(600);
  const groups = await sel.locator("optgroup").evaluateAll(gs => gs.map(g => g.label + ":" + g.querySelectorAll("option").length));
  console.log(surf, "groups", groups);
  for (const g of ["QR codes", "Geo-proximity", "Beacons"]) {
    const o = sel.locator(`optgroup[label^='${g}'] option`).first();
    if (!(await o.count())) { console.log(surf, g, "none offered"); continue; }
    const v = await o.getAttribute("value"); await sel.selectOption(v);
    await page.getByRole("button", { name: "Fire", exact: true }).click(); await page.waitForTimeout(900);
    console.log(surf, g, "chip:", await page.getByText(/^Fired:/).first().textContent().catch(()=>"NO CHIP"), "| notes:", await page.locator("#fire-trigger-notes").textContent().catch(()=>"-"));
    await shot(page, `preview__${surf.toLowerCase()}-fired-${g.split(" ")[0].replace(/\W/g,"")}__1440`);
  }
  const rb = page.getByRole("button", { name: /^Reset/ }); console.log(surf, "reset btn", await rb.count());
  if (await rb.count()) { await rb.first().click(); await page.waitForTimeout(500); console.log(surf, "after reset chip", await page.getByText(/^Fired:/).count()); }
}
// interact / skip
await page.getByRole("button", { name: /Interact with the preview/ }).click(); await page.waitForTimeout(500);
await shot(page, "preview__mobile-interacting__1440");
console.log("buttons now", await page.getByRole("button", { name: /Stop interacting|Interact/ }).allTextContents());
await page.getByRole("button", { name: /Stop interacting/ }).click().catch(()=>{});
const skip = page.getByRole("link", { name: /Skip preview/ }); console.log("skip", await skip.count());
await page.keyboard.press("Tab"); 
// new tab
await page.getByRole("tab", { name: "Kiosk", exact: true }).click();
await page.getByRole("tab", { name: "Ελληνικά" }).click();
await page.getByRole("tab", { name: "Live", exact: true }).click(); await page.waitForTimeout(500);
const [np] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: /Open in new tab/ }).or(page.getByRole("link", { name: /Open in new tab/ })).first().click()]);
await np.waitForLoadState("networkidle").catch(()=>{}); await np.waitForTimeout(2500);
console.log("newtab url", np.url(), "title", await np.title());
await np.screenshot({ path: "ux-audit/round-2/audit/p4-kiosk/shots/newtab__kiosk-el-live__1440.png" }).catch(()=>{});
await shot(np, "newtab__kiosk-el-live__1440");
console.log("newtab body", (await np.locator("body").innerText()).slice(0, 300).replace(/\n/g," | "));
await np.close();
console.log("errors", errs.slice(0,5));
await browser.close();
