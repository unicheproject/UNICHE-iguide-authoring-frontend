import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
{ const { browser, page } = await open("curator", { viewport: "zoom200" });
  await go(page, `/projects/${P}/places`); await page.waitForTimeout(5000); await page.screenshot({ path: `${out}places__zoom200.png` });
  await page.evaluate(() => document.getElementById("main").scrollTo(0, 700)); await page.waitForTimeout(500); await page.screenshot({ path: `${out}places-scrolled__zoom200.png` });
  await browser.close(); }
{ const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/pois`); await page.waitForTimeout(4000); await page.screenshot({ path: `${out}pois-forced-colors__1440.png` });
  await browser.close(); }
