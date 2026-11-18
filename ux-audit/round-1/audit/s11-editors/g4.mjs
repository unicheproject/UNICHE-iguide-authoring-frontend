import { start, goP, log, dump, state, focused } from "./lib.mjs";
const s = await start("1440"); const { page } = s;
await page.goto("http://localhost:5173" + state().guideUrl); await page.waitForTimeout(3000);
await page.getByRole("tab", { name: /ελληνικά/i }).click(); await page.waitForTimeout(1000);
await s.tall("guide-translation-el-tall", 4800);
await s.shot("guide-translation-el__top");
const t = await dump(page); log(t.slice(0, 1500));
log("move/remove buttons in el tab:", await page.getByRole("button", { name: /^(move|remove)/i }).count());
log("textareas:", await page.locator("main textarea").count(), "inputs", await page.locator("main input[type=text], main input:not([type])").count());
// english refs on el tab
await page.getByRole("tab", { name: /english/i }).click(); await page.waitForTimeout(500);
// keyboard
await page.getByRole("button", { name: /Move .*block 2|paragraph 2|Move.*2 down/i }).first().focus().catch(()=>log("no focus"));
log("labels sample:", await page.getByRole("button", { name: /^Move/i }).first().getAttribute("aria-label"), JSON.stringify(await page.getByRole("button", { name: /^Move/i }).nth(1).boundingBox()));
const down = page.getByRole("button", { name: /^Move .* down/i }).nth(1);
await down.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
log("focus after move:", await focused(page), "live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)));
const rm = page.getByRole("button", { name: /^Remove/i }).nth(2); log("remove label", await rm.getAttribute("aria-label"));
const n0 = await page.getByRole("button", { name: /^Remove/i }).count();
await rm.click(); await page.waitForTimeout(500);
log("after remove: count", n0, "->", await page.getByRole("button", { name: /^Remove/i }).count(), "dialogs", await page.locator("[role=dialog]").count(), "focus", await focused(page));
await page.keyboard.press("Control+z"); 
// insert after
await page.getByRole("button", { name: /^Insert after/i }).first().click(); await page.waitForTimeout(500);
await s.shot("guide-insert-after-open");
log("insert menu:", await page.evaluate(()=>document.activeElement.outerHTML.slice(0,100)));
await s.browser.close();
