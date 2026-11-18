// Throwaway: mounts the scaffold demo over the running app (same router instance). Loaded by capture.mjs.
import { createApp } from "vue";
import { router } from "@/router";
import ListDemo from "./ListDemo.vue";

export function mountDemo(): void {
  document.getElementById("w03-demo")?.remove();
  const host = document.createElement("div");
  host.id = "w03-demo";
  host.style.cssText = "position:fixed;inset:0;z-index:30;overflow:auto;background:hsl(var(--background));padding:24px";
  host.setAttribute("tabindex", "-1");
  const scroller = document.createElement("div");
  scroller.id = "main";
  host.append(scroller);
  document.body.append(host);
  createApp(ListDemo).use(router).mount(scroller);
}
