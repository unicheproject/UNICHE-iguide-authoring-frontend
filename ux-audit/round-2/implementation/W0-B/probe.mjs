// node probe.mjs <path> [viewport] [openActivate]
import { open, go } from "../../../tools/session.mjs";
const [path, vp = "1440", act] = process.argv.slice(2);
const { browser, page } = await open("admin", { viewport: vp });
await go(page, path);
await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2500);
const r = await page.evaluate(() => ({
  title: document.querySelector("h1")?.textContent?.trim(),
  badge: document.querySelector("[data-issue-badge]")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
  card: document.querySelector("[data-issue-sentence]")?.textContent?.trim() ?? null,
  tabs: [...document.querySelectorAll('[role=tab]')].map((t) => t.textContent.replace(/\s+/g, " ").trim()),
  translations: [...document.querySelectorAll("#translations-heading ~ ul li, section[aria-labelledby=translations-heading] li")].map((l) => l.textContent.replace(/\s+/g, " ").trim()),
  lines: [...document.querySelectorAll("#readiness-heading ~ div li")].map((l) => l.textContent.replace(/\s+/g, " ").trim()),
  blocked: document.querySelector("[data-blocked-reason]")?.textContent?.trim() ?? null,
}));
if (act) {
  await page.getByRole("button", { name: /^(Save and activate|Activate)$/ }).first().click();
  await page.waitForTimeout(800);
  r.dialog = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return { sentence: d?.querySelector("[data-issue-sentence]")?.textContent?.trim() ?? null, btnDisabled: [...(d?.querySelectorAll("button") ?? [])].map((b) => `${b.textContent.trim()}:${b.getAttribute("aria-disabled")}`) }; });
  await page.screenshot({ path: `after/probe-activate.png` });
}
console.log(JSON.stringify(r, null, 1));
await browser.close();
