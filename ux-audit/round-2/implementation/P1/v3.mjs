import { open, go } from "../../../tools/session.mjs";
import AxeBuilder from "@axe-core/playwright";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const out = (n) => `ux-audit/round-2/implementation/P1/after/${n}.png`;
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, "/"); await page.waitForSelector("main h1"); await page.waitForTimeout(2500);
  await page.screenshot({ path: out(`home__${vp}`) });
  if (vp === "1440") console.log("axe home:", JSON.stringify((await new AxeBuilder({ page }).analyze()).violations.map(v => [v.id, v.impact, v.nodes.length])));
  // loading skeleton: delay the project read
  await page.route(new RegExp(`/projects/${P}$`), async (r) => { await new Promise(x => setTimeout(x, 2500)); r.continue(); });
  await page.goto(`http://localhost:5173/projects/${P}/pois`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: out(`skeleton-list__${vp}`) });
  console.log(vp, "skeleton status:", await page.evaluate(() => [...document.querySelectorAll('[role=status]')].map(e => e.textContent.trim()).filter(Boolean)), "nav inert:", await page.evaluate(() => document.querySelector('#workspace-nav')?.hasAttribute('inert')));
  await page.waitForSelector("main h1", { timeout: 15000 }).catch(()=>{});
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, "/"); await page.waitForSelector("main h1");
  await page.evaluate(async () => { const m = await import("/src/stores/sessionNotice.ts"); m.markSessionEnded(); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: out("session-ended__1440") });
  console.log("axe dialog:", JSON.stringify((await new AxeBuilder({ page }).analyze()).violations.map(v => [v.id, v.impact, v.nodes.length])));
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  console.log("dialog after esc:", await page.locator('[role=dialog]').count());
  await browser.close();
}
// forced colors home + switcher
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}`); await page.waitForSelector("main h1"); await page.waitForTimeout(2000);
  await page.getByRole("button", { name: /switch project/i }).click(); await page.waitForTimeout(800);
  await page.screenshot({ path: out("switcher-forced__1440") });
  await browser.close();
}
// sign-in view
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await page.context().clearCookies();
  await page.route(/silent-check-sso/, (r) => r.fulfill({ contentType: "text/html", body: "<html><body><script>parent.postMessage('', '*')</script></body></html>" }));
  await page.goto("http://localhost:5173/"); await page.waitForTimeout(4000);
  await page.screenshot({ path: out("signin__1440") });
  console.log("signin logos:", await page.locator('img[src*=logo]').count(), "url", page.url().slice(0,80));
  await browser.close();
}
