import { open, go, shot, POP, t, run, axe, focusDesc, log, start } from "./lib.mjs";
const NOM = /nominatim\.openstreetmap\.org/;
const rows = [
 { place_id: 1, display_name: "Apollonas, Naxos, Cyclades, Aegean Islands, Greece", name:"Apollonas", type:"village", osm_type:"node", osm_id: 11, boundingbox:["37.10","37.12","25.50","25.53"], addresstype:"village" },
 { place_id: 2, display_name: "Κεραμεικός, Αθήνα, Δήμος Αθηναίων, Περιφερειακή ενότητα Κεντρικού Τομέα Αθηνών, Αττική, Greece", name:"Κεραμεικός", type:"archaeological_site", osm_type:"way", osm_id: 12, boundingbox:["37.9738","37.9798","23.7103","23.7197"], addresstype:"suburb" },
 { place_id: 3, display_name: "Heathrow Airport, London Borough of Hillingdon, London, Greater London, England, TW6, United Kingdom", name:"Heathrow Airport", type:"aerodrome", osm_type:"relation", osm_id: 13, boundingbox:["51.4","51.5","-0.5","-0.4"], addresstype:"aeroway" },
];
await run(async () => { try {
  const vp = process.argv[2] || "1440";
  const { browser, page } = await start(vp); log("=== b1", vp);
  page.on("pageerror", (e) => log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps`); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "New map" }).click(); await page.waitForTimeout(1500);
  log("FOCUS after open", await focusDesc(page));
  const dlg = page.getByRole("dialog");
  const h = async () => (await dlg.boundingBox());
  log("DLG open", JSON.stringify(await h()));
  await shot(page, "new-map__open", vp);
  // empty submit
  const sb = page.getByRole("button", { name: /^Search/ }); log("SEARCH-BTN", await sb.evaluate(e=>({name:e.getAttribute("aria-label"),text:e.innerText,desc:e.getAttribute("aria-describedby"), dis:e.disabled, ad:e.getAttribute("aria-disabled"), title:e.title, descText: e.getAttribute("aria-describedby") ? document.getElementById(e.getAttribute("aria-describedby"))?.textContent : null})));
  await shot(page, "new-map__empty", vp);
  const modes = [["429",429],["403",403],["500",500],["503",503],["404",404],["offline",0],["empty",-1]];
  for (const [label, code] of modes) {
    await page.unroute(NOM).catch(()=>{});
    await page.route(NOM, (r) => code===0 ? r.abort("internetdisconnected") : code===-1 ? r.fulfill({status:200, contentType:"application/json", body:"[]"}) : r.fulfill({ status: code, body: "x" }));
    await page.getByLabel("Find area").fill("Naxos"); await page.getByRole("button", { name: /^Search/ }).click(); await page.waitForTimeout(700);
    const alert = await dlg.locator('[role=alert],[role=status]').allInnerTexts();
    log("ERR", label, JSON.stringify(alert), JSON.stringify(await h()));
    if (vp==="1440" || label==="429") await shot(page, `new-map__search-${label}`, vp);
  }
  await page.unroute(NOM);
  await page.route(NOM, (r) => r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify(rows) }));
  await page.getByLabel("Find area").fill("Naxos"); await page.getByRole("button", { name: /^Search/ }).click(); await page.waitForTimeout(900);
  log("DLG results", JSON.stringify(await h()), "focus", await focusDesc(page));
  await shot(page, "new-map__results", vp);
  log("RESULTS", JSON.stringify(await dlg.locator('ul[aria-label="Search results"] button').evaluateAll(b=>b.map(x=>({t:x.innerText.replace(/\n/g," | "),h:Math.round(x.getBoundingClientRect().height)})))));
  await dlg.locator('ul[aria-label="Search results"] button').nth(1).click(); await page.waitForTimeout(1800);
  log("DLG picked", JSON.stringify(await h()), "focus", await focusDesc(page));
  await shot(page, "new-map__picked-greek", vp);
  log("NAME", await page.getByLabel("Map name").inputValue());
  log("BOUNDS", JSON.stringify(await Promise.all(["Min latitude","Max latitude","Min longitude","Max longitude"].map(async l=>[l, await page.getByLabel(l).inputValue()]))));
  // typed bounds invalid
  const tests = [["Min latitude","abc"],["Max latitude","95"],["Max latitude","37,9798"],["Min longitude","-181"],["Min latitude","99,9"]];
  for (const [l,v] of tests) {
    await page.getByLabel(l).fill(v); await page.getByLabel(l).press("Tab"); await page.waitForTimeout(250);
    log("TYPED", l, v, JSON.stringify(await dlg.locator('[id$="-err"],[role=alert],.text-danger').allInnerTexts()), "inv", await page.getByLabel(l).getAttribute("aria-invalid"), "val", await page.getByLabel(l).inputValue());
  }
  await shot(page, "new-map__bounds-invalid", vp);
  log("RESET btn", await page.getByRole("button",{name:"Reset to search result"}).count());
  await page.getByRole("button",{name:"Reset to search result"}).click().catch(()=>{});
  await page.waitForTimeout(500);
  log("BOUNDS after reset", JSON.stringify(await Promise.all(["Min latitude","Max latitude","Min longitude","Max longitude"].map(async l=>[l, await page.getByLabel(l).inputValue()]))));
  await shot(page, "new-map__reset", vp);
  await axe(page, "new-map");
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  log("closed", await page.getByRole("dialog").count(), "focus", await focusDesc(page));
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,400)); } });
