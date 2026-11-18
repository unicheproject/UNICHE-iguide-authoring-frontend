import Keycloak, { type KeycloakTokenParsed } from "keycloak-js";
import { reactive, readonly } from "vue";
import { ConfigurationError, loadConfig, type PlatformConfig } from "./config";
import { markSessionEnded } from "@/stores/sessionNotice";

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

/** What stopped the sign-in, so the error page can word the next step: only `unreachable` and `session-loop` can be retried by the author. */
export type SessionErrorKind = "configuration" | "unreachable" | "unusable-token" | "session-loop";

export interface SessionError {
  kind: SessionErrorKind;
  /** Short headline, in the author's words. */
  title: string;
  /** What happened and what to do next, with no operator vocabulary. */
  detail: string;
  /** Operator detail (names of settings, hosts, clients) for the collapsed "Technical details". */
  technical: string | null;
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
        "configuration",
        "iGuide CMS is not set up yet",
        "This copy of the CMS is missing settings it needs to sign you in. Nothing is wrong with your account. Tell the person who runs this CMS, and include the technical details below.",
        `Missing: ${e.missing.join(", ")}. Set them in public/config.js or as VITE_* variables in .env.local.`,
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
      "unreachable",
      "Sign-in with UNICHE did not start",
      "The UNICHE sign-in service did not answer. Check your connection and try again. If it keeps happening, tell the person who runs this CMS.",
      `Keycloak at ${config.idpUrl} did not answer the sign-in check. Either it is not reachable, or the ` +
        `"${config.clientId}" client is not registered in the "${config.realm}" realm with ` +
        `${window.location.origin}/* as a redirect URI and ${window.location.origin} as a web origin.`,
    );
    return;
  }

  // The sign-in response (code, state, session_state) must not stay in the address bar or in a Back entry (C2-14).
  clearCallbackFromAddressBar();
  if (!authenticated) {
    state.status = "unauthenticated";
    return;
  }
  acceptToken();
}

/** Browser-session key holding when the last sign-in redirect started (a time, never a token). */
const REDIRECT_KEY = "iguide.signInRedirectAt";
/** A persistent `401` may send the author to sign-in at most once in this many milliseconds (plan 2.4). */
const REDIRECT_WINDOW_MS = 30_000;

/**
 * Sends the browser to the UNICHE sign-in and back to this URL. It notes the time (never a token), so a `401` that
 * survives signing in cannot send the author round and round: a second one inside 30 seconds ends on the "session keeps
 * ending" page instead (`sessionExpired`).
 */
export function login(): Promise<void> {
  try {
    window.sessionStorage.setItem(REDIRECT_KEY, String(Date.now()));
  } catch {
    // Storage blocked: sign-in still works, only the loop cap is lost.
  }
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

/**
 * Replaces the current history entry with the address without the sign-in response (fragment or query), so Back never
 * returns to a URL that carries a spent authorization code. Replaces, never pushes: the history length is unchanged.
 */
function clearCallbackFromAddressBar(): void {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const query = url.searchParams;
  if (!CALLBACK_PARAMS.some((name) => fragment.has(name) || query.has(name))) return;
  CALLBACK_PARAMS.forEach((name) => {
    fragment.delete(name);
    query.delete(name);
  });
  url.hash = fragment.toString();
  window.history.replaceState(window.history.state, "", url.toString());
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

function recentRedirect(): boolean {
  try {
    return Date.now() - Number(window.sessionStorage.getItem(REDIRECT_KEY) ?? 0) < REDIRECT_WINDOW_MS;
  } catch {
    return false;
  }
}

/**
 * The session ended: shows the "Your session ended" dialog (edits stay in this browser) and waits for the author to sign
 * in again, instead of redirecting silently. Never resolves. When the session ended again right after a sign-in, the
 * page says so rather than looping (C1-62).
 */
export async function sessionExpired(): Promise<never> {
  if (recentRedirect()) {
    fail(
      "session-loop",
      "Your session keeps ending",
      "You signed in, but the CMS was refused again straight away. Your unsaved edits are still in this browser. Wait a moment and sign in again; if it keeps happening, tell the person who runs this CMS.",
      "A request returned 401 within 30 seconds of the last sign-in redirect, so no further automatic redirect was made.",
    );
  } else {
    markSessionEnded();
  }
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
    fail(
      "unusable-token",
      "Your sign-in cannot be used by the CMS",
      "UNICHE signed you in, but the CMS cannot read who you are. Tell the person who runs this CMS.",
      "The token carries no subject.",
    );
    return;
  }
  // The backends reject any token without the platform audience. Checking it here turns a
  // misconfigured Keycloak client into a clear message instead of a 401 on the first API call.
  if (!hasAudience(token, platformConfig().audience)) {
    fail(
      "unusable-token",
      "Your sign-in cannot be used by the CMS",
      "UNICHE signed you in, but this CMS is not yet allowed to act for you. Nothing is wrong with your account. Tell the person who runs this CMS.",
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

function fail(kind: SessionErrorKind, title: string, detail: string, technical: string | null): void {
  state.status = "error";
  state.user = null;
  state.error = { kind, title, detail, technical };
}

function requireKeycloak(): Keycloak {
  if (!keycloak) {
    throw new Error("Keycloak used before the session was initialized");
  }
  return keycloak;
}
