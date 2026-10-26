import { forceTokenRefresh, getAccessToken, platformConfig, sessionExpired } from "./auth";

/**
 * Client for the authoring API. Every request carries the user's bearer token, which the backend
 * validates and forwards to the Catalogue.
 *
 * A `401` means the token was revoked or expired early: the client refreshes it once and repeats the
 * request, and only if that also fails does it send the user back to login. The user never sees a
 * `401`.
 */

/** One field error of a problem body (spec 07 section 15): the field's path, a stable code, and a message. */
export interface FieldError {
  path: string;
  code: string;
  message: string;
}

/** The URN prefix of a problem `type`; the rest is the code (spec 07 section 15). */
const PROBLEM_TYPE_PREFIX = "urn:uniche:iguide:problem:";

export class ApiError extends Error {
  readonly status: number;
  /** The problem's `code`, e.g. VALIDATION_ERROR or VERSION_CONFLICT; clients match on it, never on the URN. */
  readonly code: string;
  readonly requestId: string | null;
  /** The field errors as "path: message", the form callers rewrite paths in. */
  readonly details: string[];
  /** The field errors with their codes; built from `details` when an error was made locally. */
  readonly fieldErrors: FieldError[];
  /** The parsed error body, for fields specific to one error such as `currentVersion` on a 409. */
  readonly body: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string | null,
    details: string[],
    body: Record<string, unknown> = {},
    fieldErrors?: FieldError[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
    this.body = body;
    this.fieldErrors = fieldErrors ?? details.map((detail) => {
      const separator = detail.indexOf(": ");
      return separator > 0
        ? { path: detail.slice(0, separator), code: "", message: detail.slice(separator + 2) }
        : { path: "", code: "", message: detail };
    });
  }

  /**
   * The `details` entries ("path: message") keyed by path, so a form can show each message at its field.
   * Entries without a path are returned under "".
   */
  fieldMessages(): Record<string, string> {
    const byPath: Record<string, string> = {};
    for (const detail of this.details) {
      const separator = detail.indexOf(": ");
      const path = separator > 0 ? detail.slice(0, separator) : "";
      const message = separator > 0 ? detail.slice(separator + 2) : detail;
      byPath[path] = byPath[path] ? `${byPath[path]} ${message}` : message;
    }
    return byPath;
  }

  /** `502`, `503`, `504`: the backend answered, but the UNICHE platform behind it did not. */
  get platformUnavailable(): boolean {
    return this.status === 502 || this.status === 503 || this.status === 504;
  }

  /** No response at all: the backend is down, the network is gone, or the browser blocked the request. */
  get backendUnreachable(): boolean {
    return this.status === 0;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** The `Accept` header; JSON unless a binary body is expected, such as an image. */
  accept?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);
  if (response.status === 401) {
    await forceTokenRefresh();
    response = await send(path, options);
    if (response.status === 401) {
      await sessionExpired();
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/**
 * Like `apiRequest`, also returning the response headers, for a value an endpoint sends there, such as the working
 * copy's version after a translation saved into it (`X-Working-Copy-Version`, backend D-031).
 */
export async function apiRequestWithHeaders<T>(path: string, options: RequestOptions = {}): Promise<{ body: T; headers: Headers }> {
  let response = await send(path, options);
  if (response.status === 401) {
    await forceTokenRefresh();
    response = await send(path, options);
    if (response.status === 401) {
      await sessionExpired();
    }
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  const body = response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  return { body, headers: response.headers };
}

/**
 * A binary body, such as a QR image, with the same bearer token, single retry after a 401, and error parsing as
 * `apiRequest`. Needed where an `<img src>` cannot carry the token.
 */
export async function apiBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const accept = options.accept ?? "*/*, application/json, application/problem+json";
  let response = await send(path, { ...options, accept });
  if (response.status === 401) {
    await forceTokenRefresh();
    response = await send(path, { ...options, accept });
    if (response.status === 401) {
      await sessionExpired();
    }
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.blob();
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    // Problem details (`application/problem+json`, spec 07 section 15) answer errors.
    Accept: options.accept ?? "application/json, application/problem+json",
    Authorization: `Bearer ${token}`,
  };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  try {
    return await fetch(`${platformConfig().apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: options.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw e;
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "The iGuide backend could not be reached. Check that it is running; nothing was changed.",
      null,
      [],
    );
  }
}

/**
 * Multipart upload with progress. `fetch` cannot report upload progress, so this uses XMLHttpRequest with
 * the same bearer token, the same single retry after a 401, and the same error parsing as `apiRequest`.
 */
export async function apiUpload<T>(
  path: string,
  form: FormData,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  let result = await sendUpload(path, form, onProgress, signal);
  if (result.status === 401) {
    await forceTokenRefresh();
    result = await sendUpload(path, form, onProgress, signal);
    if (result.status === 401) await sessionExpired();
  }
  if (result.status < 200 || result.status >= 300) {
    throw await toApiError(new Response(result.body || null, { status: result.status, headers: result.headers }));
  }
  return JSON.parse(result.body) as T;
}

interface UploadResult {
  status: number;
  body: string;
  headers: Headers;
}

async function sendUpload(
  path: string,
  form: FormData,
  onProgress: ((fraction: number) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<UploadResult> {
  const token = await getAccessToken();
  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${platformConfig().apiBaseUrl}${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json, application/problem+json");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      const headers = new Headers();
      const contentType = xhr.getResponseHeader("Content-Type");
      if (contentType) headers.set("Content-Type", contentType);
      resolve({ status: xhr.status, body: xhr.responseText, headers });
    };
    xhr.onerror = () => reject(new ApiError(0, "NETWORK_ERROR", "The iGuide backend could not be reached. Check that it is running; nothing was uploaded.", null, []));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(form);
  });
}

/**
 * Accepts both the backend's current envelope (`code`, `message`, `details`, `requestId`) and RFC 7807
 * problem details (`code`, `title`, `detail`, `requestId`), so the CMS keeps working when the backend
 * adopts the latter.
 */
async function toApiError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    // Not JSON, e.g. a proxy error page. The status alone still drives the CMS state.
  }

  // RFC 7807 problem details (spec 07 section 15, backend D-034): `code` beside a URN `type`, `detail`, and
  // `errors[{path, code, message}]`. The earlier envelope, whose `type` was the bare code and whose `title` was the
  // message, reads the same way.
  const type = str(body.type);
  const code =
    str(body.code) ??
    (type?.startsWith(PROBLEM_TYPE_PREFIX) ? type.slice(PROBLEM_TYPE_PREFIX.length) : type && !type.includes(":") ? type : null) ??
    `HTTP_${response.status}`;
  const message = str(body.detail) ?? str(body.title) ?? str(body.message) ?? defaultMessage(response.status);
  const requestId =
    str(body.requestId) ?? response.headers.get("X-UNICHE-Request-Id") ?? response.headers.get("X-Request-Id");
  const fieldErrors: FieldError[] = Array.isArray(body.errors)
    ? body.errors.flatMap((e) => {
        const item = e as { path?: unknown; code?: unknown; message?: unknown };
        const text = str(item.message);
        return text ? [{ path: str(item.path) ?? "", code: str(item.code) ?? "", message: text }] : [];
      })
    : [];
  const details = Array.isArray(body.details)
    ? body.details.filter((d): d is string => typeof d === "string")
    : fieldErrors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message));
  return new ApiError(response.status, code, message, requestId, details, body, fieldErrors.length ? fieldErrors : undefined);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function defaultMessage(status: number): string {
  switch (status) {
    case 403:
      return "The UNICHE Catalogue does not allow this operation.";
    case 404:
      return "Not found.";
    case 502:
    case 503:
    case 504:
      return "The UNICHE platform is not reachable.";
    default:
      return `The request failed with status ${status}.`;
  }
}
