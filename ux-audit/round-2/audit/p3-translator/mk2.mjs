import { call, closeAll } from "../../../tools/lib.mjs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const id = "04f082dd-3fca-4817-baac-036d5c729371";
for (const [h, t] of [["Where Athenians met", "The Agora was the place where Athenians met to trade, vote and argue."], [null, "Begin at the Panathenaic Way, the road that ran diagonally through the square."], ["The last stop", "Finish at the Stoa of Attalos, where the museum now stands."]]) {
  const blocks = []; if (h) blocks.push({ type: "heading", level: 2, text: h }); blocks.push({ type: "paragraph", text: t });
  await call("curator", "POST", `${P}/guides/${id}/blocks`, { blockType: "TEXT", translations: { en: { text: { blocks } } } }).catch(e => console.log(e.message.slice(0, 300)));
}
console.log((await call("curator", "GET", `${P}/guides/${id}`)).blocks.length);
await closeAll();
