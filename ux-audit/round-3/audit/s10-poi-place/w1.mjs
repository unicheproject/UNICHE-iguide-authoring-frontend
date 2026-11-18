import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await go(page, path("poiB")); await settle(page,2000);
  console.log("icon-only buttons:", await page.evaluate(()=>[...document.querySelectorAll("main button")].filter(b=>!b.textContent.trim().replace(/[^\w]/g,"")&&b.getBoundingClientRect().width).map(b=>(b.getAttribute("aria-label")||"?").slice(0,40)+" "+Math.round(b.getBoundingClientRect().width)+"x"+Math.round(b.getBoundingClientRect().height))));
  // attach focus: Replace primary image
  await page.getByRole("button",{name:/Replace/}).first().click(); await settle(page,1200);
  await page.getByRole("dialog").getByText("klepsydra").click(); await page.getByRole("button",{name:/Use this image/}).click(); await settle(page,1200);
  console.log("focus after replace:", await page.evaluate(()=>{const a=document.activeElement;return a.tagName+" "+(a.getAttribute("aria-label")||a.textContent).trim().slice(0,40)}));
  // discard this edit by Discard? header dirty -> reload leaves guard; just close
} finally { await browser.close(); }
