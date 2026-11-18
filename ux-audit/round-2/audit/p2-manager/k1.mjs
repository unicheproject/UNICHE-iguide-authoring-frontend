import { fresh, uiSignIn, shot, CMS } from "./lib.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright").AxeBuilder;
const { browser, page } = await fresh("1280");
await uiSignIn(page, "admin", "1280", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const axe = async (name) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log("AXE", name, r.violations.map(v=>`${v.id}(${v.impact}) x${v.nodes.length}`).join("; ") || "clean"); };
await axe("home");
await page.goto(`${CMS}/projects/${P}`); await page.waitForTimeout(6000);
await axe("dashboard-populated");
const act = () => page.evaluate(()=>{const e=document.activeElement; return e? `${e.tagName}${e.getAttribute("role")?"["+e.getAttribute("role")+"]":""} "${(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,40)}" expanded=${e.getAttribute("aria-expanded")}`:"none"});
// switcher keyboard
await page.keyboard.press("Tab"); console.log("tab1", await act()); await page.keyboard.press("Tab"); console.log("tab2", await act()); await page.keyboard.press("Tab"); console.log("tab3", await act());
await page.locator("header button[aria-haspopup], header button[aria-expanded]").first().focus();
console.log("trigger:", await act());
await page.keyboard.press("Enter"); await page.waitForTimeout(600);
console.log("after Enter:", await act());
await axe("switcher-open");
await page.keyboard.press("ArrowDown"); console.log("down1:", await act());
await page.keyboard.press("ArrowDown"); console.log("down2:", await act());
await page.keyboard.press("End"); console.log("End:", await act());
await page.keyboard.press("Home"); console.log("Home:", await act());
await page.keyboard.press("Escape"); await page.waitForTimeout(400); console.log("after Esc:", await act());
// 5 s read test: screenshot at 5s after navigation for the Populated dashboard
// Create Project axe
await page.goto(`${CMS}/projects/new`); await page.waitForTimeout(2500); await axe("create-step1");
// dashboard of Empty D first-run axe
await page.goto(`${CMS}/projects/f56e8c75-94af-4c87-88c8-06cba46240a1`); await page.waitForTimeout(4000); await axe("emptyD-firstrun");
await browser.close();
