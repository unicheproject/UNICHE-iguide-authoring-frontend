import { open, CMS, P, settle, here } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const seed = JSON.parse(readFileSync(here + "/../../../tools/seed.json", "utf8"));
const id = (k, key) => seed[k].find((x) => x.key === key).id;
const base = `${CMS}/projects/${P}`;
const out = {};
const log = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };
const stuck = (page) => page.evaluate(() => {
  const els = [...document.querySelectorAll("body *")].filter((el) => { const cs = getComputedStyle(el); return (cs.position === "sticky" || cs.position === "fixed") && el.offsetHeight > 0; });
  const r = els.map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.top < 140 && r.top > -5 && r.width > 200);
  const bottom = Math.max(0, ...r.map(({ r }) => r.bottom));
  return { cssVar: getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h").trim(), bottom: Math.round(bottom), vh: innerHeight, pct: Math.round(bottom / innerHeight * 100), items: r.map(({ el, r }) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} ${Math.round(r.top)}-${Math.round(r.bottom)}`).slice(0, 8) };
});
const iconBtns = (page) => page.evaluate(() => [...document.querySelectorAll("button, [role=button], summary")].filter((b) => !(b.textContent ?? "").trim().replace(/\s+/g, "") && b.getBoundingClientRect().width > 0 && !b.closest("[aria-hidden=true]")).map((b) => { const r = b.getBoundingClientRect(); return { n: (b.getAttribute("aria-label") || b.title || b.className.slice(0, 30)).slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; }));
for (const vp of ["1440", "1280", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const [name, url] of [["poi-list", `${base}/pois`], ["poi-editor", `${base}/pois/${id("pois","frieze")}`]]) {
    await page.goto(url); await settle(page, 1500);
    const main = page.locator("main").first();
    for (const y of [0, 400, 1200]) {
      await page.evaluate((y) => { const m = document.querySelector("main"); (m && m.scrollHeight > m.clientHeight ? m : document.scrollingElement).scrollTo(0, y); window.scrollTo(0, y); }, y);
      await page.waitForTimeout(400);
      log(`sticky ${vp} ${name} y=${y}`, await stuck(page));
      if (y === 400) await page.screenshot({ path: join(here, "shots", `${vp}-sticky-${name}.png`) });
    }
    if (vp === "1440") {
      await page.evaluate(() => { document.querySelector("main")?.scrollTo(0, 0); window.scrollTo(0, 0); });
      const ib = await iconBtns(page); log(`iconbtns ${name} fine`, { n: ib.length, small: ib.filter((b) => b.w < 40 || b.h < 40) });
    }
  }
  await browser.close();
}
// coarse pointer 44px
{
  const { browser, context, page } = await open("admin", { viewport: "1440", touch: true });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "pointer", value: "coarse" }, { name: "hover", value: "none" }] });
  for (const [name, url] of [["poi-list", `${base}/pois`], ["poi-editor", `${base}/pois/${id("pois","frieze")}`]]) {
    await page.goto(url); await settle(page, 1500);
    const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    const ib = await iconBtns(page); log(`iconbtns ${name} coarse(${coarse})`, { n: ib.length, small: ib.filter((b) => b.w < 44 || b.h < 44) });
  }
  await browser.close();
}
// deep link 3 reloads
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  const res = [];
  for (let i = 0; i < 3; i++) {
    if (i === 0) await page.goto(`${base}/pois/${id("pois","frieze")}`); else await page.reload();
    await settle(page, 600); const t1 = await page.title(); const chip1 = await page.evaluate(() => document.querySelector("header")?.innerText.replace(/\s+/g, " ").slice(0, 160));
    await page.waitForTimeout(3500);
    res.push({ i, titleEarly: t1, headerEarly: chip1, titleLate: await page.title(), headerLate: await page.evaluate(() => document.querySelector("header")?.innerText.replace(/\s+/g, " ").slice(0, 160)) });
  }
  log("deeplink reloads", res);
  // Tab count in Placement
  await page.goto(`${base}/pois/${id("pois","frieze")}`); await settle(page, 1500);
  const info = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2,h3")].find((x) => /^Placement|Location|On the map/i.test(x.textContent.trim()));
    return h ? h.textContent.trim() : null;
  });
  log("placement heading", info);
  const btn = page.getByRole("button", { name: /Save draft|Save and apply/i }).first();
  await btn.focus();
  let n = 0, inside = 0, entered = false, left = false; const trail = [];
  for (let i = 0; i < 80 && !left; i++) {
    await page.keyboard.press("Tab"); n++;
    const s = await page.evaluate(() => { const a = document.activeElement; const sec = a?.closest("section, [id^=section-]"); const h = sec?.querySelector("h2,h3"); return { sec: h?.textContent.trim().slice(0, 30) ?? "", tag: (a?.getAttribute("aria-label") || a?.textContent || a?.tagName || "").trim().slice(0, 30) }; });
    trail.push(s.sec + " / " + s.tag);
    if (/^Placement|Location|On the map/i.test(s.sec)) { entered = true; inside++; } else if (entered) left = true;
  }
  log("tab placement", { total: n, insidePlacementCard: inside, trail });
  await browser.close();
}
// preview trigger beacon
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await page.goto(`${base}/preview?trigger=432c66f3-86b0-4a49-836b-e575f41fa19a`); await page.waitForSelector("[data-preview-toolbar]", { timeout: 30000 }); await page.waitForTimeout(1500);
  log("preview beacon", { tabs: await page.getByRole("tab", { selected: true }).allInnerTexts(), chip: await page.getByText(/^Fired:/).allInnerTexts(), select: await page.inputValue("#fire-trigger").catch(() => null) });
  await page.screenshot({ path: join(here, "shots", "1440-preview-trigger-beacon.png") });
  await browser.close();
}
writeFileSync(join(here, "measure.json"), JSON.stringify(out, null, 1));
