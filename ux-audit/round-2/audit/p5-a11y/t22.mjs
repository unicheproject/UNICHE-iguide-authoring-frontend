import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
for (const [path, btn, title, label] of [["/categories", /^New category/i, "UX-R2-p5 Category", "cat"], ["/events", /^New event/i, "UX-R2-p5 Event", "ev"]]) {
  await L.nav(page, L.P(path), 1200);
  await L.watchLive(page);
  await page.getByRole("button", { name: btn }).first().focus(); await k.press("Enter"); await page.waitForTimeout(700);
  L.log("t22", label, "dialog focus", await L.focus(page));
  L.log("t22", label, "aria", (await L.snap(page, label + "-create", "[role=dialog]")).split("\n").slice(0, 45).join("\n"));
  await k.type(title);
  await L.shot(page, `${label}-create__filled__1440`);
  const sels = page.locator("[role=dialog] select");
  L.log("t22", label, "selects", await sels.evaluateAll((s) => s.map((x) => x.getAttribute("aria-label") || x.id + ":" + [...x.options].map((o) => o.text.slice(0, 30)).join("|"))));
  await browser.close().catch(() => {}); break;
}
