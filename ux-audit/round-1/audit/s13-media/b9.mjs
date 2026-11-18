import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const s = await start(vp); const { page } = s;
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
await page.fill("#media-search","UX-s13-media portrait"); await page.waitForTimeout(400);
await page.locator("main ul li a").first().click();
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
console.log("tabs:", await page.evaluate(()=>[...document.querySelectorAll("main [role=tab], main [role=tablist] *")].map(e=>e.tagName+":"+e.getAttribute("role")+":"+e.textContent.trim().slice(0,40)).join(" | ")));
await page.getByText("ΕΛΛΗΝΙΚΆ",{exact:false}).first().click(); await page.waitForTimeout(600);
await page.evaluate(()=>{const e=[...document.querySelectorAll("main label, main h3, main h2")].find(x=>/alternative/i.test(x.textContent)); e?.scrollIntoView({block:"center"})});
await s.shot("editor__greek-tab");
console.log(await page.evaluate(()=>{const m=document.querySelector("main"); const i=m.innerText.indexOf("ΕΛΛΗΝΙΚΆ"); return m.innerText.slice(i,i+900)}));
// type greek alt, check default text beside
await page.getByLabel(/Alternative text/i).first().fill("Μωβ δοκιμαστική εικόνα με κίονες.");
await s.shot("editor__greek-typed");
console.log("img in viewport:", await page.evaluate(()=>{const i=document.querySelector("main img"); const r=i.getBoundingClientRect(); return r.bottom>0 && r.top<innerHeight}));
// English tab alt, then Save
await page.getByText("ENGLISH",{exact:false}).first().click(); await page.waitForTimeout(300);
await page.getByLabel(/Alternative text/i).first().fill("A purple test image of columns for the UX audit.");
await page.getByRole("button",{name:"Save"}).click(); await page.waitForTimeout(1800);
await s.shot("editor__saved");
console.log("toast/alerts:", await page.evaluate(()=>[...document.querySelectorAll("[role=alert],[role=status],[aria-live]")].map(e=>e.textContent.trim().slice(0,200)).join("\n---\n")));
await page.evaluate(()=>{document.querySelector("main").scrollTop=0});
console.log("scrollTop0 text", await page.evaluate(()=>document.querySelector("main").innerText.slice(0,200)));
await page.getByRole("button",{name:"Activate"}).click(); await page.waitForTimeout(1800);
await page.evaluate(()=>{document.querySelector("main").scrollTop=0});
await s.shot("editor__activated");
console.log("after activate:", await page.evaluate(()=>[...document.querySelectorAll("[role=alert],[role=status],[aria-live]")].map(e=>e.textContent.trim().slice(0,200)).join("\n---\n")));
console.log(await page.evaluate(()=>document.querySelector("main").innerText.slice(0,500)));
// replace on ACTIVE
console.log("replace disabled", await page.getByRole("button",{name:/Replace file/i}).isDisabled());
await s.shot("editor__active-replace-blocked");
await s.browser.close();
