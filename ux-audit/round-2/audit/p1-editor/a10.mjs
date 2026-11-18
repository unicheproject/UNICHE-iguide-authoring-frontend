import { open, go, shot, P, settle } from "./lib.mjs";
import { fill } from "./flow.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const log=[]; page.on("response", r=>{ if(r.url().includes("/api/v1") && r.request().method()!=="GET") log.push(r.request().method()+" "+r.url().split("/api/v1")[1].replace(/[0-9a-f-]{36}/g,"ID")+" "+r.status()+" @"+(Date.now()-T)) });
let T=Date.now();
const specs=[["UX-R2-p1-editor Kore Corridor","Acropolis Museum","Pottery and Everyday Life","audio-peplos-kore","peplos-kore",0.4,0.4,"key"],["UX-R2-p1-editor Στοά Θέατρο Long Greek Title Αρχαίο","Theatre of Dionysus","Monuments and Temples","audio-frieze-en","frieze-detail",0.6,0.55,"btn"]];
const ids=[];
for (const [title,place,cat,audio,img,fx,fy,mode] of specs) {
  await go(page, `/projects/${P}/pois`);
  await page.getByRole("button", { name: /new point of interest/i }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel(/^Title/).fill(title);
  await d.getByLabel("Place").selectOption({ label: place });
  await d.getByLabel("Category").selectOption({ label: cat });
  await d.getByLabel(/Exhibit code/).fill("R2-"+(mode==="key"?"K":"B"));
  if(mode==="key"){ await page.keyboard.press("Enter"); console.log("submitted via Enter in code field"); } else await d.getByRole("button", { name: /create and open/i }).click();
  await page.waitForURL(/pois\/[0-9a-f-]{36}/);
  const id=page.url().match(/pois\/([0-9a-f-]{36})/)[1]; ids.push(id); console.log(title,id);
  await fill(page,id,audio,img,fx,fy,title);
  log.length=0; T=Date.now();
  if(mode==="key"){ await page.locator("body").click({position:{x:700,y:20}}).catch(()=>{}); await page.keyboard.press("Control+s"); } else await page.getByRole("button",{name:/^Save$/}).click();
  await page.getByRole("button",{name:/Saving/}).first().waitFor({timeout:3000}).catch(()=>console.log("no saving state seen"));
  await page.waitForFunction(()=>![...document.querySelectorAll("button")].some(b=>/Saving/.test(b.textContent)),null,{timeout:30000});
  console.log(mode,"save ms", Date.now()-T, log.join(" | "));
  await settle(page,500);
  await shot(page,"poi-editor__saved-"+mode+"__1440");
}
console.log(ids.join(" "));
await browser.close();
