import { open, CMS, P, settle, here, attach } from "./lib.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const seed = JSON.parse(readFileSync(here + "/../../../tools/seed.json", "utf8"));
const id = (k, key) => seed[k].find((x) => x.key === key).id;
const base = `${CMS}/projects/${P}`;
const log = (...a) => console.log(...a);
const act = (page) => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""} "${(a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g," ").slice(0, 50)}"` : "none"; });
const T = async (label, fn) => { try { await fn(); } catch (e) { log("FAIL", label, String(e.message).split("\n")[0]); } };
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  const e = attach(page, "keys");
  await page.goto(`${base}/pois`); await settle(page, 1500);
  // skip link
  if (0) await T("skip", async () => {
    await page.goto(`${base}/pois`); await settle(page, 1200);
    await page.keyboard.press("Tab"); log("skip: first Tab ->", await act(page));
    await page.keyboard.press("Enter"); await page.waitForTimeout(300); log("skip: after Enter ->", await act(page));
  });
  // route change focus/title
  if (0) await T("route", async () => {
    await page.getByRole("link", { name: /^Places/ }).first().click(); await page.waitForTimeout(1500);
    log("route change -> title:", await page.title(), "| focus:", await act(page), "| live:", await page.evaluate(() => [...document.querySelectorAll("[aria-live]")].map((e) => e.textContent.trim()).filter(Boolean).join(" / ").slice(0, 100)));
  });
  // row menu Esc
  if (0) await T("rowmenu", async () => {
    await page.goto(`${base}/pois`); await settle(page, 1500);
    const t = page.getByRole("button", { name: /^Actions for/ }).first(); await t.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
    log("rowmenu open focus:", await act(page)); await page.keyboard.press("Escape"); await page.waitForTimeout(400); log("rowmenu Esc -> focus:", await act(page));
    // set position
    await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    const mi = page.getByRole("menuitem", { name: /position|Move to/i }).first();
    if (await mi.count()) { await mi.click(); await page.waitForTimeout(700); log("setpos dialog focus:", await act(page)); await page.screenshot({ path: join(here, "shots", "1440-setpos.png") }); await page.keyboard.press("Escape"); await page.waitForTimeout(500); log("setpos Esc -> focus:", await act(page)); }
    else { log("no set-position item; menu items:", await page.getByRole("menuitem").allInnerTexts()); await page.keyboard.press("Escape"); }
  });
  // activate confirm Esc
  if (0) await T("activate", async () => {
    await page.goto(`${base}/pois/${id("pois","horsemen")}`); await settle(page, 1500);
    const b = page.getByRole("button", { name: /^Activate/ }).first(); await b.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(900);
    log("activate dialog focus:", await act(page)); await page.keyboard.press("Escape"); await page.waitForTimeout(500); log("activate Esc -> focus:", await act(page));
  });
  // preview esc order
  if (0) await T("preview", async () => {
    await page.getByRole("button", { name: /Preview in app/i }).first().click(); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /^Expand/i }).first().click().catch(()=>{}); await page.waitForTimeout(800);
    const inter = page.getByRole("button", { name: /^Interact/i }).first(); if (await inter.count()) { await inter.click(); await page.waitForTimeout(500); log("preview interact focus:", await act(page)); }
    for (let i = 1; i <= 3; i++) { await page.keyboard.press("Escape"); await page.waitForTimeout(600); log(`preview Esc#${i} -> focus:`, await act(page), "| panel open:", await page.getByRole("button", { name: /Close preview|Hide preview/i }).count()); }
  });
  // toast geometry
  await T("toast", async () => {
    await page.goto(`${base}/pois`); await settle(page, 1200);
    await page.getByRole("searchbox").first().fill("UX-R2-verify"); await page.waitForTimeout(1200);
    await page.getByRole("link", { name: /UX-R2-verify Empty POI/ }).first().click(); await settle(page, 1500);
    await page.getByLabel(/^Title/).first().type("!");
    await page.getByRole("button", { name: /^Activate/ }).first().click(); await page.waitForTimeout(900);
    const g = await page.evaluate(() => {
      const r = (el) => el ? (({ x, y, width, height, right, bottom }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height), right: Math.round(right), bottom: Math.round(bottom) }))(el.getBoundingClientRect()) : null;
      const toast = [...document.querySelectorAll("[style*='--toast'], [style*='bottom']")].find((e) => e.innerText && /Save first/.test(e.innerText));
      const t = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /^Save first$/.test(e.textContent.trim()));
      const card = t?.closest("div[class*=shadow], li, div");
      const aside = document.querySelector("aside"); const field = document.querySelector("main input"); const form = field?.closest("section");
      return { toastText: t?.textContent, toast: r(t?.parentElement?.parentElement), aside: r(aside), formCard: r(form), vw: innerWidth };
    });
    log("toast geometry 1440:", JSON.stringify(g));
    await page.screenshot({ path: join(here, "shots", "1440-toast-save-first.png") });
  });
  log("page errors:", JSON.stringify(e.pageerror), "console:", JSON.stringify(e.console));
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "768" });
  await page.goto(`${base}/pois/${id("pois","frieze")}`); await settle(page, 1500);
  await T("drawer", async () => {
    const names = await page.getByRole("button").evaluateAll((bs) => bs.map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim().replace(/\s+/g," ").slice(0, 40)).filter(Boolean).slice(0, 25));
    log("768 buttons:", JSON.stringify(names));
    const b = page.getByRole("button", { name: /^Menu$/ }).first();
    await b.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
    log("drawer open focus:", await act(page), "| dialog:", await page.getByRole("dialog").count()); await page.screenshot({ path: join(here, "shots", "768-drawer-open.png") });
    await page.keyboard.press("Escape"); await page.waitForTimeout(500); log("drawer Esc -> focus:", await act(page));
  });
  await browser.close();
}
