import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
const R = "11d2dfe4-09fa-48b1-8b5b-494964cf3d52";
await L.nav(page, L.P("/routes/" + R), 1800);
await L.watchLive(page);
const names = async () => page.locator("#stops li a, section:has(h2:has-text('Stops')) ol li a").allTextContents();
const order = async () => (await page.getByRole("link", { name: /^Stop \d/ }).allTextContents());
L.log("t20", "restore banner?", await page.getByText(/restore|unsaved draft|kept/i).allTextContents());
L.log("t20", "initial order", await order());
if (!(await order()).length) {
  await page.getByRole("button", { name: /add stops/i }).first().focus(); await k.press("Enter"); await page.waitForTimeout(1000);
  await k.type("Kore"); await page.waitForTimeout(500);
  const items = page.locator("[role=dialog] li button");
  for (let i = 0; i < 4; i++) { await items.nth(i).focus(); await k.press("Space"); await page.waitForTimeout(250); }
  await k.press("Escape"); await page.waitForTimeout(800);
  await k.press("Control+s"); await page.waitForTimeout(3000);
  L.log("t20", "after save order", await order());
}
// Move down button
await page.getByRole("button", { name: /^Move stop 1,.* down/ }).focus(); await k.press("Enter"); await page.waitForTimeout(500);
L.log("t20", "Move down stop1: order", await order(), "focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
// Move up on the stop now at pos 3? focus
await k.press("Enter"); await page.waitForTimeout(500);
L.log("t20", "Enter again (focus still on moved?)", await order(), await L.focus(page));
// position select
const sel = page.getByRole("combobox", { name: /^Position of stop 4/ });
await sel.focus(); await sel.selectOption("1"); await page.waitForTimeout(500);
L.log("t20", "position select 4->1: order", await order(), "focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
// drag handle by keyboard
const h = page.getByRole("button", { name: /^Drag handle for stop 1,/ });
await h.focus(); L.log("t20", "handle", await L.focus(page), await h.evaluate((e) => [...e.attributes].map((a) => a.name + "=" + a.value.slice(0, 50)).join(" ")));
await k.press("ArrowDown"); await page.waitForTimeout(400);
L.log("t20", "handle ArrowDown: order", await order(), "focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
await k.press("Space"); await k.press("ArrowDown"); await k.press("ArrowDown"); await k.press("Space"); await page.waitForTimeout(500);
L.log("t20", "handle Space/Arrow/Space: order", await order(), "focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
await L.shot(page, "route__after-keyboard-reorder__1440");
// Remove then Undo
const first = (await order())[0];
await page.getByRole("button", { name: /^Remove stop 2,/ }).focus(); await k.press("Enter"); await page.waitForTimeout(600);
L.log("t20", "remove: order", await order(), "focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
L.log("t20", "undo ui", await page.getByRole("button", { name: /undo/i }).allTextContents());
await L.shot(page, "route__after-remove__1440");
await page.getByRole("button", { name: /undo/i }).first().focus(); await k.press("Enter"); await page.waitForTimeout(600);
L.log("t20", "undo: order", await order(), "focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2));
await k.press("Control+s"); await page.waitForTimeout(2500);
L.log("t20", "saved: order", await order(), "live", (await L.liveLog(page)).slice(-3));
await browser.close();
