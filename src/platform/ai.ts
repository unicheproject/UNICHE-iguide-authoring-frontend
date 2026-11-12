import { apiRequest, apiRequestWithHeaders } from "./api";
import type { TranslatedKind, TranslationSaved, TranslationVersions } from "./translations";

/**
 * MuseMind machine translation and its review (iGuide spec 12 section 3, spec 03 section 1; backend D-035 and D-036,
 * CMS D-026 and D-027). The CMS never calls the UNICHE AI gateway itself: the backend does, and on the dev box through a labelled
 * mock. The types are hand-written until the generated client exists (GAPS.md G-001).
 */

/** `DISABLED`: no gateway configured; `MOCK`: the dev box's stand-in, whose output is not a real translation. */
export type AiTranslationStatus = "DISABLED" | "MOCK" | "AVAILABLE";

export interface AiStatus {
  translation: AiTranslationStatus;
}

/** The `provenance` of one translation row (spec 03 section 1). */
export interface Provenance {
  origin: "HUMAN" | "AI_GENERATED" | string;
  serviceId: string | null;
  function: string | null;
  requestId: string | null;
  sourceLanguage: string | null;
  citations: unknown[];
  generatedAt: string | null;
  reviewedBySubject: string | null;
  reviewedAt: string | null;
}

type ResourceType = "PLACE" | "POI" | "ROUTE" | "GUIDE" | "EVENT" | "CATEGORY";
export type ProvenanceResourceType = ResourceType | "ROUTE_STOP" | "GUIDE_BLOCK" | "ASSET";

/**
 * One machine-translated language of a Resource, a Route stop or Guide block (`parentType`/`parentId` name the Route
 * or Guide), or a media item; `pending` when it is only in the Resource's pending changes.
 */
export interface AiProvenanceEntry {
  resourceType: ProvenanceResourceType;
  resourceId: string;
  parentType?: ProvenanceResourceType | null;
  parentId?: string | null;
  languageCode: string;
  provenance: Provenance;
  pending: boolean;
}

export const RESOURCE_TYPE_KIND: Record<ResourceType, TranslatedKind> = {
  PLACE: "places",
  POI: "pois",
  ROUTE: "routes",
  GUIDE: "guides",
  EVENT: "events",
  CATEGORY: "categories",
};

/** What MuseMind translates: the six Resource kinds and media items. */
export type AiKind = TranslatedKind | "assets";

/** A translatable part of an item: its own texts, one Route stop, or one Guide block (the story). */
export type AiPart = "self" | `stop:${string}` | `block:${string}`;

/** Where an entry shows in the workspace: the item it belongs to and the part of it; null for an unknown type. */
export function entryLocation(entry: AiProvenanceEntry): { kind: AiKind; itemId: string; part: AiPart } | null {
  switch (entry.resourceType) {
    case "ROUTE_STOP":
      return entry.parentId ? { kind: "routes", itemId: entry.parentId, part: `stop:${entry.resourceId}` } : null;
    case "GUIDE_BLOCK":
      return entry.parentId ? { kind: "guides", itemId: entry.parentId, part: `block:${entry.resourceId}` } : null;
    case "ASSET":
      return { kind: "assets", itemId: entry.resourceId, part: "self" };
    default: {
      const kind = RESOURCE_TYPE_KIND[entry.resourceType];
      return kind ? { kind, itemId: entry.resourceId, part: "self" } : null;
    }
  }
}

function translationPath(projectId: string, kind: AiKind, id: string, part: AiPart, language: string): string {
  const child =
    part === "self" ? "" : part.startsWith("stop:") ? `/stops/${encodeURIComponent(part.slice(5))}` : `/blocks/${encodeURIComponent(part.slice(6))}`;
  return `/projects/${encodeURIComponent(projectId)}/${kind}/${encodeURIComponent(id)}${child}/translations/${encodeURIComponent(language)}`;
}

export function fetchAiStatus(signal?: AbortSignal): Promise<AiStatus> {
  return apiRequest<AiStatus>("/ai/status", { signal });
}

/**
 * Fills one language of one part from the default language: a Resource's own texts, a Route stop's, a Guide block's
 * (the story's rich text), or a media item's. Saved like a human translation: a DRAFT and a media item in place, an
 * ACTIVE Resource into its pending changes. The response is the Resource (the Route or Guide for its parts) or the
 * media item.
 */
export async function translateWithMuseMind(
  projectId: string,
  kind: AiKind,
  id: string,
  part: AiPart,
  language: string,
  versions: TranslationVersions,
): Promise<TranslationSaved> {
  const body: Record<string, unknown> = { version: versions.version };
  if (versions.workingCopyVersion !== null) body.workingCopyVersion = versions.workingCopyVersion;
  const { body: resource, headers } = await apiRequestWithHeaders<unknown>(`${translationPath(projectId, kind, id, part, language)}:translate`, {
    method: "POST",
    body,
  });
  const copyVersion = headers.get("X-Working-Copy-Version");
  return { resource, workingCopyVersion: copyVersion === null ? null : Number(copyVersion) };
}

/** Records that a person checked the machine translation; the text is unchanged. */
export function markReviewed(projectId: string, kind: AiKind, id: string, part: AiPart, language: string): Promise<AiProvenanceEntry> {
  return apiRequest<AiProvenanceEntry>(`${translationPath(projectId, kind, id, part, language)}:mark-reviewed`, { method: "POST", body: {} });
}

/** Every machine-translated language in the Project, reviewed or not. */
export function fetchAiProvenance(projectId: string, signal?: AbortSignal): Promise<AiProvenanceEntry[]> {
  return apiRequest<AiProvenanceEntry[]>(`/projects/${encodeURIComponent(projectId)}/ai-provenance`, { signal });
}
