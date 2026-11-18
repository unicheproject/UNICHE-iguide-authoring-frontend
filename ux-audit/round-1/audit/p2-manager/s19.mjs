import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
const P="/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, context, page } = await open("admin", { viewport: "1280" });
await go(page,"/"); await page.waitForTimeout(1000);
console.log("links:", await page.locator("header a").evaluateAll(es=>es.map(e=>e.textContent.trim()+" -> "+e.href+" target="+e.target)));
// silent SSO timing on new page in same context
const p2 = await context.newPage(); const t=Date.now();
await p2.goto(CMS+"/"); 
const shots=[]; for (const ms of [100,400,900]) { await p2.waitForTimeout(ms); shots.push(await p2.locator("body").innerText().then(s=>s.slice(0,60).replace(/\n/g," "))); }
await p2.screenshot({path:"ux-audit/round-1/audit/p2-manager/shots/sso__loading__1280.png"});
console.log("sso text snapshots:", shots);
await p2.close();
// warning link target
await go(page,P); await page.waitForTimeout(1500);
await page.getByText(/Warnings \(/).click();
const first = page.locator("main details a").nth(1);
console.log("warn link:", await first.innerText(), await first.getAttribute("href"));
await first.click(); await page.waitForTimeout(1500);
console.log("landed", page.url());
await shot(page,"dashboard__warning-link-target","1280");
// Launch page peek for "what next"
await go(page,P+"/launch"); await page.waitForTimeout(1500);
await shot(page,"launch__peek","1280");
console.log("LAUNCH:", (await page.locator("main").innerText()).slice(0,500));
await browser.close();
