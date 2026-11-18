import { open, go, base, shot } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base+"/pois");
await page.waitForSelector("h1"); await page.waitForTimeout(1500);
const r = await page.evaluate(async ()=>{
  await document.fonts.ready;
  const out={};
  const c=document.createElement("canvas").getContext("2d");
  for (const w of [400,500,600,700]) {
    c.font = `${w} 100px "Montserrat Variable"`;
    await document.fonts.load(`${w} 100px "Montserrat Variable"`, "xο");
    const m=(ch)=>{const t=c.measureText(ch); return {asc:+t.actualBoundingBoxAscent.toFixed(1), desc:+t.actualBoundingBoxDescent.toFixed(1), w:+t.width.toFixed(1)}};
    out[w]={x:m("x"),omicron:m("ο"),H:m("H"),Eta:m("Η"),n:m("n"),nu:m("ν"),line:{ascF:c.measureText("a").fontBoundingBoxAscent, descF:c.measureText("a").fontBoundingBoxDescent}, greekLine:{ascF:c.measureText("α").fontBoundingBoxAscent, descF:c.measureText("α").fontBoundingBoxDescent}};
  }
  const faces=[...document.fonts].map(f=>`${f.family} ${f.weight} ${f.status} ${f.unicodeRange.slice(0,40)}`);
  return {out,faces};
});
console.log(JSON.stringify(r,null,1));
await browser.close();
