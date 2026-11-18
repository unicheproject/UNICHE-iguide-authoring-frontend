import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const s = await start(vp); const { page } = s;
async function openByName(name) {
  await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
  await page.fill("#media-search", name); await page.waitForTimeout(400);
  await page.locator("main ul li a", { hasText: name }).first().click();
  await page.waitForSelector("h1"); await page.waitForTimeout(2200);
}
const targets = [["UX-s13-media tone.wav","audio-draft"],["UX-s13-media clip.webm","video-draft"],["UX-s13-media leaflet.pdf","pdf-draft"],["audio-frieze-en","audio-active-used"],["video-dionysos-restoration","video-active-used"],["press-kit-2026","pdf-archived"],["acropolis-panorama","image-used3"],["meander-border","image-decorative"],["museum-shop","image-draft-noalt-used"]];
for (const [n, tag] of targets) {
  await openByName(n);
  await s.shot("editor__"+tag);
  const info = await page.evaluate(()=>{const m=document.querySelector("main"); return {txt:m.innerText.replace(/\n+/g," | ").slice(0,900), media:[...m.querySelectorAll("audio,video,img,iframe,object,a[target]")].map(e=>e.tagName+(e.alt?":alt="+e.alt:"")+(e.controls?":controls":"")+(e.getAttribute("aria-label")?":label="+e.getAttribute("aria-label"):"")).join(",")}});
  console.log("==",tag, JSON.stringify(info));
}
await s.browser.close();
