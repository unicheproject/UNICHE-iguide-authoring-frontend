import type { ApiError } from "@/platform/api";

/**
 * Missing fields of an activation refused from a list, handed to the editor the list opens next, so it shows
 * them at their fields and focuses the first (`12` §3 Activate a Resource, DECISIONS.md D-036).
 */
interface Handoff {
  fields: Record<string, string>;
  requestId: string | null;
}

const pending = new Map<string, Handoff>();

export function handOffActivationErrors(resourceId: string, error: ApiError) {
  pending.set(resourceId, { fields: error.fieldMessages(), requestId: error.requestId });
}

/** The missing fields handed over for the Resource, once; null when there are none. */
export function takeActivationErrors(resourceId: string): Handoff | null {
  const found = pending.get(resourceId) ?? null;
  pending.delete(resourceId);
  return found;
}
