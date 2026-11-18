import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
for (const k of ["places","pois","routes","guides","events","categories"]) {
  const t0=Date.now();
  await go(page, `/projects/${P}/${k}`); await page.getByRole("heading",{level:1}).first().waitFor();
  await page.waitForFunction(()=>document.querySelectorAll("tbody tr, .list-card, [role=row]").length>0,null,{timeout:20000}).catch(()=>{});
  const ms=Date.now()-t0; await settle(page,700);
  await shot(page,`${k}-list__default__1440`);
  const info=await page.evaluate(()=>{
    const m=document.querySelector("main");
    const ths=[...m.querySelectorAll("th")].map(t=>t.innerText.trim()||"(empty)");
    const labels=[...m.querySelectorAll("label,legend")].map(l=>l.innerText.trim().slice(0,30)).filter(Boolean);
    const rows=m.querySelectorAll("tbody tr").length;
    const first=m.querySelector("tbody tr");
    const h=first? Math.round(first.getBoundingClientRect().height):0;
    const tool=m.querySelector("[role=search]"); const th=tool?Math.round(tool.getBoundingClientRect().height):0;
    const sel=[...m.querySelectorAll("select")].map(s=>[...s.options].map(o=>o.text).slice(0,5).join("/"));
    return {ths,labels,rows,rowH:h,toolbarH:th,sel, head:m.querySelector("h1").parentElement.innerText.replace(/\n/g," | ").slice(0,120), foot:(m.innerText.match(/Showing[^\n]*/)||[""])[0], firstRow:first?.innerText.replace(/\s+/g," ").slice(0,200)};
  });
  console.log(k, "ms",ms, JSON.stringify(info));
  const kebab=page.locator("tbody tr").first().getByRole("button",{name:/Actions for/});
  if(await kebab.count()){ await kebab.click(); await settle(page,300); console.log("  MENU:", (await page.getByRole("menu").innerText()).replace(/\n/g," | ")); await shot(page,`${k}-list__row-menu__1440`); await page.keyboard.press("Escape"); }
}
await browser.close();
