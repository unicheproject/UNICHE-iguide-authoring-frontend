import { open, go, shot, settle, measure, dash, mock, emptyPage, problem, text, P, T, B, CMS } from "./h.mjs";
import { writeFileSync, appendFileSync } from "node:fs";
const LOG = new URL("./a4.log", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
writeFileSync(LOG, "");
const log = (...a) => { console.log(...a); appendFileSync(LOG, a.join(" ") + "\n"); };
const base = (j) => async (sub) => (sub === "/settings" ? { json: j } : undefined);
const settingsReal = async (page) => { const r = await page.evaluate(async (id) => 0, P); };

// STATUS variants via settings mock; fetch real settings first
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  let real = null;
  page.on("response", async r => { if (r.url().endsWith(`${P}/settings`) && !real) real = await r.json().catch(() => null); });
  await go(page, dash(P)); await settle(page, 1500);
  for (const st of ["LIVE", "SUSPENDED", "DRAFT"]) {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await mock(page, P, async (sub) => (sub === "/settings" ? { json: { ...real, applicationStatus: st, contentRevision: 1234567 } } : undefined));
    await go(page, dash(P)); await settle(page, 2000);
    const t = await text(page);
    log(`STATUS ${st}:`, JSON.stringify(t.slice(0, 520)));
    await shot(page, `dashboard__app-${st.toLowerCase()}__1440`, false);
  }
  // zero warnings + live; zero warnings + draft(ready)
  for (const [name, st] of [["ready-live-nowarn", "LIVE"], ["ready-draft-nowarn", "DRAFT"]]) {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await mock(page, P, async (sub) => { if (sub === "/settings") return { json: { ...real, applicationStatus: st } }; if (sub === "/readiness") return { json: { activatable: true, blocking: [], warnings: [] } }; });
    await go(page, dash(P)); await settle(page, 2000);
    log(`STATE ${name}:`, JSON.stringify((await text(page)).slice(0, 420)));
    await shot(page, `dashboard__${name}__1440`, false);
  }
  // thousands: counts
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await mock(page, P, async (sub, q) => { if (/^\/(places|pois)$/.test(sub) && q.includes("size=1") && q.includes("status=")) return { json: { content: [{ id: "x" }], page: 0, size: 1, totalElements: q.includes("ACTIVE") ? 12345 : 1234567, totalPages: 9 } }; });
  await go(page, dash(P)); await settle(page, 2000);
  log("THOUSANDS:", JSON.stringify(await page.$$eval("#counts-title ~ ul li", e => e.slice(0, 3).map(x => x.innerText.replace(/\n/g, " ")))));
  await shot(page, "dashboard__counts-thousands__1440", false);
  await browser.close();
}
// GUIDE behaviour on Trail with real data, fresh context (no localStorage)
{
  const { browser, context, page } = await open("admin", { viewport: "1440" });
  await go(page, dash(T)); await settle(page, 1800);
  log("LS before:", JSON.stringify(await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes("guide")))));
  const steps = async () => page.$$eval("[data-testid=first-run-steps] li", e => e.map(x => x.dataset.step + ":" + x.dataset.state));
  log("steps0", JSON.stringify(await steps()));
  // step rects
  log("step rects", JSON.stringify(await page.$$eval("[data-testid=first-run-steps] li", e => e.map(x => { const b = x.getBoundingClientRect(); const a = x.querySelector("a"); const ab = a && a.getBoundingClientRect(); return [x.dataset.step, Math.round(b.height), ab && Math.round(ab.height), ab && Math.round(ab.width)]; }))));
  // click step 3's button
  await page.getByRole("link", { name: "Open Pages" }).click(); await settle(page, 1200);
  log("after Open Pages url", page.url(), JSON.stringify((await text(page)).slice(0, 200)));
  await shot(page, "guide__step3-destination__1440", false);
  await go(page, dash(T)); await settle(page, 1500);
  log("steps after visiting pages", JSON.stringify(await steps()));
  await shot(page, "guide__step3-ticked__1440");
  // another context: not ticked
  const ctx2 = await browser.newContext({ storageState: await context.storageState(), viewport: { width: 1440, height: 900 } });
  await ctx2.clearCookies; const p2 = await ctx2.newPage();
  await p2.evaluate(() => 0).catch(() => {});
  log("LS value:", JSON.stringify(await page.evaluate((id) => localStorage.getItem("iguide.dashboard-guide." + id), T)));
  // keyboard order on guide
  await page.focus("main h1").catch(() => {});
  await page.evaluate(() => { const h = document.querySelector("main h1"); h.setAttribute("tabindex", "-1"); h.focus(); });
  const order = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); order.push(await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return (e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 28) + " | outline " + cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor + " | shadow " + cs.boxShadow.slice(0, 50); })); }
  log("TAB ORDER guide:\n" + order.join("\n"));
  await page.keyboard.press("Shift+Tab");
  await shot(page, "guide__focus__1440", false);
  // dismiss
  await go(page, dash(T)); await settle(page, 1200);
  await page.getByRole("button", { name: "Dismiss guide" }).focus();
  await page.keyboard.press("Enter"); await settle(page, 600);
  log("after dismiss focus:", await page.evaluate(() => document.activeElement.tagName + ":" + document.activeElement.textContent.trim().slice(0, 30)));
  await shot(page, "guide__dismissed__1440");
  log("dismissed text:", JSON.stringify((await text(page)).slice(0, 300)));
  // restore: no way back?
  log("restore affordance:", await page.getByText(/guide/i).allInnerTexts().then(a => a.join("|")));
  // cleanup: remove flags so other agents unaffected? local to my browser only
  await page.evaluate((id) => localStorage.removeItem("iguide.dashboard-guide." + id), T);
  await browser.close();
}
console.log("done");
