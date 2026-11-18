import { open, go, shot, POP, t, focusDesc, run } from "./lib.mjs";
const tab = (page, n) => page.getByRole("tab", { name: n, exact: true });
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1280" });
  await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1200);
  // keyboard walk
  await page.locator("h1").click(); 
  await page.evaluate(()=>{document.activeElement.blur(); window.scrollTo(0,0);});
  const seq=[]; for (let i=0;i<30;i++){ await page.keyboard.press("Tab"); seq.push(await focusDesc(page)); }
  console.log("TAB SEQ:\n"+seq.map((s,i)=>i+1+" "+s).join("\n"));
  // headings and landmarks inside page
  console.log("inert count", await page.evaluate(()=>document.querySelectorAll("[inert]").length), "buttons in frame", await page.evaluate(()=>document.querySelectorAll("[data-preview-frame] button, [data-preview-frame] a").length));
  // axe-like: accessible tree snippet of region
  console.log(await page.locator("section[role=region]").first().ariaSnapshot().then(s=>s.split("\n").slice(0,25).join("\n")));
  console.log("region label:", await page.locator("section[role=region]").first().getAttribute("aria-label"));
  // Skip link
  await page.evaluate(()=>{document.activeElement.blur(); window.scrollTo(0,0);});
  await page.locator("a:has-text('Skip preview')").focus(); await page.keyboard.press("Enter"); console.log("after skip:", await focusDesc(page));
  await page.keyboard.press("Tab"); console.log("next tab:", await focusDesc(page));
  // Interact
  await page.getByRole("button",{name:/Interact with the preview/}).click(); await page.waitForTimeout(400);
  console.log("after interact focus:", await focusDesc(page), "|", await page.getByRole("button",{name:/Stop interacting/}).count());
  await shot(page,"preview__interacting","1280");
  await page.keyboard.press("Tab"); console.log("tab1", await focusDesc(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  console.log("after Esc, stop btn present:", await page.getByRole("button",{name:/Stop interacting/}).count(), await focusDesc(page));
  // interacting with Esc inside frame
  await page.getByRole("button",{name:/Interact with the preview/}).click();
  await page.locator("[data-preview-frame] a, [data-preview-frame] button").first().focus().catch(()=>{});
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  console.log("after Esc inside frame, stop btn present:", await page.getByRole("button",{name:/Stop interacting/}).count(), await focusDesc(page));
  // live region
  console.log("live regions:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e=>(e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,80))));
  await browser.close();
});
