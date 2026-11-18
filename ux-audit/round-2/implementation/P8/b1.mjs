import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const BEACON="432c66f3-86b0-4a49-836b-e575f41fa19a", QR="0e570ab5-c25a-456f-8c1c-02e3b1a41cd7";
const ready = async (page) => { await page.waitForSelector("[data-preview-toolbar]", { timeout: 40000 }); await page.waitForTimeout(1500); };
const info = (page) => page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const t=document.querySelector("[data-preview-toolbar]").getBoundingClientRect(); return { frameTop: Math.round(f.getBoundingClientRect().top), scale: f.dataset.scale, toolbarH: Math.round(t.height), hscroll: document.documentElement.scrollWidth>innerWidth, hostOverflow: f.scrollWidth>f.clientWidth+1, caption: document.querySelector("section[role=region] p")?.textContent.trim().slice(0,160) }; });
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/preview`); await ready(page);
  console.log(vp, "web", JSON.stringify(await info(page)));
  await page.screenshot({ path: `after/preview-web-${vp}.png` });
  await page.getByRole("tab",{name:"Kiosk",exact:true}).click(); await page.waitForTimeout(600);
  console.log(vp, "kiosk", JSON.stringify(await info(page)));
  await page.screenshot({ path: `after/preview-kiosk-${vp}.png` });
  await page.getByRole("tab",{name:"Mobile",exact:true}).click(); await page.waitForTimeout(600);
  console.log(vp, "mobile", JSON.stringify(await info(page)));
  await page.screenshot({ path: `after/preview-mobile-${vp}.png` });
  await browser.close();
}
// trigger param
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  for (const [n,id] of [["beacon",BEACON],["qr",QR]]) {
    await go(page, `/projects/${P}/preview?trigger=${id}`); await ready(page);
    console.log(n, "selected surface:", await page.getByRole("tab",{selected:true}).allInnerTexts(), "chip:", await page.getByText(/^Fired:/).allInnerTexts(), "select:", await page.inputValue("#fire-trigger"));
    await page.screenshot({ path: `after/trigger-${n}-1440.png` });
  }
  await go(page, `/projects/${P}/preview?trigger=00000000-0000-0000-0000-000000000000`); await ready(page);
  console.log("unknown:", await page.locator("[role=status]").allInnerTexts());
  // Esc
  await go(page, `/projects/${P}/preview`); await ready(page);
  const btn = page.getByRole("button",{name:/Interact/});
  await btn.click(); await page.waitForTimeout(300);
  await page.locator("[data-preview-frame] button").first().focus();
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  console.log("after esc: interact focused:", await page.evaluate(()=>document.activeElement?.textContent.trim()), "pressed:", await btn.getAttribute("aria-pressed"));
  // AX tree while inert
  const cdp = await page.context().newCDPSession(page);
  const ax = async () => { const {nodes}=await cdp.send("Accessibility.getFullAXTree"); return nodes.filter(n=>!n.ignored && ["button","link","tab","textbox","searchbox"].includes(n.role?.value)).length; };
  console.log("AX actionable idle:", await ax());
  await btn.click(); await page.waitForTimeout(300); console.log("AX actionable interacting:", await ax());
  await page.keyboard.press("Escape");
  await browser.close();
}
// forced colours
{
  const { browser, page } = await open("admin", { viewport: "1280", forcedColors: "active" });
  await go(page, `/projects/${P}/preview`); await ready(page);
  await page.screenshot({ path: `after/preview-forced-1280.png` });
  console.log("forced selected tab styles:", await page.$$eval("[role=tab][aria-selected=true]", els=>els.map(e=>{const c=getComputedStyle(e);return e.textContent.trim()+": bg "+c.backgroundColor+" color "+c.color})));
  await browser.close();
}
