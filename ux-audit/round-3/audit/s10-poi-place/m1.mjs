import { open, go, shot, settle, path } from "./lib2.mjs";
const LONG = "Το Μουσείο της Ακρόπολης και η αρχαία κληρονομιά της Αθήνας: μια εκτενής περιγραφή για τον επισκέπτη που θέλει να μάθει περισσότερα";
const RTL = "متحف الأكروبوليس في أثينا – جولة مع المرشد الصوتي";
for (const vp of process.argv[2].split(",")) {
  const { browser, page } = await open("admin", { viewport: vp });
  try {
    await go(page, path("poiB")); await settle(page,2000);
    await page.locator("#f-title").fill(RTL); await settle(page,400);
    await shot(page,`poiB__rtl-title__${vp}`);
    const r1 = await page.evaluate(()=>{const h=document.querySelector("h1");const b=h.getBoundingClientRect();const t=document.querySelector("#f-title");const hdr=document.querySelector(".editor-header").getBoundingClientRect();return `h1 dir=${h.getAttribute("dir")} h${Math.round(b.height)} x${Math.round(b.x)} w${Math.round(b.width)} | field dir=${t.getAttribute("dir")||getComputedStyle(t).direction} align ${getComputedStyle(t).textAlign} | header h${Math.round(hdr.height)} | chips: ${[...document.querySelectorAll(".editor-header [class*=chip],.editor-header [class*=badge]")].map(c=>Math.round(c.getBoundingClientRect().y)+"/"+Math.round(c.getBoundingClientRect().height)).join(",")}`});
    console.log(vp,"RTL", r1);
    await page.locator("#f-title").fill(LONG + " " + LONG); await settle(page,500);
    await shot(page,`poiB__long-greek-title__${vp}`);
    const r2 = await page.evaluate(()=>{const h=document.querySelector("h1");const b=h.getBoundingClientRect();const t=document.querySelector("#f-title").getBoundingClientRect();const hdr=document.querySelector(".editor-header").getBoundingClientRect();const btns=[...document.querySelectorAll(".editor-header button")].map(x=>{const r=x.getBoundingClientRect();return x.textContent.trim().slice(0,14)+"@"+Math.round(r.x)+"/"+Math.round(r.y)+" "+Math.round(r.width)+"x"+Math.round(r.height)});return `h1 h${Math.round(b.height)} lines ${Math.round(b.height/parseFloat(getComputedStyle(h).lineHeight))} clamp ${getComputedStyle(h).webkitLineClamp} scrollW ${h.scrollWidth}/${h.clientWidth} | title field h${Math.round(t.height)} | header y${Math.round(hdr.y)} h${Math.round(hdr.height)} | ${btns.join(" ; ")}`});
    console.log(vp,"LONG", r2);
  } finally { await browser.close(); }
}
