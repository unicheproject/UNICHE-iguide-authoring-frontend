import Keycloak, { type KeycloakTokenParsed } from "keycloak-js";
import { reactive, readonly } from "vue";
import { ConfigurationError, loadConfig, type PlatformConfig } from "./config";

/**
 * The CMS session against the shared UNICHE Keycloak realm.
 *
 * Keycloak authenticates; the Catalogue authorizes. This module only proves who the user is: it
 * obtains tokens with Authorization Code + PKCE, keeps them in memory (never in browser storage), and
 * refreshes them silently. What the user may do comes from `/me/authorization` and from the backend's
 * per-Project Catalogue check, never from token claims.
 */

export type SessionStatus = "initializing" | "unauthenticated" | "authenticated" | "error";

export interface SessionUser {
  subject: string;
  displayName: string;
  /** "M. Papadaki" form shown in the header; falls back to `displayName`. */
  shortName: string;
  username: string | null;
  email: string | null;
  initials: string;
}

export interface SessionError {
  title: string;
  detail: string;
}

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  error: SessionError | null;
}

/** Seconds of remaining validity below which a token is refreshed before use. */
const MIN_TOKEN_VALIDITY_SECONDS = 30;

const state = reactive<SessionState>({
  status: "initializing",
  user: null,
  error: null,
});

export const session = readonly(state);

let keycloak: Keycloak | null = null;
let config: PlatformConfig | null = null;

export function platformConfig(): PlatformConfig {
  if (!config) {
    throw new Error("Platform configuration requested before the session was initialized");
  }
  return config;
}

/**
 * Checks for an existing realm session without showing a login page. A user who is already signed in to
 * another UNICHE tool, or who arrives from the Platform Portal, lands in the CMS directly.
 */
export async function initSession(): Promise<void> {
  try {
    config = loadConfig();
  } catch (e) {
    if (e instanceof ConfigurationError) {
      fail(
        "The CMS is not configured",
        `Set ${e.missing.join(", ")} in public/config.js or as VITE_* variables in .env.local.`,
      );
      return;
    }
    throw e;
  }

  keycloak = new Keycloak({
    url: config.idpUrl,
    realm: config.realm,
    clientId: config.clientId,
  });
  keycloak.onTokenExpired = () => {
    void refreshToken(MIN_TOKEN_VALIDITY_SECONDS);
  };

  let authenticated: boolean;
  try {
    authenticated = await keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      // The session-status iframe depends on third-party cookies, which browsers now block. Expiry is
      // handled by token refresh instead.
      checkLoginIframe: false,
    });
  } catch {
    // Keycloak answers an unknown client or a disallowed redirect URI with its own error page, which
    // never reports back to the silent check, so both look like a timeout from here.
    fail(
      "Sign-in with UNICHE could not start",
      `Keycloak at ${config.idpUrl} did not answer the sign-in check. Either it is not reachable, or the ` +
        `"${config.clientId}" client is not registered in the "${config.realm}" realm with ` +
        `${window.location.origin}/* as a redirect URI and ${window.location.origin} as a web origin.`,
    );
    return;
  }

  if (!authenticated) {
    state.status = "unauthenticated";
    return;
  }
  acceptToken();
}

export function login(): Promise<void> {
  return requireKeycloak().login({ redirectUri: returnUrl() });
}

/** Parameters of a sign-in response that keycloak-js appends to the URL fragment. */
const CALLBACK_PARAMS = [
  "code",
  "state",
  "session_state",
  "iss",
  "error",
  "error_description",
  "error_uri",
  "kc_action",
  "kc_action_status",
];

/**
 * The current URL without the parameters of an earlier sign-in response. Keycloak rejects a redirect URI
 * whose fragment carries `code` ("Invalid parameter: redirect_uri"), so a sign-in started from a URL that
 * still holds a response would end on Keycloak's error page.
 */
function returnUrl(): string {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (CALLBACK_PARAMS.some((name) => fragment.has(name))) {
    CALLBACK_PARAMS.forEach((name) => fragment.delete(name));
    url.hash = fragment.toString();
  }
  return url.toString();
}

export function logout(): Promise<void> {
  state.user = null;
  return requireKeycloak().logout({ redirectUri: `${window.location.origin}/` });
}

/**
 * Returns a bearer token valid for at least `MIN_TOKEN_VALIDITY_SECONDS`, refreshing it first when
 * needed. When the refresh fails the realm session is over, and the user is sent back to login.
 */
export async function getAccessToken(): Promise<string> {
  await refreshToken(MIN_TOKEN_VALIDITY_SECONDS);
  const token = requireKeycloak().token;
  if (!token) {
    await sessionExpired();
  }
  return token!;
}

/**
 * Forces a refresh regardless of the remaining lifetime. Used after a `401`, which means the token
 * was revoked or expired early even though the clock said it was still valid.
 */
export async function forceTokenRefresh(): Promise<void> {
  await refreshToken(-1);
}

/** Sends the user back to Keycloak and returns to the current URL afterwards. Never resolves. */
export async function sessionExpired(): Promise<never> {
  await login();
  return new Promise<never>(() => {});
}

async function refreshToken(minValidity: number): Promise<void> {
  try {
    await requireKeycloak().updateToken(minValidity);
  } catch {
    await sessionExpired();
  }
}

function acceptToken(): void {
  const token = requireKeycloak().tokenParsed;
  if (!token?.sub) {
    fail("Sign-in returned an unusable token", "The token carries no subject.");
    return;
  }
  // The backends reject any token without the platform audience. Checking it here turns a
  // misconfigured Keycloak client into a clear message instead of a 401 on the first API call.
  if (!hasAudience(token, platformConfig().audience)) {
    fail(
      "Your sign-in cannot be used by the CMS",
      `The access token does not carry the "${platformConfig().audience}" audience. ` +
        `The "${platformConfig().clientId}" client needs an audience mapper in Keycloak.`,
    );
    return;
  }

  state.user = toUser(token);
  state.error = null;
  state.status = "authenticated";
}

function hasAudience(token: KeycloakTokenParsed, audience: string): boolean {
  const aud = token.aud;
  return Array.isArray(aud) ? aud.includes(audience) : aud === audience;
}

function toUser(token: KeycloakTokenParsed): SessionUser {
  const username = stringClaim(token, "preferred_username");
  const email = stringClaim(token, "email");
  const given = stringClaim(token, "given_name");
  const family = stringClaim(token, "family_name");
  const displayName = stringClaim(token, "name") ?? username ?? email ?? token.sub!;
  return {
    subject: token.sub!,
    displayName,
    shortName: given && family ? `${given[0].toUpperCase()}. ${family}` : displayName,
    username,
    email,
    initials: initialsOf(given, family, displayName),
  };
}

function stringClaim(token: KeycloakTokenParsed, claim: string): string | null {
  const value = (token as Record<string, unknown>)[claim];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function initialsOf(given: string | null, family: string | null, displayName: string): string {
  if (given && family) {
    return (given[0] + family[0]).toUpperCase();
  }
  const words = displayName.split(/[\s._@-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : displayName.slice(0, 2);
  return letters.toUpperCase();
}

function fail(title: string, detail: string): void {
  state.status = "error";
  state.user = null;
  state.error = { title, detail };
}

function requireKeycloak(): Keycloak {
  if (!keycloak) {
    throw new Error("Keycloak used before the session was initialized");
  }
  return keycloak;
}
