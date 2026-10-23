import { apiRequestWithHeaders } from "./api";

/**
 * One language of a Resource's texts (iGuide spec 07 section 14; backend D-031, D-032), as the Translation
 * workspace saves them. A DRAFT Resource is written in place; an ACTIVE one through its working copy, whose version
 * comes back in `X-Working-Copy-Version` and goes with the next save. The types are hand-written until the generated
 * client exists (GAPS.md G-001).
 */

export type TranslatedKind = "places" | "pois" | "routes" | "guides" | "events" | "categories";

/** Which versions a save sends: the live row's, and the working copy's once there is one. */
export interface TranslationVersions {
  version: number;
  workingCopyVersion: number | null;
}

/** The Resource's read DTO as it now reads (the copy for an ACTIVE one), and the copy's version if any. */
export interface TranslationSaved {
  resource: unknown;
  workingCopyVersion: number | null;
}

const project = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`;

async function put(path: string, fields: Record<string, unknown>, versions: TranslationVersions): Promise<TranslationSaved> {
  const body: Record<string, unknown> = { ...fields, version: versions.version };
  if (versions.workingCopyVersion !== null) body.workingCopyVersion = versions.workingCopyVersion;
  const { body: resource, headers } = await apiRequestWithHeaders<unknown>(path, { method: "PUT", body });
  const copyVersion = headers.get("X-Working-Copy-Version");
  return { resource, workingCopyVersion: copyVersion === null ? null : Number(copyVersion) };
}

/** The Resource's own texts in one language, e.g. `{title, summary}`. */
export function putTranslation(
  projectId: string,
  kind: TranslatedKind,
  id: string,
  language: string,
  fields: Record<string, unknown>,
  versions: TranslationVersions,
): Promise<TranslationSaved> {
  return put(`${project(projectId)}/${kind}/${encodeURIComponent(id)}/translations/${encodeURIComponent(language)}`, fields, versions);
}

/** A Route Stop's texts; the versions and the response are the Route's. */
export function putStopTranslation(
  projectId: string,
  routeId: string,
  stopId: string,
  language: string,
  fields: Record<string, unknown>,
  versions: TranslationVersions,
): Promise<TranslationSaved> {
  return put(
    `${project(projectId)}/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}/translations/${encodeURIComponent(language)}`,
    fields,
    versions,
  );
}

/** A Guide Block's texts (`text` is the backend's rich text); the versions and the response are the Guide's. */
export function putBlockTranslation(
  projectId: string,
  guideId: string,
  blockId: string,
  language: string,
  fields: Record<string, unknown>,
  versions: TranslationVersions,
): Promise<TranslationSaved> {
  return put(
    `${project(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/translations/${encodeURIComponent(language)}`,
    fields,
    versions,
  );
}

/** An Asset's texts; Assets are edited in place and have no working copy. */
export async function putAssetTranslation(
  projectId: string,
  assetId: string,
  language: string,
  fields: Record<string, unknown>,
  version: number,
): Promise<unknown> {
  const saved = await put(
    `${project(projectId)}/assets/${encodeURIComponent(assetId)}/translations/${encodeURIComponent(language)}`,
    fields,
    { version, workingCopyVersion: null },
  );
  return saved.resource;
}
