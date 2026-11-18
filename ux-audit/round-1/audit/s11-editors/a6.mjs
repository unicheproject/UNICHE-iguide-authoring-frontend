import { start, goP, log, dump, state, focused } from "./lib.mjs";
import { addStops } from "./lib2.mjs";
const s = await start("1440"); const { page } = s;
await page.goto("http://localhost:5173" + state().routeUrl); await page.waitForTimeout(2000);
await addStops(page, ["Alpha","Bravo","Charlie","Delta"]);
const rows = () => page.locator("text=/^Stop \\d+:/").evaluateAll(els => els.map(e => e.parentElement.innerText.replace(/\n/g," ").slice(0,60)));
log("rows", await rows());
// keyboard: tab to move-down on stop 1
const first = page.getByRole("button", { name: /move .* down|move down/i }).first();
log("move btn count", await page.getByRole("button", { name: /move/i }).count());
log("label", await first.getAttribute("aria-label"), JSON.stringify(await first.boundingBox()));
await first.focus(); await s.shot("route-stop__move-down-focus");
await page.keyboard.press("Enter"); await page.waitForTimeout(500);
log("focus after move:", await focused(page));
log("live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)));
log("rows", await rows());
// set position select
const sel = page.getByRole("combobox", { name: /position/i }).nth(0);
log("pos select label", await sel.getAttribute("aria-label"), "count", await page.getByRole("combobox", { name: /position/i }).count());
await sel.selectOption("4"); await page.waitForTimeout(500);
log("focus after setpos:", await focused(page));
log("live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)));
log("rows", await rows());
// drag handle
const hs = page.locator("span[draggable=true]");
log("handles", await hs.count(), JSON.stringify(await hs.first().boundingBox()), "role", await hs.first().getAttribute("role"), "tabindex", await hs.first().getAttribute("tabindex"), "aria", await hs.first().getAttribute("aria-label"));
await hs.nth(0).dragTo(hs.nth(2)); await page.waitForTimeout(600);
log("rows after drag", await rows());
log("live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)));
// remove stop
const rm = page.getByRole("button", { name: /remove/i }).first();
log("remove label", await rm.getAttribute("aria-label"));
await rm.click(); await page.waitForTimeout(500);
log("confirm dialog?", await page.locator("[role=dialog],[role=alertdialog]").count());
log("rows after remove", await rows());
log("toast/live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live],[role=status]")].map(e=>e.textContent.trim()).filter(Boolean)));
await s.shot("route-stop__after-remove");
await s.browser.close();
