import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const vp=process.argv[2]||"1440";
const { browser, page } = await open("admin", { viewport: vp });
const kinds=[["pois",IDS.poia],["routes",IDS.route],["guides",IDS.guide],["events",IDS.event],["categories",IDS.category]];
for (const [k,id] of kinds){
  await go(page, url(k,id)); await settle(page,1400);
  const m = await page.evaluate(()=>{
    const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:Math.round(r.x*10)/10,y:Math.round(r.y*10)/10,w:Math.round(r.width),h:Math.round(r.height)}};
    const h1=document.querySelector("h1"); const tabs=document.querySelector("[role=tablist]");
    const textsH=[...document.querySelectorAll("h2")].find(h=>/^Texts/.test(h.textContent.trim()));
    const firstCard=tabs?.parentElement?.nextElementSibling;
    const panel=document.querySelector("[role=tabpanel]");
    const secs=[...document.querySelectorAll("section.editor-section")].map(s=>({id:s.id,pad:getComputedStyle(s).padding,h:Math.round(s.getBoundingClientRect().height),h2pad:getComputedStyle(s.querySelector("h2>span")||s.querySelector("h2")).paddingTop+"/"+getComputedStyle(s.querySelector("h2>span")||s.querySelector("h2")).paddingLeft, bodyPad:(s.querySelector("[id$=-body]")?getComputedStyle(s.querySelector("[id$=-body]")).padding:"")}));
    const side=document.querySelector("aside, [data-side], .editor-side"); 
    const status=[...document.querySelectorAll("h2")].find(h=>/^Status/.test(h.textContent.trim()))?.closest("section,div");
    const save=[...document.querySelectorAll("button")].find(b=>/^Save/.test(b.textContent.trim()));
    return {h1:R(h1), h1font:getComputedStyle(h1).fontSize+"/"+getComputedStyle(h1).fontWeight, textsH:R(textsH), tabs:R(tabs), panel:R(panel), gapHeadingTabs: tabs&&textsH? Math.round((tabs.getBoundingClientRect().top-textsH.getBoundingClientRect().bottom)*10)/10:null, status:R(status), save:R(save), secs}
  });
  console.log(k, JSON.stringify(m));
}
await browser.close();
