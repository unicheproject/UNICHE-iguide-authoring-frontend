import { ApiError } from "@/platform/api";
import { problemText } from "@/lib/problemText";

/** What the interface shows for a failed request: plain sentences, the request id, never the rejected value. */
export interface DescribedError {
  title: string;
  body: string;
  requestId: string | null;
}

/**
 * Maps a failure to author-facing sentences chosen by `code` and status (D-087, `07` §15). The server's `detail` and
 * `title` are never used: they can hold stack traces, user names and the rejected value. The one exception is the
 * message of a 422 field error, which a form shows at its field through `ApiError.fieldErrors`, not through here.
 * `action` names what was being done ("save the place") and completes the sentences for a status with no more specific
 * wording. "Not reachable" is said only for a network failure; 503 reads "busy or down for maintenance".
 */
export function describeError(error: unknown, action = "complete this"): DescribedError {
  if (!(error instanceof ApiError)) {
    return { title: "Something went wrong", body: `The CMS could not ${action}. Nothing was changed. Try again.`, requestId: null };
  }
  const text = problemText(error.status, error.code, action);
  return { title: text.title, body: text.body, requestId: error.requestId };
}
