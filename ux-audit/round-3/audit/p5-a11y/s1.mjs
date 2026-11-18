import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("s1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const seed = JSON.parse(readFileSync(H.here + "/../../../tools/seed.json", "utf8"));
const { browser, page } = await H.session({ viewport: "1280" });
try {
  // 1 pending=1 axe detail
  await H.go(page, H.P("/pois?pending=1")); await H.sleep(1200);
  await H.axe(page, "pois?pending=1", log);
  log("mismatch node", await page.evaluate(() => { const r = [...document.querySelectorAll("button[data-variant=secondary]")].map(b => (b.getAttribute("aria-label") || "") + "|" + b.textContent.trim() + "|" + (b.getAttribute("aria-describedby")||"")); return r.slice(0, 6); }));
  // 2 sticky 1280x720
  for (const [label, path] of [["poi-list", "/pois"], ["poi-editor", "/pois/" + ids.poi], ["poi-editor-active", "/pois/" + seed.pois[0].id]]) {
    await H.go(page, H.P(path)); await H.sleep(1000);
    const s = await H.stickyStack(page, 900); log("STICKY@1280x720", label, s.pct + "%", s.covered, JSON.stringify(s.items.map(i => `${i.tag}@${i.top}+${i.h}`)));
    await H.shot(page, `${label}__scrolled__1280`);
  }
  // 3 user menu
  await H.go(page, H.P("/")); await H.sleep(800);
  await page.getByRole("button", { name: /account menu/ }).focus();
  await H.press(page, "Enter", "user menu open", log, 400);
  await H.shot(page, "user-menu__open__1280");
  log("menu", await page.evaluate(() => { const m = document.querySelector("[role=menu]"); return m ? [...m.querySelectorAll("[role^=menuitem]")].map(i => i.textContent.trim()) : "no role=menu"; }));
  for (const k of ["ArrowDown", "ArrowDown", "ArrowUp", "End", "Home"]) await H.press(page, k, "user menu", log, 150);
  await H.press(page, "Escape", "user menu esc", log, 300);
  // 4 loading skeleton announcement
  await page.route(/\/pois\?/, async (r) => { await H.sleep(2500); await r.continue(); });
  await page.goto(H.CMS + H.P("/pois")); await H.sleep(900);
  log("skeleton live:", JSON.stringify(await H.live(page)), "nav inert:", await page.evaluate(() => !!document.querySelector("nav[aria-label=Primary]")?.closest("[inert]") || document.querySelector("nav[aria-label=Primary]")?.getAttribute("inert")), "aria-busy:", await page.evaluate(() => [...document.querySelectorAll("[aria-busy=true]")].length));
  await H.shot(page, "poi-list__skeleton__1280");
  await H.sleep(3500); await page.unroute(/\/pois\?/);
  // 5 not-found project 404 focus
  await page.route(/\/iguide\/api\/v1\/projects\/[0-9a-f-]+$/, (r) => r.fulfill({ status: 404, contentType: "application/problem+json", body: JSON.stringify({ code: "PROJECT_NOT_FOUND", status: 404, requestId: "req-r3-404", title: "SECRET" }) }));
  await page.goto(H.CMS + H.P("/pois")); await H.sleep(2000);
  log("404", JSON.stringify(await H.title(page)), JSON.stringify(await H.live(page)), H.brief(await H.AE(page)));
  await H.shot(page, "project-404__1280"); await H.axe(page, "project-404", log);
  await page.unroute(/\/iguide\/api\/v1\/projects\/[0-9a-f-]+$/);
  // media h1
  await H.go(page, H.P("/media")); await H.sleep(2500); log("media h1", JSON.stringify(await H.title(page)));
} finally { await browser.close(); }
