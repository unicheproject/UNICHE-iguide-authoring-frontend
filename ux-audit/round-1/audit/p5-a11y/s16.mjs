import { start, go, P, focusInfo, tabWalk, tabTo, live, axe, outDir } from "./common.mjs";
import { writeFileSync } from "node:fs";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC","base64");
writeFileSync(outDir + "UX-p5-a11y-upload.png", png);
const s = await start("1440"); const { page } = s;
await go(page, P + "/media"); await page.waitForTimeout(2000);
await s.shot("media__list");
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").slice(0,40).join("\n")));
const w0 = await tabWalk(page, 3); 
await page.evaluate(()=>{document.activeElement.blur()});
await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); // skip link
await tabTo(page, /^Upload/);
await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log("upload dialog focus", JSON.stringify(await focusInfo(page)));
console.log(await page.locator("[role=dialog]").first().ariaSnapshot());
await s.shot("media__upload-dialog");
console.log("axe", JSON.stringify((await axe(page,"upload-dialog")).map(v=>v.id+":"+v.impact+":"+v.nodes+":"+v.sample[0])));
await page.locator("[role=dialog] input[type=file]").first().setInputFiles(outDir + "UX-p5-a11y-upload.png");
for (let i=0;i<8;i++){ await page.waitForTimeout(500); console.log("t"+i, JSON.stringify(await live(page)), (await page.locator("[role=dialog]").innerText().catch(()=>"closed")).replace(/\n/g," | ").slice(0,300)); }
await s.shot("media__upload-after");
console.log("focus", JSON.stringify(await focusInfo(page)));
await s.browser.close();
