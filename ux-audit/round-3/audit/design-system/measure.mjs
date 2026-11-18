import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const out = {};
const probe = () => page.evaluate(() => {
  const toRGBA = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) { const c = s.match(/color\(srgb ([^)]+)\)/); if (c) { const p = c[1].split(/[ /]+/).map(Number); return [p[0]*255,p[1]*255,p[2]*255,p[3]??1]; } return [0,0,0,0]; } const p = m[1].split(/[ ,/]+/).map(Number); return [p[0],p[1],p[2],p[3]??1]; };
  const lum = (c) => { const f = (v)=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4}; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); };
  const over = (top, bot) => { const a = top[3]; return [top[0]*a+bot[0]*(1-a), top[1]*a+bot[1]*(1-a), top[2]*a+bot[2]*(1-a), 1]; };
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = toRGBA(getComputedStyle(e).backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] === 1) break; } } let base=[255,255,255,1]; for (let i = stack.length-1;i>=0;i--) base = over(stack[i], base); return base; };
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width===0||r.height===0) return false; const cs = getComputedStyle(el); return cs.visibility!=="hidden"&&cs.display!=="none"&&+cs.opacity>0; };
  const type = {}, colors = {}, spacing = {}, radii = {}, shadows = {}, z = {}, trans = {}, caps = {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) { const t = walker.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el); if (!vis(el)) continue; if (el.closest(".sr-only,[aria-hidden=true]")&&0) continue;
    const cs = getComputedStyle(el); const k = `${cs.fontSize}/${cs.fontWeight}/${cs.lineHeight}`; type[k] = (type[k]||0)+1;
    if (cs.textTransform!=="none"||(cs.letterSpacing!=="normal"&&cs.letterSpacing!=="0px")) { const kk = `${cs.textTransform}|${cs.letterSpacing}|${cs.fontSize}`; (caps[kk] ||= []).push(el.tagName+"."+(el.className+"").slice(0,50)+":"+t.textContent.trim().slice(0,20)); }
    const fg = toRGBA(cs.color); const bg = bgOf(el); const f2 = fg[3]<1?over(fg,bg):fg; const l1=lum(f2), l2=lum(bg); const cr = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    const hex = (c)=>"#"+c.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");
    const ck = `${hex(f2)} on ${hex(bg)}`; const size = parseFloat(cs.fontSize); const large = size>=24||(size>=18.66&&+cs.fontWeight>=700);
    if (!colors[ck]) colors[ck] = { n:0, ratio:+cr.toFixed(2), large, sample: t.textContent.trim().slice(0,28), tag: el.tagName+"."+(el.className+"").slice(0,40) }; colors[ck].n++; }
  for (const el of document.querySelectorAll("body *")) { if (!vis(el)) continue; const cs = getComputedStyle(el);
    for (const p of ["paddingTop","paddingRight","paddingBottom","paddingLeft","marginTop","marginBottom","marginLeft","marginRight","rowGap","columnGap"]) { const v = cs[p]; if (v && v!=="0px"&&v!=="normal"&&v!=="auto") spacing[v]=(spacing[v]||0)+1; }
    const r = cs.borderTopLeftRadius; if (r!=="0px") radii[r]=(radii[r]||0)+1;
    if (cs.boxShadow!=="none") { const s = cs.boxShadow.replace(/rgba?\([^)]*\)/g,"C"); shadows[s]=(shadows[s]||0)+1; }
    if (cs.position!=="static" && cs.zIndex!=="auto") { const k=`${cs.position}:${cs.zIndex}`; (z[k] ||= []).push(el.tagName+"."+(el.className+"").slice(0,40)); }
    if (cs.transitionDuration!=="0s") { const k=`${cs.transitionDuration}|${cs.transitionTimingFunction}`; trans[k]=(trans[k]||0)+1; } }
  for (const k in z) z[k] = { n: z[k].length, ex: z[k].slice(0,3) };
  for (const k in caps) caps[k] = { n: caps[k].length, ex: caps[k].slice(0,3) };
  // controls
  const small = []; for (const el of document.querySelectorAll("button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=menuitem],[role=checkbox],[role=switch]")) { if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (r.width<32||r.height<32) { if (el.closest(".sr-only")) continue; small.push({ t: el.tagName+"."+(el.className+"").slice(0,40), n:(el.getAttribute("aria-label")||el.textContent||"").trim().slice(0,24), w:+r.width.toFixed(1), h:+r.height.toFixed(1) }); } }
  const anim = document.getAnimations().map(a=>({n:a.animationName||a.transitionProperty, d:a.effect?.getTiming().duration, e:a.effect?.getTiming().easing, it:a.effect?.getTiming().iterations})).slice(0,10);
  return { type, colors, spacing, radii, shadows, z, trans, caps, small, anim, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
});
async function shoot(name, path, wait = 1800) {
  try { await go(page, path); await page.waitForTimeout(wait); out[name] = await probe(); await page.screenshot({ path: `shots/${name}__default__${vp}.png` }); }
  catch (e) { out[name] = { error: String(e).slice(0, 200) }; }
}
const base = `/projects/${P}`;
const screens = { home: "/", dashboard: base, places: `${base}/places`, pois: `${base}/pois`, routes: `${base}/routes`, guides: `${base}/guides`, events: `${base}/events`, categories: `${base}/categories`, media: `${base}/media`, maps: `${base}/maps`, floorplans: `${base}/floor-plans`, navigation: `${base}/navigation`, preview: `${base}/preview`, translations: `${base}/translations`, languages: `${base}/languages`, overview: `${base}/overview`, surfaces: `${base}/surfaces` };
for (const [n, p] of Object.entries(screens)) await shoot(n, p);
// editors: first row link on lists
for (const [n, seg] of [["placeEditor","places"],["poiEditor","pois"],["routeEditor","routes"],["guideEditor","guides"],["eventEditor","events"],["categoryEditor","categories"],["assetEditor","media"]]) {
  try { await go(page, `${base}/${seg}`); await page.waitForTimeout(1500); const href = await page.evaluate((seg)=>{ const a=[...document.querySelectorAll(`a[href*="/${seg}/"]`)].find(a=>!/UX-R/.test(a.textContent)&&/\/[0-9a-f-]{36}/.test(a.getAttribute("href"))); return a?.getAttribute("href"); }, seg); if (!href) { out[n]={error:"no link"}; continue; } await shoot(n, href, 2500); out[n].href = href; } catch(e){ out[n]={error:String(e).slice(0,200)}; }
}
writeFileSync(`measure-${vp}.json`, JSON.stringify(out, null, 1));
await browser.close();
console.log("done", Object.keys(out).length);
