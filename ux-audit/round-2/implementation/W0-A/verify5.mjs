import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const css = readFileSync(new URL("./built.css", import.meta.url), "utf8");
const OUT = "ux-audit/round-2/implementation/W0-A/after/";
const withCss = async (page) => { await page.evaluate(() => document.querySelectorAll('style[data-vite-dev-id*="style.css"]').forEach((s) => s.remove())); await page.addStyleTag({ content: css }); await page.waitForTimeout(500); };
const prob = (status, detail, extra = {}) => ({ status, contentType: "application/problem+json", headers: { "X-UNICHE-Request-Id": "req-test-1234" }, body: JSON.stringify({ type: "about:blank", title: "SECRET-TITLE-xyz", status, detail, code: status === 403 ? "FORBIDDEN" : "INTERNAL", requestId: "req-test-1234", ...extra }) });

// A. forced colours: dialog -> toast, menu, editor header
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("main h1"); await withCss(page);
  await page.route(/\/projects\/[^/]+\/pois$/, (route) => route.request().method() === "POST" ? route.fulfill(prob(500, "NullPointerException at com.x.Y.z(Y.java:42) user secret-user-123")) : route.continue());
  await page.getByRole("button", { name: /^New point of interest/ }).click();
  await page.getByRole("dialog").getByRole("textbox").first().fill("UX-R2-W0-A probe");
  await page.getByRole("button", { name: /Create and open/ }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + "forced__dialog-error-toast__1440.png" });
  const text = await page.evaluate(() => document.body.innerText);
  console.log("500 on create: leaks server text?", /NullPointer|secret-user|SECRET-TITLE/.test(text), "| has request id?", /req-test-1234/.test(text));
  console.log("500 text:", text.split("\n").filter(l => /server|problem|Request id|Nothing was/.test(l)).join(" // ").slice(0, 400));
  await browser.close();
}
// B. error sentences on list loads 503 / 403
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/guides`); await page.waitForSelector("main h1");
  for (const [status, detail] of [[503, "NullPointerException at X"], [403, "Not allowed for secret-user-123"]]) {
    await page.route(/\/api\/v1\/projects\/[^/]+\/guides(\?.*)?$/, (route) => route.fulfill(prob(status, detail)));
    await page.reload(); await page.waitForTimeout(2500);
    const text = await page.evaluate(() => document.body.innerText);
    console.log("TEXT", text.split("\n").filter(l => /NullPointer|secret|SECRET|busy|Request/.test(l)).join(" // ").slice(0,300)); console.log(status, "leaks?", /NullPointer|secret-user|SECRET-TITLE/.test(text), "| request id shown?", /req-test-1234/.test(text), "| busy sentence?", /busy or down for maintenance/.test(text));
    if (status === 503) await page.screenshot({ path: OUT + "error-503__1440.png" });
    await page.unroute(/\/api\/v1\/projects\/[^/]+\/guides(\?.*)?$/);
  }
  await browser.close();
}
