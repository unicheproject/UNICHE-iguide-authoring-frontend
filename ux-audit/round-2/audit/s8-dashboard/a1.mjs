import { open, go, bearer, API, VIEWPORTS } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P = { pop: "6958c18f-60d2-4140-a524-5a43f8a2f6b5", D: "f56e8c75-94af-4c87-88c8-06cba46240a1", B: "1d6971ce-6391-4da8-848e-8d7466d25128", C: "ceee1b24-e7c4-474e-93ba-f77067ed8a72" };
const out = "ux-audit/round-2/audit/s8-dashboard/shots/";
const calls = [];
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  if (vp === "1440") page.on("response", async (r) => { if (r.url().startsWith(API) && /readiness|settings|\?size=1|pending/.test(r.url())) { let b = ""; try { b = (await r.text()).slice(0, 600); } catch {} calls.push({ u: r.url().replace(API, ""), s: r.status(), b }); } });
  for (const [k, id] of Object.entries(P)) {
    if (vp !== "1440" && k === "C") continue;
    await go(page, `/projects/${id}`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}dashboard__${k}__${vp}.png`, fullPage: true });
    if (vp === "1440") console.log(k, await page.evaluate(() => document.querySelector("main")?.innerText.slice(0, 1500)));
  }
  await browser.close();
}
writeFileSync("ux-audit/round-2/audit/s8-dashboard/calls.json", JSON.stringify(calls, null, 1));
