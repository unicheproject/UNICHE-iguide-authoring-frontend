/**
 * The fixed sentences of the interface for a failed request (D-087). A problem's `detail` and `title` come from the
 * server and may hold stack traces, user names or the rejected value, so they are never shown: the sentence is chosen
 * by status and `code` here, and the request id travels beside it. This module imports nothing so `platform/api.ts`
 * and `lib/errors.ts` can both use it.
 */

/** A heading and one sentence for a failure. */
export interface ProblemText {
  title: string;
  body: string;
}

/** Sentences for the codes of the authoring API that need more than their status says (`07` §15). */
const BY_CODE: Record<string, ProblemText> = {
  VERSION_CONFLICT: {
    title: "Someone else changed this",
    body: "A newer version exists. Review both versions before you save.",
  },
  OFFLINE: {
    title: "You are offline",
    body: "Nothing was saved. Your changes are still in the form. Reconnect and try again.",
  },
  NETWORK_ERROR: {
    title: "The CMS cannot reach the server",
    body: "Check your connection and try again. Nothing was changed.",
  },
  SLUG_ALREADY_EXISTS: {
    title: "That slug is already used",
    body: "Choose a different slug for this item.",
  },
  RESOURCE_NOT_EDITABLE: {
    title: "This item cannot be edited now",
    body: "Reload the page to see its current state.",
  },
};

/** The sentence a field error carries when the problem is not a 422 (a server field message is not shown then). */
const FIELD_BY_CODE: Record<string, string> = {
  SLUG_ALREADY_EXISTS: "This slug is already used by another item.",
  MISSING_REQUIRED_FIELDS: "This field is required.",
};

/** What to say about one field of a problem that is not a 422; the code decides, never the server's words. */
export function fieldSentence(code: string): string {
  return FIELD_BY_CODE[code] ?? "Check this field.";
}

/**
 * The heading and sentence for a status and `code`. `action` ("save the place") completes the generic sentences; when it
 * is empty they stand without it, which is how `ApiError.message` is built.
 */
export function problemText(status: number, code: string, action = ""): ProblemText {
  const byCode = BY_CODE[code];
  if (byCode) return byCode;
  const couldNot = action ? `The CMS could not ${action}. ` : "";
  switch (status) {
    case 0:
      return BY_CODE.NETWORK_ERROR;
    case 401:
      return { title: "Your session ended", body: "Sign in again. Unsaved edits stay in this browser." };
    case 403:
      return {
        title: "You no longer have access",
        body: "Your account cannot do this in this Project. Ask a Project manager to check your membership.",
      };
    case 404:
      return { title: "Not found", body: "This item no longer exists, or it was removed from the Project." };
    case 409:
      return { title: "This conflicts with the current state", body: "Reload to see the latest version, then try again. Nothing was changed." };
    case 422:
      return { title: "Some fields need a change", body: "Check the fields marked in the form." };
    case 429:
      return { title: "Too many requests", body: "Wait a moment and try again. Nothing was changed." };
    case 502:
    case 504:
      return { title: "The UNICHE platform did not answer", body: `${couldNot}Nothing was changed. Try again in a moment.` };
    case 503:
      return { title: "The platform is busy", body: "The platform is busy or down for maintenance. Nothing was changed. Try again in a few minutes." };
    case 500:
      return {
        title: "The server hit a problem",
        body: `${couldNot}Nothing was changed. Try again; if it keeps happening, send the request id to support.`,
      };
    default:
      return { title: "Something went wrong", body: `${couldNot}Try again; if it keeps happening, send the request id to support.` };
  }
}
