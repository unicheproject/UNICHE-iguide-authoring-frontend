import { open, go, bearer, API } from "../../../tools/session.mjs";
const {page,browser}=await open("curator",{viewport:"1440"});
try{
const t=await bearer(page);
for(const u of ["/projects","/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5","/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois"]){
 try{const r=await fetch(API+u,{headers:{Authorization:"Bearer "+t}});const b=await r.text();console.log(u,r.status,b.slice(0,300));}catch(e){console.log(u,"ERR",String(e).slice(0,100))}}
}finally{await browser.close()}
