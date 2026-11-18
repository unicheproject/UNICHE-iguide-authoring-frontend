import { open, go } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const EB="1d6971ce-6391-4da8-848e-8d7466d25128";
{ const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, "/projects/"+EB); await page.waitForTimeout(2500); await shot(page,"dashboard-emptyb__forced-colors__1440");
  await go(page, "/projects/new?resume=413877ea-0852-4b3a-8f1f-96c4c99ae269"); await page.waitForTimeout(2000);
  await page.locator("label",{hasText:"Outdoor trail"}).click(); await page.waitForTimeout(800); await shot(page,"wizard-2__forced-colors__1440");
  await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1440", reducedMotion: "reduce" });
  await go(page, "/projects/"+EB); await page.waitForTimeout(2500);
  console.log("reduced-motion running animations on dashboard:", await page.evaluate(()=>document.getAnimations().map(a=>a.animationName||a.transitionProperty||a.constructor.name)));
  const el = page.getByRole("button",{name:/Switch project/}); await el.click(); await page.waitForTimeout(100);
  console.log("switcher open anims (reduce):", await page.evaluate(()=>document.getAnimations().map(a=>[a.animationName||a.transitionProperty, a.effect.getTiming().duration])));
  await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, "/projects/"+EB); await page.waitForTimeout(2500);
  await page.getByRole("button",{name:/Switch project/}).click(); await page.waitForTimeout(60);
  console.log("switcher open anims (normal):", await page.evaluate(()=>document.getAnimations().map(a=>[a.animationName||a.transitionProperty, a.effect.getTiming().duration])));
  await page.keyboard.press("Escape");
  await go(page, "/projects/new"); await page.waitForTimeout(1200);
  await page.getByLabel("Project name").fill("مسار الطبيعة"); await page.waitForTimeout(300);
  console.log("RTL name -> slug:", JSON.stringify(await page.getByLabel(/^Slug/).inputValue()), "dir", await page.getByLabel("Project name").getAttribute("dir"));
  await shot(page,"wizard-1__rtl-name__1440");
  await page.getByLabel("Project name").fill("Το μονοπάτι της Πάρνηθας και ο Δρόμος των Αρχαίων Δήμων της Αττικής – ένα πολύ μακρύ όνομα έργου για δοκιμή αναδίπλωσης"); await page.waitForTimeout(300);
  console.log("Greek long -> slug:", JSON.stringify(await page.getByLabel(/^Slug/).inputValue()));
  await page.getByRole("button",{name:/Create Project and continue/}).click({noWaitAfter:true}).catch(()=>{}); 
  await page.waitForTimeout(500);
  await shot(page,"wizard-1__greek-long__1440");
  console.log("ERR", await page.evaluate(()=>document.querySelector("form [data-error-summary]")?.innerText));
  await browser.close(); }
