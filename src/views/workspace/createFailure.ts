import { describeError } from "@/lib/errors";
import type { ApiError } from "@/platform/api";

/**
 * The one sentence a create dialog shows for a failure that belongs to no field (D-105, C3-85, C3-89). The wording comes
 * from the shared table (`describeError`), so a 503 reads the same here as in a list or an editor; only the closing
 * claim is the dialog's own: it says "Nothing was created", never "nothing was saved" or "not reachable" (that is for
 * network failures only). A 400 or 422 that named no field says to check the form. The request id travels beside it in
 * the dialog's summary (`FormDialog request-id`).
 *
 * @param error the failed request
 * @param noun what was being created, lower case: "route", "point of interest"
 */
export function createFailure(error: ApiError, noun: string): string {
  if (error.status === 0 || error.code === "OFFLINE") {
    return "You are offline. Nothing was created. What you typed is still here; reconnect and try again.";
  }
  if (error.status === 400 || error.status === 422) return `The ${noun} was not created. Check what you entered and try again.`;
  return describeError(error, `create the ${noun}`).body.replace("Nothing was changed.", "Nothing was created.");
}
