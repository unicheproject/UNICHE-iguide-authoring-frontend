import {open,goto,shot} from "./lib.mjs";
import fs from "fs";
const ids=JSON.parse(fs.readFileSync("ux-audit/round-1/audit/p3-translator/ids.json","utf8"));
const {browser,page}=await open("curator",{viewport:"1440"});
const t0=Date.now();
try{
 await goto(page,"pois/"+ids.poi);
 await page.locator("#f-summary").fill("A short English summary of the Acropolis hill for visitors.");
 await page.locator("#f-description").fill("English description: the rock above Athens, home of the Parthenon, visited by millions.");
 await page.getByRole("tab",{name:/Ελληνικά/i}).click();
 await page.locator("#f-title").fill("Ακρόπολη της Αθήνας");
 await page.locator("#f-summary").fill("Ο ιερός βράχος της Αθήνας με τον Παρθενώνα.");
 await page.locator("#f-description").fill("Ο βράχος της Ακρόπολης δεσπόζει πάνω από την πόλη. ".repeat(6)+"Ηλεκτροεγκεφαλογράφημα-Δημοκρατικοπαραδοσιακότατος_χωρίς_κενά_πάρα_πολύ_μακρύς_λέξη_ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ");
 await shot(page,"poi-editor__greek-filled-no-default-beside");
 // RTL probe in Italian tab
 await page.getByRole("tab",{name:/Italiano/i}).click();
 await page.locator("#f-title").fill("Acropoli di Atene");
 await page.locator("#f-summary").fill("שלום עולם — האקרופוליס של אתונה (Athens) 123");
 await page.locator("#f-description").fill("مرحبا بالعالم — أكروبوليس أثينا (Athens) 123");
 await shot(page,"poi-editor__rtl-typed-in-ltr-field");
 console.log(await page.evaluate(()=>["f-summary","f-description"].map(id=>{const e=document.getElementById(id);const s=getComputedStyle(e);return {id,dir:e.dir,lang:e.lang,direction:s.direction,textAlign:s.textAlign,unicodeBidi:s.unicodeBidi}})));
 await page.locator("#f-summary").fill("Il colle sacro di Atene con il Partenone.");
 await page.locator("#f-description").fill("La rocca dell'Acropoli domina la città.");
 await page.getByRole("button",{name:/^save$/i}).click();
 await page.waitForTimeout(2500);
 await shot(page,"poi-editor__saved-translations-card");
 console.log("elapsed s",(Date.now()-t0)/1000);
 console.log(await page.locator("aside, main").last().innerText().then(t=>t.match(/TRANSLATIONS[\s\S]{0,300}/i)?.[0]));
 // does translations card show tooltip/missing per field?
}finally{await browser.close();}
