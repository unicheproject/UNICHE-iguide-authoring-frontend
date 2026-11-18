import {open,goto,shot} from "./lib.mjs";
const {browser,page}=await open("curator",{viewport:"1440"});
const rows=async()=>page.locator("tbody tr").count();
const titles=async()=>(await page.locator("tbody tr").evaluateAll(r=>r.map(x=>x.innerText.split("\n").filter(Boolean).find(t=>t.length>3&&!/^[⠿▲▼]/.test(t))))).slice(0,4);
try{
 await goto(page,"pois");
 console.log("total",await rows());
 const input=page.locator("input[placeholder^=Search]").first();
 async function setLang(label){
   await page.getByRole("button",{name:/filters/i}).click();
   await page.locator("select").last().selectOption({label});
   await page.keyboard.press("Escape"); await page.waitForTimeout(300);
 }
 for(const lang of ["All languages","Ελληνικά","English","Italiano"]){
  await goto(page,"pois");
  if(lang!=="All languages") await setLang(lang);
  for(const q of ["Ακρόπολη","ακροπολη","ΑΚΡΟΠΟΛΗ","Acropolis","Parthenon","Παρθενώνας","παρθενωνας","Partenone","frieze","Ζωφόρος"]){
   await input.fill(q); const t0=Date.now(); await page.waitForTimeout(1500);
   console.log(lang,"|",q,"|",await rows(),JSON.stringify(await titles()));
   if((lang==="Ελληνικά"||lang==="All languages")&&(q==="ακροπολη"||q==="Ακρόπολη")) await shot(page,`pois-search__${lang==="All languages"?"all":"el"}-${q}`);
  }
 }
}finally{await browser.close();}
