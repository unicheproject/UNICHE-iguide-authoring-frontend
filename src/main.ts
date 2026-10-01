import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { initSession } from "./platform/auth";
import { router } from "./router";

// The session is settled before the router starts, because keycloak-js reads the sign-in response from
// the URL and then rewrites it; the router must only ever see the cleaned URL. index.html shows a
// placeholder until then.
void initSession().then(() => {
  createApp(App).use(router).mount("#app");
});
