import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/guides`); await settle(page, 2000);
const st = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); const cs = getComputedStyle(e); return { bg: cs.backgroundColor, color: cs.color, deco: cs.textDecorationLine, cursor: cs.cursor, shadow: cs.boxShadow.slice(0, 40), border: cs.borderColor }; }, sel);
const probes = { row: "main table tbody tr:nth-child(2)", rowCell: "main table tbody tr:nth-child(2) td:nth-child(4)", titleLink: "main table tbody tr:nth-child(2) td:nth-child(2) a", sortBtn: "main thead th:nth-child(2) button", dots: "main table tbody tr:nth-child(2) td:last-child, main table tbody tr:nth-child(2) ul a", kebab: "main table tbody tr:nth-child(2) button[aria-label^=Actions]", handle: "main table tbody tr:nth-child(2) span[draggable]", segLabel: "main fieldset label:nth-child(2)", filters: "[role=search] button[aria-haspopup]", newBtn: "main h1 ~ * button, main button" };
for (const [k, sel] of Object.entries(probes)) {
  const loc = page.locator(sel).first();
  const before = await st(sel).catch(()=>null);
  await loc.hover({ force: true }); await settle(page, 300);
  const hov = await st(sel).catch(()=>null);
  let act = null;
  if (["sortBtn","kebab","filters","segLabel"].includes(k)) { const b = await loc.boundingBox(); await page.mouse.move(b.x+b.width/2,b.y+b.height/2); await page.mouse.down(); await settle(page, 150); act = await st(sel); await page.mouse.up(); await page.keyboard.press("Escape"); }
  console.log(k, "\n  base", JSON.stringify(before), "\n  hover", JSON.stringify(hov), act ? "\n  active " + JSON.stringify(act) : "");
}
await page.locator("main table tbody tr:nth-child(2)").hover(); await shot(page, "guides__row-hover__1440");
// click on blank cell navigates?
await page.locator("main table tbody tr:nth-child(2) td:nth-child(4)").click({ position: { x: 5, y: 5 } }); await settle(page, 1200);
console.log("click on Status cell ->", await page.evaluate(() => location.pathname.split("/").slice(-2).join("/")));
await browser.close();
