import { start, go, P } from "./common.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const s = await start("1440"); const { page } = s;
for (const k of kinds) {
  await go(page, `${P}/${k}`);
  await page.waitForSelector("tbody tr"); await page.waitForTimeout(500);
  // filters popover
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page.waitForTimeout(300);
  const filt = await page.evaluate(() => { const d=document.querySelector('[aria-label="Filters"][role=dialog]'); return d? d.innerText.replace(/\n+/g," | "):null; });
  console.log(k, "FILTERS:", filt);
  await s.shot(`${k}__filters-open`);
  await page.keyboard.press("Escape");
  // search no match
  const search = page.locator("input[type=search]");
  await search.fill("zzzqq"); await page.waitForTimeout(400);
  await s.shot(`${k}__filtered-empty`);
  console.log(k, "EMPTY:", await page.evaluate(()=>document.querySelector("main .py-12, main [class*=py-12]")?.innerText));
  console.log(k, "URL after search:", page.url());
  await search.fill("");
  // tab path of first row
  await page.locator("input[type=search]").focus();
  const seq=[];
  for (let i=0;i<16;i++){ await page.keyboard.press("Tab"); seq.push(await page.evaluate(()=>{const e=document.activeElement; return (e.getAttribute("aria-label")||e.innerText||e.tagName).trim().slice(0,28)+"@"+Math.round(e.getBoundingClientRect().height)+"x"+Math.round(e.getBoundingClientRect().width);})); }
  console.log(k,"TAB:",seq.join(" > "));
  await s.shot(`${k}__keyboard-focus`);
  // sizes
  console.log(k,"SIZES", JSON.stringify(await page.evaluate(()=>{const r=document.querySelector("tbody tr"); return [...r.querySelectorAll("button,a")].map(b=>(b.getAttribute("aria-label")||b.innerText).trim().slice(0,20)+":"+Math.round(b.getBoundingClientRect().width)+"x"+Math.round(b.getBoundingClientRect().height));})));
}
await s.browser.close();
