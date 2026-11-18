// Generates real media bytes: PNG/JPEG via a Chromium canvas, WebM via MediaRecorder, WAV and PDF by hand.
export async function browserMedia(context) {
  const page = await context.newPage();
  await page.goto("about:blank");
  const api = {
    async image(w, h, title, mime, hue, kind = "photo") {
      const b64 = await page.evaluate(({ w, h, title, mime, hue, kind }) => {
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d");
        if (kind === "plan") {
          g.fillStyle = "#f4efe4"; g.fillRect(0, 0, w, h);
          g.strokeStyle = "#3b3a36"; g.lineWidth = Math.max(4, w / 250);
          g.strokeRect(w * .05, h * .08, w * .9, h * .84);
          g.beginPath(); g.moveTo(w * .35, h * .08); g.lineTo(w * .35, h * .6); g.moveTo(w * .35, h * .6); g.lineTo(w * .95, h * .6);
          g.moveTo(w * .65, h * .6); g.lineTo(w * .65, h * .92); g.moveTo(w * .05, h * .45); g.lineTo(w * .35, h * .45); g.stroke();
          g.fillStyle = "rgba(59,58,54,.55)"; g.font = `${Math.round(h / 24)}px sans-serif`;
          ["Entrance", "Gallery A", "Gallery B", "Stairs", "Lift"].forEach((t, i) => g.fillText(t, w * (.08 + i * .17), h * (.2 + (i % 3) * .22)));
        } else {
          const gr = g.createLinearGradient(0, 0, w, h);
          gr.addColorStop(0, `hsl(${hue},45%,72%)`); gr.addColorStop(1, `hsl(${(hue + 50) % 360},55%,38%)`);
          g.fillStyle = gr; g.fillRect(0, 0, w, h);
          g.fillStyle = "rgba(255,255,255,.25)";
          for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * (.1 + i * .17), h * (.3 + (i % 2) * .4), Math.min(w, h) * (.06 + i * .015), 0, 7); g.fill(); }
          g.fillStyle = "rgba(255,255,255,.35)";
          for (let i = 0; i < 5; i++) g.fillRect(w * .12 + i * w * .16, h * .55, w * .06, h * .3); // columns
          g.fillRect(w * .08, h * .5, w * .84, h * .05);
        }
        g.fillStyle = kind === "plan" ? "#3b3a36" : "#fff"; g.textAlign = "center";
        const fs = Math.max(14, Math.round(Math.min(w, h) / 14)); g.font = `bold ${fs}px sans-serif`;
        const words = title.split(" "); let line = "", y = h * .12;
        for (const wd of words) { if (g.measureText(line + wd).width > w * .86) { g.fillText(line, w / 2, y); y += fs * 1.2; line = ""; } line += wd + " "; }
        g.fillText(line, w / 2, y);
        return c.toDataURL(mime, 0.85).split(",")[1];
      }, { w, h, title, mime, hue, kind });
      return Buffer.from(b64, "base64");
    },
    async video(seconds, title, hue) {
      const b64 = await page.evaluate(async ({ seconds, title, hue }) => {
        const c = document.createElement("canvas"); c.width = 640; c.height = 360;
        const g = c.getContext("2d");
        const stream = c.captureStream(15);
        const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
        const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        const done = new Promise((r) => (rec.onstop = r));
        rec.start(200);
        const t0 = performance.now();
        await new Promise((res) => {
          const draw = () => {
            const t = (performance.now() - t0) / 1000;
            g.fillStyle = `hsl(${(hue + t * 40) % 360},50%,35%)`; g.fillRect(0, 0, 640, 360);
            g.fillStyle = "#fff"; g.font = "bold 28px sans-serif"; g.textAlign = "center"; g.fillText(title, 320, 150);
            g.beginPath(); g.arc(320 + Math.cos(t * 3) * 120, 250 + Math.sin(t * 3) * 40, 24, 0, 7); g.fill();
            if (t < seconds) requestAnimationFrame(draw); else res();
          };
          draw();
        });
        rec.stop(); await done;
        const blob = new Blob(chunks, { type: "video/webm" });
        const buf = new Uint8Array(await blob.arrayBuffer()); let s = "";
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return btoa(s);
      }, { seconds, title, hue });
      return Buffer.from(b64, "base64");
    },
    async close() { await page.close(); },
  };
  return api;
}

/** 16-bit mono 22.05 kHz WAV: a soft two-tone melody so it is audible. */
export function wav(seconds, base = 330) {
  const rate = 22050, n = Math.round(rate * seconds), data = n * 2;
  const buf = Buffer.alloc(44 + data);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + data, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(data, 40);
  for (let i = 0; i < n; i++) {
    const t = i / rate, f = base * (1 + 0.5 * (Math.floor(t * 2) % 2));
    const env = Math.min(1, (n - i) / rate) * Math.min(1, i / 2000);
    buf.writeInt16LE(Math.round(Math.sin(2 * Math.PI * f * t) * 9000 * env), 44 + i * 2);
  }
  return buf;
}

/** A minimal valid one-page PDF with a title and a few lines. */
export function pdf(title, lines) {
  const esc = (s) => s.replace(/[()\\]/g, "\\$&").replace(/[^\x20-\x7e]/g, "?");
  let stream = `BT /F1 20 Tf 60 760 Td (${esc(title)}) Tj /F1 12 Tf`;
  lines.forEach((l) => (stream += ` 0 -22 Td (${esc(l)}) Tj`));
  stream += " ET";
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
