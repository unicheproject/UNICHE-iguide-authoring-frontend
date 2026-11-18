import {open,goto} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
try{
 for(const k of ["places","pois","routes","guides","events","categories"]){
  await goto(page,k);
  const r=await page.evaluate(()=>{const c={};let rows=0;
   document.querySelectorAll("tbody tr").forEach(tr=>{rows++;tr.querySelectorAll("span.sr-only").forEach(s=>{const m=/^(.+): (complete|partly translated|not translated)$/.exec(s.textContent.trim());if(m){c[m[1]]??={};c[m[1]][m[2]]=(c[m[1]][m[2]]||0)+1;}})});return {rows,c}});
  console.log(k,JSON.stringify(r));
 }
}finally{await browser.close();}
