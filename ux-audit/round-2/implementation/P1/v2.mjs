import { open, go, API } from "../../../tools/session.mjs";
import AxeBuilder from "@axe-core/playwright";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const out = (n) => `ux-audit/round-2/implementation/P1/after/${n}.png`;
const vps = ["1440", "1024", "768", "zoom200"];
for (const vp of vps) {
  const { browser, page } = await open("admin", { viewport: vp });
  await page.route(new RegExp(`/projects/${P}$`), async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const res = await route.fetch(); const j = await res.json(); j.initialized = false; j.initializedAt = null;
    await route.fulfill({ response: res, json: j });
  });
  await go(page, `/projects/new?resume=${P}`);
  await page.waitForSelector("#step-heading");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out(`wizard-step2__${vp}`) });
  if (vp === "1440") {
    const axe = await new AxeBuilder({ page }).analyze();
    console.log("axe step2:", JSON.stringify(axe.violations.map(v => [v.id, v.impact, v.nodes.length])));
    const dis = await page.getByRole("button", { name: /^Continue/ }).getAttribute("aria-disabled");
    console.log("continue aria-disabled before choosing:", dis);
    await page.locator("label", { hasText: "Multi-region network" }).click(); await page.waitForTimeout(400);
    await page.screenshot({ path: out(`wizard-step2-chosen__${vp}`) });
    await page.getByRole("button", { name: /^Continue$/ }).click(); await page.waitForTimeout(500);
    await page.screenshot({ path: out(`wizard-step3__${vp}`) });
    console.log("axe step3:", JSON.stringify((await new AxeBuilder({ page }).analyze()).violations.map(v => [v.id, v.impact, v.nodes.length])));
    await page.getByRole("button", { name: /^Back$/ }).click();
    await page.getByRole("navigation", { name: /progress/i }).getByRole("button", { name: /Name/ }).click(); await page.waitForTimeout(400);
    await page.screenshot({ path: out(`wizard-step1-created__${vp}`) });
  }
  await browser.close();
}
// step 1 on a fresh page (not submitted)
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/new`); await page.waitForSelector("#step-heading"); await page.waitForTimeout(1000);
  await page.screenshot({ path: out("wizard-step1__1440") });
  console.log("axe step1:", JSON.stringify((await new AxeBuilder({ page }).analyze()).violations.map(v => [v.id, v.impact, v.nodes.length])));
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "zoom200" });
  await go(page, `/projects/new`); await page.waitForSelector("#step-heading"); await page.waitForTimeout(1000);
  await page.screenshot({ path: out("wizard-step1__zoom200") });
  await browser.close();
}
