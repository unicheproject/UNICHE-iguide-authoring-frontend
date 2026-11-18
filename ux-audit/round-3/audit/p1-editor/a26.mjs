import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const T=async(n,f)=>{try{await f()}catch(e){console.log("ERR",n,e.message.slice(0,150))}};
const { browser, page } = await open("admin",{viewport:"1440"});
const A=P+"/pois/d2e48820-a468-4539-9f62-545eed5b06a6";
await T("kbd",async()=>{
  await go(page,P+"/pois"); await page.waitForSelector("tbody tr");
  await page.keyboard.press("/");
  console.log("slash->",await page.evaluate(()=>document.activeElement.placeholder));
  // Tab count from search to first row link
  let n=0; for(;n<40;n++){ await page.keyboard.press("Tab"); const d=await page.evaluate(()=>{const a=document.activeElement;return !!a.closest("tbody")}); if(d)break;}
  console.log("tabs search->first row control:",n+1, await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.getAttribute("aria-label")||document.activeElement.innerText||"").slice(0,40)));
  // Keyboard to other kinds: Tab from skip link to Routes link count
  await go(page,P+"/pois"); await page.waitForSelector("tbody tr");
  let k=0; await page.evaluate(()=>document.body.focus());
  for(;k<40;k++){ await page.keyboard.press("Tab"); const t=await page.evaluate(()=>document.activeElement.innerText||""); if(/^Routes/.test(t.trim()))break;}
  console.log("tabs from top to Routes:",k+1);
  await page.keyboard.press("Enter"); await page.waitForURL(/routes/); await page.waitForTimeout(500);
  console.log("after nav focus:",await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.innerText||"").slice(0,40)), "slash on routes:", await (async()=>{await page.keyboard.press("/");return page.evaluate(()=>document.activeElement.placeholder)})());
});
await T("hover",async()=>{
  await go(page,A); await page.waitForSelector("#f-title"); await page.waitForTimeout(800);
  await page.locator("#f-summary").fill("hover test edit");
  const b=page.getByRole("button",{name:"Save draft"}).first();
  const css=async()=>b.evaluate(e=>{const s=getComputedStyle(e);return s.backgroundColor+"|"+s.color+"|"+s.boxShadow.slice(0,30)+"|"+s.transform});
  console.log("rest:",await css());
  await b.hover(); await page.waitForTimeout(300); console.log("hover:",await css());
  await page.mouse.down(); await page.waitForTimeout(200); console.log("active:",await css()); await page.mouse.up();
  await page.mouse.move(10,400);
  await b.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  console.log("focus:",await b.evaluate(e=>getComputedStyle(e).outline+"|"+getComputedStyle(e).outlineOffset));
  await shot(page,"button-focus__save-draft__1440");
});
await T("5xx save",async()=>{
  await page.route("**/api/v1/**/pois/*", r=>{ if(["PUT","PATCH","POST"].includes(r.request().method())&&!/triggers/.test(r.request().url())) return r.fulfill({status:500,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Internal",status:500,code:"INTERNAL_ERROR",requestId:"req-r3-500",detail:"SECRET"})}); r.continue();});
  await page.keyboard.press("Control+s"); await page.waitForTimeout(1800);
  console.log("5xx live/hdr:",await hdr(page).then(s=>s.slice(0,260)));
  console.log("focus:",await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.innerText||"").slice(0,80)));
  console.log("secret leaked:",await page.evaluate(()=>/SECRET/.test(document.body.innerText)),"reqid:",await page.evaluate(()=>/req-r3-500/.test(document.body.innerText)));
  await shot(page,"poi-editor__save-5xx__1440");
  await page.unroute("**/api/v1/**/pois/*");
});
await T("offline",async()=>{
  await page.context().setOffline(true); await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
  await shot(page,"poi-editor__save-offline__1440");
  console.log("offline hdr:",await hdr(page).then(s=>s.slice(0,200)), "| banner:",await page.evaluate(()=>[...document.querySelectorAll("[role=alert],[role=status]")].map(e=>e.innerText.trim().slice(0,100)).filter(Boolean)));
  await page.context().setOffline(false);
});
await T("restore",async()=>{
  await go(page,A); await page.waitForTimeout(1200);
  console.log("restore row:",await page.evaluate(()=>/Restore/.test(document.body.innerText)), (await page.evaluate(()=>{const e=[...document.querySelectorAll("main *")].find(x=>/Restore/.test(x.innerText||"")&&x.children.length<5);return e?.closest("div")?.innerText||""})).replace(/\n+/g," | ").slice(0,300));
  await shot(page,"poi-editor__restore-draft-row__1440");
});
await browser.close();
