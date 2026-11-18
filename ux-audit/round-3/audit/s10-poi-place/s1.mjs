import { open, go, shot, settle, path, P } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1700});
  await go(page, path("poiB")); await settle(page,2500);
  await page.getByRole("button",{name:/practical details/i}).click(); await settle(page,300);
  const out = await page.evaluate(()=>{
    const main=document.querySelector("main"); const st=main.scrollTop;
    const R=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y+st),w:Math.round(b.width),h:Math.round(b.height)}};
    const res={};
    // cards: elements with rounded border inside the form column
    const cards=[...document.querySelectorAll("main .rounded-lg, main [class*=rounded-xl], main section.editor-section")];
    const seen=new Set(); const rows=[];
    for (const c of [...document.querySelectorAll("section.editor-section"), ...document.querySelectorAll("aside > *")]) { const cs=getComputedStyle(c); const inner=c.firstElementChild; const ics=inner?getComputedStyle(inner):cs; rows.push(`${c.id||c.querySelector("h2")?.textContent.trim().slice(0,22)} | ${JSON.stringify(R(c))} | pad ${cs.padding}/${ics.padding} | radius ${cs.borderRadius}/${ics.borderRadius} | border ${ics.borderTopWidth} ${ics.borderTopColor} | shadow ${ics.boxShadow.slice(0,40)}`); }
    res.cards=rows;
    // field rhythm in Title field
    const rh=[]; for (const id of ["f-title","f-summary","f-lat","t-1-code","f-place","f-code"]) { const f=document.getElementById(id); if(!f) continue; const lab=document.querySelector(`label[for=${id}]`); const hint=document.getElementById(id+"-hint"); const err=document.getElementById(id+"-error"); const fr=f.getBoundingClientRect(), lr=lab?.getBoundingClientRect(), hr=hint?.getBoundingClientRect(); rh.push(`${id}: label h${Math.round(lr?.height||0)} fs ${lab?getComputedStyle(lab).fontSize:""}/${lab?getComputedStyle(lab).fontWeight:""} | label->hint ${hr?Math.round(hr.top-lr.bottom):"-"} | hint h${hr?Math.round(hr.height):"-"} fs ${hint?getComputedStyle(hint).fontSize:""} | hint->field ${hr?Math.round(fr.top-hr.bottom):Math.round(fr.top-lr.bottom)} | field h${Math.round(fr.height)} fs ${getComputedStyle(f).fontSize}`); }
    res.fields=rh;
    // text/heading sizes
    res.headings=[...document.querySelectorAll("main h1,main h2,main h3")].map(h=>`${h.tagName} ${getComputedStyle(h).fontSize}/${getComputedStyle(h).fontWeight}/${getComputedStyle(h).lineHeight} "${h.textContent.trim().slice(0,28)}"`);
    // gaps between cards in form column
    const secs=[...document.querySelectorAll("section.editor-section")].map(s=>s.getBoundingClientRect());
    res.gaps=secs.slice(1).map((r,i)=>Math.round(r.top-secs[i].bottom));
    // texts card: find the card containing #f-title
    const tc=document.getElementById("f-title").closest("div[class*=rounded],section"); res.textsCard=JSON.stringify(R(tc))+" "+tc.className.slice(0,80);
    // side/form top alignment
    res.sideTop=R(document.querySelector(".side-more")); res.textsH=R([...document.querySelectorAll("main h2")].find(h=>h.textContent.trim().startsWith("Texts")));
    // input heights / button heights
    res.btnHeights=[...new Set([...document.querySelectorAll("main button")].filter(b=>b.getBoundingClientRect().width).map(b=>Math.round(b.getBoundingClientRect().height)))].join(",");
    return res;
  });
  console.log(JSON.stringify(out,null,1));
} finally { await browser.close(); }
