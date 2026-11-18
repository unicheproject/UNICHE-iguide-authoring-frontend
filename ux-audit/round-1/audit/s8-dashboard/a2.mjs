import { open, go, shot, P, E, text, problem, VIEWPORTS } from "./lib.mjs";
const BLOCK = (n) => {
  const b = [
    { resourceType: "PROJECT", resourceId: null, title: null, languageCode: null, path: "surfaces", code: "NO_SURFACE_ENABLED" },
    { resourceType: "POI", resourceId: "11111111-1111-1111-1111-111111111111", title: "Η Αρχαία Αγορά της Αθήνας και ο Ναός του Ηφαίστου — εκτενής τίτλος για δοκιμή περιτύλιξης κειμένου", languageCode: "el", path: "translations.el.title", code: "MISSING_DEFAULT_LANGUAGE_VALUE" },
    { resourceType: "ROUTE", resourceId: "22222222-2222-2222-2222-222222222222", title: "Coastal walk", languageCode: null, path: "stops", code: "ROUTE_WITHOUT_ACTIVE_STOP" },
    { resourceType: "GUIDE", resourceId: "33333333-3333-3333-3333-333333333333", title: "Story of the harbour", languageCode: "en", path: "blocks[2].image", code: "MISSING_ALTERNATIVE_TEXT" },
    { resourceType: "POI", resourceId: "44444444-4444-4444-4444-444444444444", title: "Lighthouse", languageCode: null, path: "categoryId", code: "DANGLING_REFERENCE" },
  ];
  return b.slice(0, n);
};
const states = (id) => ({
  loading: async (page) => { await page.route("**/readiness", (r) => new Promise(() => {})); },
  e503: async (page) => { await page.route("**/readiness", (r) => r.fulfill(problem(503, "PLATFORM_UNAVAILABLE"))); },
  e403: async (page) => { await page.route("**/readiness", (r) => r.fulfill(problem(403, "FORBIDDEN"))); },
  e500: async (page) => { await page.route("**/readiness", (r) => r.fulfill(problem(500, "INTERNAL_ERROR"))); },
  block5: async (page) => { await page.route("**/readiness", (r) => r.fulfill({ json: { activatable: false, blocking: BLOCK(5), warnings: [{ resourceType: "POI", resourceId: "55555555-5555-5555-5555-555555555555", title: "Kafeneio", languageCode: "it", path: "translations.it.description", code: "MISSING_TRANSLATION" }] } })); },
  block1: async (page) => { await page.route("**/readiness", (r) => r.fulfill({ json: { activatable: false, blocking: BLOCK(1), warnings: [] } })); },
  clean: async (page) => { await page.route("**/readiness", (r) => r.fulfill({ json: { activatable: true, blocking: [], warnings: [] } })); },
  slow: async (page) => { await page.route("**/readiness", async (r) => { await new Promise(s => setTimeout(s, 5000)); r.continue(); }); },
});
const only = process.argv[2];
for (const [nm, id] of [["pop", P], ["emp", E]]) {
  for (const vp of ["1440", "1280", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${id}`); await page.waitForTimeout(2500);
    await shot(page, `${nm}__real__${vp}`, true);
    if (vp === "zoom200") await shot(page, `${nm}__real-viewport__${vp}`, false);
    await browser.close();
  }
  for (const st of ["loading", "e503", "e403", "block5", "block1", "clean", "e500"]) {
    for (const vp of (st === "block5" || st === "e503" ? ["1440", "1024", "768"] : ["1440"])) {
      const { browser, page } = await open("curator", { viewport: vp });
      await states(id)[st](page);
      await go(page, `/projects/${id}`); await page.waitForTimeout(st === "loading" ? 1500 : 2500);
      await shot(page, `${nm}__${st}__${vp}`, true);
      if (st === "block5" && vp === "1440") {
        await page.getByRole("button", { name: /Show all/ }).click(); await shot(page, `${nm}__block5-expanded__${vp}`, true);
      }
      await browser.close();
    }
  }
}
