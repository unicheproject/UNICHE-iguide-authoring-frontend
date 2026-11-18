import { open, go } from "../../../tools/session.mjs";
export { open, go };
export const P="/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const D="C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/audit/p1-editor/";
export const shot=(page,n,full=false)=>page.screenshot({path:D+"shots/"+n+".png",fullPage:full});
export const t0=()=>Date.now();
export async function btns(page,sel="main"){return page.evaluate((sel)=>[...document.querySelectorAll(sel+" button,"+sel+" a,"+sel+" input,"+sel+" select,"+sel+" textarea,"+sel+" [role=tab]")].map(b=>(b.tagName+":"+(b.getAttribute("aria-label")||b.innerText||b.placeholder||b.name||b.id||"")).trim().replace(/\s+/g," ").slice(0,50)),sel);}
export const hdr=(page)=>page.evaluate(()=>{const m=document.querySelector("main");const out=[];for(const e of m.querySelectorAll("button,span,p,div")){if(e.children.length>2)continue;const r=e.getBoundingClientRect();if(r.top>56&&r.top<170&&e.innerText&&e.innerText.trim()&&r.height<60)out.push(e.innerText.trim().replace(/\s+/g," "))}return [...new Set(out)].slice(0,12).join(" | ")});
export async function fillBasics(page,n,{img="klepsydra",audio="audio-parthenon-overview",lat="37.9715",lon="23.7257"}={}){
  await page.locator("#f-summary").fill(`${n} summary for the R3 editor walk.`);
  await page.locator("#f-description").fill(`${n} description. A longer text about the object for visitors.`);
  await page.getByRole("button",{name:/Add\s*Primary image/}).click();
  await page.getByRole("button",{name:new RegExp("^"+img)}).click();
  await page.getByRole("button",{name:/Use this image/}).click();
  await page.getByRole("button",{name:/English : choose audio/}).click();
  await page.getByRole("button",{name:new RegExp(audio)}).first().click();
  await page.getByRole("button",{name:/Use this file/}).click();
  await page.locator("input[placeholder^='e.g. 37']").first().fill(lat);
  await page.locator("input[placeholder^='e.g. 23']").first().fill(lon);
  await page.locator("input[placeholder^='e.g. 23']").first().blur();
  await page.getByRole("button",{name:/Add QR code/}).click();
  await page.getByRole("button",{name:/Add Geo-proximity/}).click();
  await page.locator("input[placeholder^='e.g. 37']").nth(1).fill(lat);
  await page.locator("input[placeholder^='e.g. 23']").nth(1).fill(lon);
  await page.locator("input[placeholder^='e.g. 23']").nth(1).blur();
}
