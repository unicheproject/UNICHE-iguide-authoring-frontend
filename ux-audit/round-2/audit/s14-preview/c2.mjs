import { open, go, shot, POP, t, focusDesc, run } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await open("curator", { viewport: "1280" });
  await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1200);
  const cdp = await context.newCDPSession(page);
  const count = async () => { const {nodes} = await cdp.send("Accessibility.getFullAXTree"); const live = nodes.filter(n=>!n.ignored); return {buttons: live.filter(n=>n.role?.value==="button").length, links: live.filter(n=>n.role?.value==="link").length, headings: live.filter(n=>n.role?.value==="heading").map(n=>n.name?.value).slice(0,12), total: live.length}; };
  console.log("idle", JSON.stringify(await count()));
  console.log("inert els", await page.evaluate(()=>[...document.querySelectorAll("[inert]")].map(e=>e.tagName+"."+e.className.slice(0,40)+" btns:"+e.querySelectorAll("button").length)));
  await page.getByRole("button",{name:/Interact with the preview/}).click(); await page.waitForTimeout(300);
  console.log("interacting", JSON.stringify(await count()));
  // press Escape with focus on stop button, in frame, on body
  for (const where of ["stop","frame"]) {
    if (where==="stop") await page.getByRole("button",{name:/Stop interacting/}).focus(); else await page.locator("[data-preview-frame] button").nth(3).focus();
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    console.log("Esc from", where, "-> still interacting:", await page.getByRole("button",{name:/Stop interacting/}).count());
  }
  // click inside frame navigates? 
  await page.locator("[data-preview-frame] button:has-text('Places')").first().click(); await page.waitForTimeout(500);
  await shot(page,"preview__interacting-places","1280");
  console.log(await page.locator("section[role=region] p").first().innerText());
  // does the region label/caption update on stand-in navigation? and can author get back "Home"?
  await page.getByRole("button",{name:/Stop interacting/}).click(); await page.waitForTimeout(300);
  console.log("after stop: screen retained?", await page.locator("[data-preview-frame]").innerText().then(s=>s.slice(0,200).replace(/\n/g," ")));
  await page.getByRole("tab",{name:"Mobile",exact:true}).click(); await page.waitForTimeout(400);
  console.log("after surface change:", await page.locator("[data-preview-frame]").innerText().then(s=>s.slice(0,120).replace(/\n/g," ")));
  await browser.close();
});
