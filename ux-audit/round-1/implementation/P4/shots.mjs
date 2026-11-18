// P4 screenshots. Windows Node: node ux-audit\round-1\implementation\P4\shots.mjs <mode> [viewport...]
import { readFileSync } from "node:fs";
import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const mode = process.argv[2] ?? "poi";
const vps = process.argv.slice(3).length ? process.argv.slice(3) : ["1440"];
const ready = async (page) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator("main h1").first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1800);
};
const poi = (k) => `/projects/${P}/pois/${rec[k]}`;
const place = (k) => `/projects/${P}/places/${rec[k]}`;
const clean = (page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("iguide:draft:")).forEach((k) => localStorage.removeItem(k)));
for (const vp of vps) {
  const { browser, page } = await open("curator", { viewport: vp });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });
  const shot = async (n) => {
    await page.screenshot({ path: `${out}${n}__${vp}.png` });
    const h = await page.evaluate(() => { const m = document.querySelector("main"); return m ? m.scrollHeight : document.documentElement.scrollHeight; });
    console.log(vp, n, "main scrollHeight", h);
    if (process.env.TALL) {
      const size = page.viewportSize();
      await page.setViewportSize({ width: size.width, height: Math.min(h + 140, 6000) });
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}${n}-tall__${vp}.png` });
      await page.setViewportSize(size);
    }
  };
  const targets = mode === "poi"
    ? [["poi-draft", poi("draft")], ["poi-active", poi("active")], ["poi-pending", poi("pending")], ["poi-archived", poi("archived")]]
    : [["place-outdoor", place("outdoor")], ["place-indoor", place("indoor")], ["place-sub", place("sub")]];
  for (const [name, url] of targets) { await go(page, url); await ready(page); await shot(name); }
  if (mode === "poi") {
    await go(page, poi("draft")); await ready(page);
    await page.getByRole("tab", { name: /ελληνικά/i }).click().catch(() => {}); await page.waitForTimeout(700); await shot("poi-draft-greek");
  }
  await clean(page);
  await browser.close();
}
