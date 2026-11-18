import {open,goto,shot} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 for(const k of ["places","pois","routes","guides","events","categories"]){
  await goto(page,k);
  const rows=await page.evaluate(()=>[...document.querySelectorAll("tbody tr, [role=row]")].map(r=>{
    const t=r.innerText.split("\n").filter(Boolean);
    const miss=[...r.querySelectorAll("span.sr-only")].map(s=>s.textContent).filter(x=>/not translated|partly/.test(x));
    return {title:t.find(x=>x.length>3&&!/^[⠿▲▼]/.test(x)),miss};
  }));
  const withMiss=rows.filter(r=>r.miss.length);
  console.log(k,"rows",rows.length,"with gaps",withMiss.length, "pagination/loadmore:", await page.getByText(/load more|show more|next/i).count());
  await shot(page,`${k}-list__default`,"1440");
 }
}finally{await browser.close();}
