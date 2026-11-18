// Serves a production build of the app at http://localhost:5173 through Playwright routing (no server is started),
// so Tailwind config changes (not picked up by the running Vite process) can be measured. API calls pass through.
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon" };
export async function serveDist(context, dir = "C:/Users/mirto/w0a-dist") {
  // The routed page is not classed as local, so Chromium blocks its calls to the loopback API: relay them from Node.
  await context.route("http://localhost:8080/**", async (route) => {
    const cors = { "access-control-allow-origin": "http://localhost:5173", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "access-control-expose-headers": "*" };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), ...cors } });
  });
  await context.route("http://localhost:5173/**", async (route) => {
    const url = new URL(route.request().url());
    let file = normalize(join(dir, decodeURIComponent(url.pathname)));
    if (!file.startsWith(normalize(dir))) return route.abort();
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(dir, "index.html");
    await route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
  });
}
