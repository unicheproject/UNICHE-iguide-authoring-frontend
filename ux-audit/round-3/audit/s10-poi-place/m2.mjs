import { open, go, shot, settle, path } from "./lib2.mjs";
const LONG = "Το Μουσείο της Ακρόπολης και η αρχαία κληρονομιά της Αθήνας: μια εκτενής περιγραφή για τον επισκέπτη που θέλει να μάθει περισσότερα";
const RTL = "متحف الأكروبوليس في أثينا – جولة مع المرشد الصوتي";
const info = (page)=>page.evaluate(()=>{const h=document.querySelector("h1");const b=h.getBoundingClientRect();const hdr=document.querySelector(".editor-header").getBoundingClientRect();const btns=[...document.querySelectorAll(".editor-header button, .editor-header [role=button]")].map(x=>{const r=x.getBoundingClientRect();return x.textContent.trim().slice(0,12)+"@"+Math.round(r.x)+"/"+Math.round(r.y)+" "+Math.round(r.width)+"x"+Math.round(r.height)});const chips=[...document.querySelectorAll(".editor-header span")].filter(s=>/^(Active|Draft|Pending changes)$/.test(s.textContent.trim())).map(s=>{const r=s.getBoundingClientRect();return s.textContent.trim()+" y"+Math.round(r.y)+" h"+Math.round(r.height)});return `h1 "${h.textContent.trim().slice(0,30)}" h${Math.round(b.height)} w${Math.round(b.width)} lineH ${getComputedStyle(h).lineHeight} lines ${Math.round(b.height/parseFloat(getComputedStyle(h).lineHeight))} clamp ${getComputedStyle(h).webkitLineClamp} overflowX ${h.scrollWidth}/${h.clientWidth} | header h${Math.round(hdr.height)} | chips ${chips.join(",")} | h1 y${Math.round(b.y)} | ${btns.join(" ; ")}`});
for (const vp of process.argv[2].split(",")) {
  const { browser, page } = await open("admin", { viewport: vp });
  try {
    await go(page, path("poiB")); await settle(page,2000);
    await page.locator("#f-title").fill(LONG + " " + LONG); await page.keyboard.press("Control+s"); await settle(page,2500);
    await shot(page,`poiB__long-greek-title-saved__${vp}`); console.log(vp,"LONG", await info(page));
    await page.locator("#f-title").fill(RTL); await page.keyboard.press("Control+s"); await settle(page,2500);
    await shot(page,`poiB__rtl-title-saved__${vp}`); console.log(vp,"RTL", await info(page));
  } finally { await browser.close(); }
}
