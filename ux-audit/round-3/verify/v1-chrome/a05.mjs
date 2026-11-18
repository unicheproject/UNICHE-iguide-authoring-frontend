import { open, go, shot, text, axe, P, T, settle, mockDash, rect } from "./lib.mjs";
const modes = process.argv[2]?.split(",") ?? ["pristine"];
const vps = (process.argv[3] ?? "1440").split(",");
for (const mode of modes) for (const vp of vps) {
  const { browser, page } = await open("admin", { viewport: vp });
  const ann = [];
  await mockDash(page, mode === "suspended" || mode === "blocked" ? P : T, mode);
  await go(page, `/projects/${mode === "suspended" || mode === "blocked" ? P : T}`); await settle(page, 3000);
  await shot(page, `dashboard__${mode}__${vp}`, true);
  if (vp === "1440") { console.log("=====", mode, vp); console.log((await text(page)).split("\n").slice(26).join(" | ").slice(0, 1800)); }
  console.log(mode, vp, "axe", await axe(page), "alerts", await page.locator("[role=alert]").count());
  await browser.close();
}
