/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IDP_URL?: string;
  readonly VITE_REALM?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_AUDIENCE?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// For editors whose TypeScript service does not load the Vue language tools (vue-tsc resolves the real files).
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
