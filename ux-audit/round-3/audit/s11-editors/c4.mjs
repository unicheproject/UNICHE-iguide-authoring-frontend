import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const vp=process.argv[2]||"1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, url("categories", IDS.category)); await settle(page,1500);
// icon radio arrows
await page.locator("input[name=cat-icon]").first().focus();
await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await settle(page,200);
console.log("icon after 2x Right:", await page.evaluate(()=>{const c=document.querySelector("input[name=cat-icon]:checked"); return c? c.value+" focus="+(document.activeElement===c):"none"}), await page.evaluate(()=>[...document.querySelectorAll("[aria-live],[role=status]")].map(e=>e.textContent.trim()).filter(Boolean).join(" || ")));
await page.keyboard.press("ArrowDown"); await settle(page,100);
console.log("icon after Down:", await page.evaluate(()=>document.querySelector("input[name=cat-icon]:checked")?.value));
console.log("icon radio sizes", await page.locator("input[name=cat-icon]").first().evaluate(e=>{const l=e.closest("label"); const r=l.getBoundingClientRect(); return Math.round(r.width)+"x"+Math.round(r.height)+" label="+l.textContent.trim()+" aria="+(e.getAttribute("aria-label")||"")}));
await page.locator("#setup").scrollIntoViewIfNeeded();
await page.locator("input[name=cat-icon]:checked").scrollIntoViewIfNeeded();
await shot(page,`category__icon-picked__${vp}`);
await page.getByRole("button",{name:"Save",exact:true}).click(); await settle(page,1500);
// activate
await page.locator("button",{hasText:/^Activate$/}).first().click().catch(async()=>{ await page.getByRole("button",{name:/Activate/}).first().click(); });
await settle(page,600);
console.log("ACT dialog:", await page.getByRole("dialog").innerText().then(s=>s.replace(/\n+/g," | ")).catch(e=>"none"));
await shot(page,`category__activate-confirm__${vp}`);
await page.getByRole("dialog").getByRole("button",{name:/^Activate$/}).click(); await settle(page,1800);
console.log("status after:", await page.locator("body").innerText().then(s=>s.match(/Status[\s\S]{0,200}/)?.[0].replace(/\n+/g," | ")));
// deactivate
await page.getByRole("button",{name:/Deactivate/}).first().click(); await settle(page,800);
console.log("DEACT:", await page.getByRole("dialog").innerText().then(s=>s.replace(/\n+/g," | ")).catch(e=>"none; "+e.message.slice(0,60)));
await shot(page,`category__deactivate-used__${vp}`);
await browser.close();
