import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { initSession } from "./platform/auth";
import { router } from "./router";

// The session is settled before the router starts, because keycloak-js reads the sign-in response from
// the URL and then rewrites it; the router must only ever see the cleaned URL. index.html shows a
// placeholder until then.
//
// The router captured `location` when `router.ts` was imported, i.e. before the sign-in response was removed from the
// address bar, and would put `#state=...&code=...` back on its first navigation. Navigating once to the cleaned
// location first replaces that entry (a replace: no extra history entry, Back never returns to a spent code; D-103/C3-84).
void initSession().then(async () => {
  const { pathname, search, hash } = window.location;
  await router.replace(`${pathname}${search}${hash}`).catch(() => undefined);
  createApp(App).use(router).mount("#app");
});
