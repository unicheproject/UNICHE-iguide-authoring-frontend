import { open, go, shot, settle, path } from "./lib2.mjs";
const key=process.argv[2]; const vp=process.argv[3]??"1440";
const { browser, page } = await open("admin", { viewport: vp });
try {
  await go(page, path(key)); await settle(page,2000);
  const out = await page.evaluate(() => {
    const main=document.querySelector("main"); const st=main.scrollTop;
    const b=e=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y+st),Math.round(r.width),Math.round(r.height)].join(",")};
    // direct children cards of form column: find the Texts heading's ancestors
    const form = document.querySelector("#placement")?.parentElement;
    const kids=[...form.children].map(c=>`${c.tagName}#${c.id||"-"}.${(c.className||"").toString().slice(0,30)} [${b(c)}] ${c.textContent.trim().slice(0,30)}`);
    const side = [...document.querySelectorAll("main aside, main [class*=sticky]")].map(e=>`${e.tagName}.${e.className.toString().slice(0,50)} [${b(e)}] pos ${getComputedStyle(e).position} top ${getComputedStyle(e).top} maxH ${getComputedStyle(e).maxHeight}`);
    return {scrollH:main.scrollHeight, formKids:kids, side};
  });
  console.log(JSON.stringify(out,null,1));
} finally { await browser.close(); }
