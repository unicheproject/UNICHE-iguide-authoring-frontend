import { open, go } from "../../../tools/session.mjs";
import AxeBuilder from "@axe-core/playwright";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const out = (n) => `ux-audit/round-2/implementation/P1/after/${n}.png`;
const { browser, page } = await open("admin", { viewport: "1440" });
// home
const h0 = await page.evaluate(() => history.length);
await go(page, "/");
await page.waitForSelector("main h1");
await page.waitForTimeout(2500);
console.log("hash:", JSON.stringify(await page.evaluate(() => location.hash)), "hist", await page.evaluate(() => history.length));
await page.screenshot({ path: out("home__1440") });
// switcher
await go(page, `/projects/${P}`);
await page.waitForSelector("main h1");
await page.waitForTimeout(2000);
await page.getByRole("button", { name: /switch project/i }).click();
await page.waitForTimeout(1200);
console.log("dialog name:", await page.evaluate(() => { const d=document.querySelector('[role=dialog]'); return d && (d.getAttribute('aria-label')||d.getAttribute('aria-labelledby')); }));
const axe = await new AxeBuilder({ page }).analyze();
console.log("axe switcher:", JSON.stringify(axe.violations.map(v => [v.id, v.impact, v.nodes.length])));
console.log("rows visible in popover:", await page.evaluate(() => [...document.querySelectorAll('[role=dialog] [data-project-row]')].filter(e=>{const r=e.getBoundingClientRect(); const p=e.closest('.overflow-y-auto').getBoundingClientRect(); return r.top>=p.top-1&&r.bottom<=p.bottom+1;}).length));
await page.screenshot({ path: out("switcher__1440") });
await page.keyboard.press("Escape");
// user menu
const um = page.getByRole("button", { name: /account menu/i });
await um.focus(); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(300);
console.log("menu open:", await page.locator('[role=menu]').count(), "focus:", await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0,30)));
await page.keyboard.press("ArrowDown"); console.log("after down:", await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0,30)));
await page.screenshot({ path: out("usermenu__1440") });
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
console.log("after esc focus:", await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0,30)));
// nav
console.log("nav items multi-line:", await page.evaluate(() => [...document.querySelectorAll('#workspace-nav .nav-item')].filter(a => a.getBoundingClientRect().height > 40).map(a => a.textContent.trim().slice(0,30))));
await page.screenshot({ path: out("project-nav__1440") });
// offline
const top0 = await page.evaluate(() => document.querySelector('main h1').getBoundingClientRect().top);
await page.context().setOffline(true);
await page.evaluate(() => window.dispatchEvent(new Event("offline")));
await page.waitForTimeout(600);
const top1 = await page.evaluate(() => document.querySelector('main h1').getBoundingClientRect().top);
console.log("offline h1 top", top0, top1, "alerts", await page.locator('[role=alert]:not(.sr-only)').count());
await page.screenshot({ path: out("offline__1440") });
await page.context().setOffline(false);
await browser.close();
