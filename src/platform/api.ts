import { forceTokenRefresh, getAccessToken, platformConfig, sessionExpired } from "./auth";

/**
 * Client for the authoring API. Every request carries the user's bearer token, which the backend
 * validates and forwards to the Catalogue.
 *
 * A `401` means the token was revoked or expired early: the client refreshes it once and repeats the
 * request, and only if that also fails does it send the user back to login. The user never sees a
 * `401`.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details: string[];
  /** The parsed error body, for fields specific to one error such as `currentVersion` on a 409. */
  readonly body: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string | null,
    details: string[],
    body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
    this.body = body;
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

async function send(path: string, options: RequestOptions): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
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
    xhr.setRequestHeader("Accept", "application/json");
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

  // The iGuide backend's envelope names the code `type` and lists `errors[{path, code, message}]`
  // (backend ErrorEnvelope, until M0a); they are read into the same `code` and "path: message" details.
  const code = str(body.code) ?? str(body.type) ?? `HTTP_${response.status}`;
  const message = str(body.message) ?? str(body.detail) ?? str(body.title) ?? defaultMessage(response.status);
  const requestId =
    str(body.requestId) ?? response.headers.get("X-UNICHE-Request-Id") ?? response.headers.get("X-Request-Id");
  const details = Array.isArray(body.details)
    ? body.details.filter((d): d is string => typeof d === "string")
    : Array.isArray(body.errors)
      ? body.errors.flatMap((e) => {
          const item = e as { path?: unknown; message?: unknown };
          const text = str(item.message);
          if (!text) return [];
          const path = str(item.path);
          return [path ? `${path}: ${text}` : text];
        })
      : [];
  return new ApiError(response.status, code, message, requestId, details, body);
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
