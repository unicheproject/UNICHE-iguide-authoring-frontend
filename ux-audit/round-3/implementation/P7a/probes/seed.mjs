import { open, bearer, API, P } from "./h.mjs";
const { browser, page } = await open("admin");
const auth = await bearer(page);
function wav(sec) { const n = 8000 * sec; const b = Buffer.alloc(44 + n); b.write("RIFF", 0); b.writeUInt32LE(36 + n, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(8000, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write("data", 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b; }
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const [name, type, buf] of [["UX-R3-P7a tiny.png", "image/png", png], ["UX-R3-P7a narration.wav", "audio/wav", wav(2)]]) {
  const fd = new FormData(); fd.append("file", new Blob([buf], { type }), name);
  const r = await fetch(`${API}/projects/${P}/assets`, { method: "POST", headers: { authorization: auth }, body: fd });
  console.log(name, r.status, (await r.text()).slice(0, 120));
}
await browser.close();
