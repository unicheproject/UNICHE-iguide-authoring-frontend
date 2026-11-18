// W0 stage 0.3 capture. Windows Node: node ux-audit\round-1\implementation\W0.3\capture.mjs [lists|greek|demo]
import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";

const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const mode = process.argv[2] ?? "lists";
const settle = async (page) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(900);
};

if (mode === "lists") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  for (const k of ["places", "pois", "routes", "guides", "events", "categories"]) {
    await go(page, `/projects/${P}/${k}`);
    await settle(page);
    await page.screenshot({ path: `${out}list-${k}__1440.png` });
  }
  await browser.close();
}

const MOUNT = "/ux-audit/round-1/implementation/W0.3/scratch/mount.ts";
async function demoPage(vp = "1440") {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${P}/pois`);
  await settle(page);
  await page.evaluate(async (m) => (await import(/* @vite-ignore */ m)).mountDemo(), MOUNT);
  await page.waitForSelector("#w03-demo table, #w03-demo ul[aria-label]", { timeout: 15000 });
  await page.waitForTimeout(800);
  return { browser, page };
}

if (mode === "demo") {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await demoPage(vp);
    await page.screenshot({ path: `${out}demo__${vp}.png` });
    await browser.close();
  }
}

if (mode === "keys") {
  const { browser, page } = await demoPage("1440");
  const log = [];
  const say = async () => (await page.locator("[role=status][aria-live=polite]").allTextContents()).join(" | ");
  // kebab of row 2
  const kebab = page.getByRole("button", { name: /^Actions for /i }).nth(1);
  const name = (await kebab.getAttribute("aria-label")).replace("Actions for ", "");
  await kebab.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}demo-menu__1440.png` });
  const items = await page.getByRole("menuitem").allTextContents();
  log.push(["menu items", items.join(" / ")]);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  log.push(["focus after Esc", await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))]);
  // Move down by menu
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "Move down" }).click();
  await page.waitForTimeout(600);
  log.push(["after Move down announcement", await say()]);
  // Set position via keyboard only
  const k2 = page.getByRole("button", { name: new RegExp(`^Actions for ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
  await k2.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "Move to position..." }).focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector("[role=dialog]");
  await page.waitForTimeout(300);
  log.push(["dialog focus", await page.evaluate(() => document.activeElement?.tagName + ":" + document.activeElement?.id?.slice(0, 4))]);
  await page.keyboard.type("99");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  log.push(["error shown", (await page.locator("[role=dialog]").innerText()).replace(/\n+/g, " / ")]);
  await page.screenshot({ path: `${out}demo-position-error__1440.png` });
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("1");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);
  log.push(["dialog gone", String(await page.locator("[role=dialog]").count() === 0)]);
  log.push(["focus returns to", await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))]);
  log.push(["announcement", await say()]);
  log.push(["first row", await page.locator("#w03-demo tbody tr").first().locator("a").first().innerText()]);
  await page.screenshot({ path: `${out}demo-after-move__1440.png` });
  // Esc on dialog
  await k2.focus().catch(() => {});
  // sort, filters in URL
  await page.locator("#w03-demo input[type=search]").fill("zzzz");
  await page.waitForTimeout(900);
  log.push(["url", page.url().replace(/^.*\?/, "?")]);
  log.push(["live", await say()]);
  await page.screenshot({ path: `${out}demo-filtered-empty__1440.png` });
  console.log(log.map((l) => l.join(": ")).join("\n"));
  await browser.close();
}

if (mode === "greek") {
  const { browser, page } = await demoPage("1440");
  await page.screenshot({ path: `${out}greek-list-row__1440.png`, clip: { x: 0, y: 230, width: 1440, height: 160 } });
  await page.evaluate(() => document.getElementById("w03-demo")?.remove());
  await go(page, `/projects/${P}/pois/${seed.pois[0].id}`);
  await settle(page);
  const tab = page.getByRole("tab", { name: /Ελληνικά/ }).first();
  console.log("greek tab count", await tab.count());
  if (await tab.count()) await tab.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}greek-poi-editor__1440.png` });
  const faces = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.family.includes("Montserrat")).map((f) => `${f.family} ${f.status} ${f.unicodeRange.slice(0, 20)}`),
  );
  console.log(faces.join("\n"));
  await browser.close();
}
