import { fileURLToPath } from "node:url"; import path from "node:path";
export const here = path.dirname(fileURLToPath(import.meta.url));
export const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const shotp=(n)=>path.join(here,"shots",n+".png");
export const log=(...a)=>console.log(a.map(x=>typeof x==="string"?x:JSON.stringify(x)).join(" "));
export const rects=`(sel)=>[...document.querySelectorAll(sel)].map(e=>{const b=e.getBoundingClientRect();return {t:(e.getAttribute('aria-label')||e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,40),role:e.getAttribute('role')||e.tagName,sel:e.getAttribute('aria-selected'),x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width*10)/10,h:Math.round(b.height*10)/10}})`;
