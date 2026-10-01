/**
 * Platform configuration for the CMS.
 *
 * A deployment injects `window.__UNICHE_CONFIG__` through `public/config.js`, so one build serves every
 * environment. Local development falls back to `VITE_*` variables from `.env.local`. No value has a
 * default: a missing one stops the CMS with a configuration error instead of silently pointing at the
 * wrong platform instance.
 */
export interface PlatformConfig {
  /** Keycloak base URL, without `/realms/...`. */
  idpUrl: string;
  realm: string;
  /** This CMS's public OIDC client (Authorization Code + PKCE). */
  clientId: string;
  /** Audience every access token must carry to be accepted by the platform backends. */
  audience: string;
  /** Authoring API base, ending in `/api/v1`. */
  apiBaseUrl: string;
}

interface InjectedConfig {
  IDP_URL?: string;
  REALM?: string;
  CLIENT_ID?: string;
  AUDIENCE?: string;
  API_BASE_URL?: string;
}

declare global {
  interface Window {
    __UNICHE_CONFIG__?: InjectedConfig;
  }
}

export class ConfigurationError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Missing platform configuration: ${missing.join(", ")}`);
    this.name = "ConfigurationError";
    this.missing = missing;
  }
}

export function loadConfig(): PlatformConfig {
  const injected = window.__UNICHE_CONFIG__ ?? {};
  const env = import.meta.env;

  const values = {
    IDP_URL: injected.IDP_URL || env.VITE_IDP_URL,
    REALM: injected.REALM || env.VITE_REALM,
    CLIENT_ID: injected.CLIENT_ID || env.VITE_CLIENT_ID,
    AUDIENCE: injected.AUDIENCE || env.VITE_AUDIENCE,
    API_BASE_URL: injected.API_BASE_URL || env.VITE_API_BASE_URL,
  };

  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new ConfigurationError(missing);
  }

  return {
    idpUrl: stripTrailingSlash(values.IDP_URL!),
    realm: values.REALM!,
    clientId: values.CLIENT_ID!,
    audience: values.AUDIENCE!,
    apiBaseUrl: stripTrailingSlash(values.API_BASE_URL!),
  };
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
