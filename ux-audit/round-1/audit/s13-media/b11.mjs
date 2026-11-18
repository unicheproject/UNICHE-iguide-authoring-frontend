import { start, go, P } from "./common.mjs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const vp = process.argv[2] ?? "1440";
const dir = new URL("./files/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const s = await start(vp); const { page, context } = s;
async function openByName(name) {
  await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
  await page.fill("#media-search", name); await page.waitForTimeout(400);
  await page.locator("main ul li a", { hasText: name }).first().click();
  await page.waitForSelector("h1"); await page.waitForTimeout(2000);
}
// axe on library and editor
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
let r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
console.log("AXE library", r.violations.map(v=>v.id+":"+v.nodes.length+":"+v.nodes[0].target).join(" | "));
await page.getByRole("button",{name:"List"}).click(); await page.waitForTimeout(500);
r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
console.log("AXE list", r.violations.map(v=>v.id+":"+v.nodes.length+":"+v.nodes[0].target).join(" | "));
await page.getByRole("button",{name:"Grid"}).click();
await openByName("UX-s13-media clip.webm");
r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
console.log("AXE editor", r.violations.map(v=>v.id+":"+v.nodes.length+":"+v.nodes[0].target).join(" | "));
// replace with wrong type
await page.locator("input[aria-label='Replacement file']").setInputFiles(dir+"UX-s13-media square.png");
await page.waitForTimeout(2500);
await s.shot("editor__replace-wrongtype");
console.log("replace wrong:", await page.evaluate(()=>[...document.querySelectorAll("main li")].map(l=>l.innerText.replace(/\n+/g," | ")).join("\n")));
await page.locator("input[aria-label='Replacement file']").setInputFiles(dir+"UX-s13-media clip.webm");
await page.waitForTimeout(3500);
await s.shot("editor__replace-ok");
console.log("replace ok:", await page.evaluate(()=>[...document.querySelectorAll("[role=status],[aria-live]")].map(e=>e.textContent.trim().slice(0,150)).join("~")));
// dirty then replace
await page.getByLabel("Title").first().fill("dirty");
await page.getByRole("button",{name:/Replace file/}).click(); await page.waitForTimeout(600);
await s.shot("editor__replace-dirty");
// leave with unsaved changes
await page.getByRole("link",{name:"Media"}).first().click(); await page.waitForTimeout(800);
await s.shot("editor__leave-dirty");
console.log("url after leave", page.url(), "dialogs", await page.locator("[role=dialog],[role=alertdialog]").count());
await s.browser.close();
