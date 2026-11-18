// P3a keyboard + axe run. Windows Node: node ux-audit\round-1\implementation\P3a\keys.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { open, go } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { default: AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const log = (...a) => console.log(...a);
const settle = async (p) => { await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(2500); };
const { browser, page } = await open("curator", { viewport: "1440" });
const axe = async (label) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  log("axe", label, r.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(", ") || "clean");
};
for (const k of ["places", "pois", "routes"]) { await go(page, `/projects/${P}/${k}`); await settle(page); await axe(k); }

// Tab stops per row on POIs
await go(page, `/projects/${P}/pois`); await settle(page);
const stops = await page.evaluate(() => {
  const row = document.querySelector("tbody tr");
  return [...row.querySelectorAll("a,button,input,select,[tabindex]:not([tabindex='-1'])")].filter((e) => e.tabIndex >= 0).map((e) => e.getAttribute("aria-label") || e.textContent.trim().slice(0, 30));
});
log("row tab stops", JSON.stringify(stops));

// search into the URL
await page.getByRole("searchbox").fill("zzzz"); await page.waitForTimeout(1200);
log("url", page.url().split("?")[1], "| empty:", await page.getByText("No points of interest match").isVisible());
await axe("pois filtered-empty");
await page.getByRole("button", { name: "Clear filters" }).first().click(); await page.waitForTimeout(500);

// create dialog by keyboard
await page.getByRole("button", { name: "New point of interest" }).first().click();
await page.waitForTimeout(500);
log("focus in dialog:", await page.evaluate(() => document.activeElement?.closest("[role=dialog]") ? document.activeElement.id + "|" + document.activeElement.tagName : "no"));
await axe("create poi dialog");
await page.keyboard.type("UX-P3a Test Marble Head");
await page.getByRole("button", { name: "Edit slug" }).click();
log("slug", await page.getByLabel("Slug", { exact: true }).inputValue());
await page.getByRole("button", { name: "Create and open" }).click();
await page.waitForURL(/\/pois\/[0-9a-f-]{36}$/, { timeout: 15000 }).catch(() => log("no navigation", page.url()));
log("after create url", page.url());

// activate from list (draft with no texts => refusal inside dialog)
await go(page, `/projects/${P}/pois?q=UX-P3a`); await settle(page);
const kebab = page.getByRole("button", { name: /^Actions for UX-P3a/ }).first();
await kebab.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
log("menu", (await page.getByRole("menuitem").allTextContents()).join(" / "));
await page.getByRole("menuitem", { name: "Activate" }).click(); await page.waitForTimeout(600);
const dlg = page.getByRole("dialog");
log("activate dialog:", (await dlg.innerText()).replace(/\n+/g, " | ").slice(0, 200));
await axe("activate dialog");
await dlg.getByRole("button", { name: /^Activate$/ }).click(); await page.waitForTimeout(1500);
log("refusal in dialog:", (await dlg.innerText()).replace(/\n+/g, " | ").slice(0, 300), "| url", page.url().includes("/pois?") || page.url().endsWith("/pois"));
await page.screenshot({ path: new URL("./after/activate-refusal__1440.png", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
log("focus after close:", await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));

// Move to position on the full list
await go(page, `/projects/${P}/pois`); await settle(page);
const names = async () => page.evaluate(() => [...document.querySelectorAll("tbody tr")].slice(0, 5).map((r) => r.querySelector("a")?.textContent.trim()));
log("before", JSON.stringify(await names()));
await browser.close();
