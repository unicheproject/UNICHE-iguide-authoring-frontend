/*
 * Test data through the backend API, so each test starts from a Project of its own instead of whatever the stack
 * holds. The token comes from the local Keycloak (`dev/keycloak`, direct access grants on `iguide-web`); the live
 * realm is never used.
 */
const IDP_URL = process.env.IDP_URL ?? "http://localhost:8180";
export const API_URL = process.env.API_URL ?? "http://localhost:8080/iguide/api/v1";
export const USER = process.env.E2E_USER ?? "curator";
export const PASSWORD = process.env.E2E_PASSWORD ?? "curator";
/** "Museum of Cycladic Art" in `dev/catalogue-mock/fixture.json`, which the test user manages. */
const ORGANISATION = process.env.E2E_ORGANISATION ?? "5d1e7a52-3f0b-4b8e-9c61-0e2a7c4b9f10";

let cached: { token: string; until: number } | null = null;

async function token(): Promise<string> {
  if (cached && Date.now() < cached.until) return cached.token;
  const response = await fetch(`${IDP_URL}/realms/uniche/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "password", client_id: "iguide-web", username: USER, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`Keycloak refused the test user: ${response.status} ${await response.text()}`);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, until: Date.now() + (body.expires_in - 30) * 1000 };
  return cached.token;
}

/** Calls the backend as the test user; any status but the expected one fails the test with the problem details. */
export async function api<T = unknown>(method: string, path: string, body?: unknown, expected?: number): Promise<T> {
  const response = await fetch(API_URL + path, {
    method,
    headers: { authorization: `Bearer ${await token()}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (expected ? response.status !== expected : !response.ok) {
    throw new Error(`${method} ${path} answered ${response.status}: ${text}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Uploads one file to the Project's media library. */
export async function upload(projectId: string, name: string, type: string, bytes: Uint8Array<ArrayBuffer>): Promise<{ id: string }> {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), name);
  const response = await fetch(`${API_URL}/projects/${projectId}/assets`, {
    method: "POST",
    headers: { authorization: `Bearer ${await token()}` },
    body: form,
  });
  if (!response.ok) throw new Error(`Upload answered ${response.status}: ${await response.text()}`);
  return (await response.json()) as { id: string };
}

interface Template {
  id: string;
  defaultStylePreset: string;
  supportedSurfaces: string[];
  defaultLanguages: { languageCode: string; displayName: string; direction: string }[];
}

/**
 * A new Project in the test organisation, initialized from the first Template with Greek as the default language
 * and English, on the web surface.
 */
export async function newProject(label: string): Promise<{ id: string; name: string }> {
  const run = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const name = `E2E ${label} ${run}`;
  const project = await api<{ id: string }>("POST", `/organizations/${ORGANISATION}/projects`, {
    name,
    slug: `e2e-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${run}`,
  });
  const { templates } = await api<{ templates: Template[] }>("GET", "/templates");
  const template = templates[0];
  await api("POST", `/projects/${project.id}/initialize`, {
    templateId: template.id,
    stylePreset: template.defaultStylePreset,
    languages: [
      { languageCode: "el", displayName: "Ελληνικά", direction: "LTR" },
      { languageCode: "en", displayName: "English", direction: "LTR" },
    ],
    defaultLanguage: "el",
    surfaces: [template.supportedSurfaces.includes("WEB") ? "WEB" : template.supportedSurfaces[0]],
  });
  return { id: project.id, name };
}

/** A silent PCM WAV file: 8-bit mono at 8 kHz, so 8000 bytes make one second. */
export function wav(seconds: number): Uint8Array<ArrayBuffer> {
  const data = Math.round(8000 * seconds);
  const bytes = new Uint8Array(44 + data);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  ascii(0, "RIFF");
  view.setUint32(4, 36 + data, true);
  ascii(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  ascii(36, "data");
  view.setUint32(40, data, true);
  return bytes;
}
