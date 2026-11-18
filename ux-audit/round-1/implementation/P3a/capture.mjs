// P3a capture. Windows Node: node ux-audit\round-1\implementation\P3a\capture.mjs <lists|dialogs>
import { readFileSync } from "node:fs";
import { open, go, VIEWPORTS } from "../../../tools/session.mjs";

const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const mode = process.argv[2] ?? "lists";
const only = process.argv[3];
const settle = async (page) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2500);
};

if (mode === "lists") {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    page.on("console", (m) => m.type() === "error" && console.log("console error", vp, m.text().slice(0, 200)));
    for (const k of ["places", "pois", "routes"]) {
      if (only && only !== k) continue;
      await go(page, `/projects/${P}/${k}`);
      await settle(page);
      await page.screenshot({ path: `${out}${k}__${vp}.png` });
    }
    await browser.close();
  }
}

if (mode === "dialogs") {
  for (const vp of ["1440", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    for (const [k, name] of [["places", "New place"], ["pois", "New point of interest"], ["routes", "New route"]]) {
      await go(page, `/projects/${P}/${k}`);
      await settle(page);
      await page.getByRole("button", { name }).first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}create-${k}__${vp}.png` });
      // submit empty to show the summary
      await page.getByRole("button", { name: "Create and open" }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}create-${k}-errors__${vp}.png` });
    }
    await browser.close();
  }
}
