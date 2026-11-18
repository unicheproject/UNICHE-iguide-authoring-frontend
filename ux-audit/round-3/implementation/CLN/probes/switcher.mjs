import { open, go, VIEWPORTS } from "../../../../tools/session.mjs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin");
for (const w of [1440, 1280, 1100, 1024, 768]) {
  await page.setViewportSize({ width: w, height: 900 });
  await go(page, P);
  await page.waitForTimeout(2500);
  const m = await page.evaluate(() => {
    const t = document.querySelector("header button[aria-haspopup='dialog']");
    const name = t?.querySelector("span.truncate");
    const chip = t?.querySelector(".ui-chip");
    const hdr = document.querySelector("header");
    const acc = hdr.querySelector(".ml-auto");
    return { trigger: t && Math.round(t.getBoundingClientRect().width), nameClient: name?.clientWidth, nameScroll: name?.scrollWidth, text: name?.textContent, chip: chip && Math.round(chip.getBoundingClientRect().width), trunc: name ? name.scrollWidth > name.clientWidth : null, triggerRight: t && Math.round(t.getBoundingClientRect().right), accLeft: acc && Math.round(acc.getBoundingClientRect().left) };
  });
  console.log(w, JSON.stringify(m));
  if (w === 1440 || w === 1280) await page.screenshot({ path: `ux-audit/round-3/implementation/CLN/switcher-${process.argv[2] ?? "x"}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 60 } });
}
await browser.close();
