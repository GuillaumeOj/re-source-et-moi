/**
 * Calls to the Django API made from the browser: the editor's, and the contact form's.
 *
 * Unlike `lib/api/client.ts`, which reads the public feeds on the server, this runs in the
 * visitor's browser. The paths are relative (`/api/...`), so they are same-origin. In
 * production that is Vercel's `/api` rewrite to the backend service. Locally it is the
 * matching rewrite in next.config.ts. Being same-origin is what lets the session cookie
 * and the CSRF check work without CORS credentials.
 *
 * Every write needs Django's CSRF token, so it is fetched before the first write that
 * needs it and no caller has to think about it.
 */

/**
 * DRF's error body: a message list per field. A nested list (the lines of a tariff
 * group) carries one such object per line, `{}` where the line was fine.
 */
export type FieldErrors = { [field: string]: string[] | FieldErrors[] | undefined };

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(status: number, body: unknown) {
    super(`API responded ${status}`);
    this.status = status;
    // Only a JSON object is a DRF validation body. A CSRF failure answers with Django's
    // HTML page, which the caller treats like any other refusal.
    this.fieldErrors =
      body !== null && typeof body === "object" && !Array.isArray(body)
        ? (body as FieldErrors)
        : {};
  }
}

/** The messages for one field, flattened for display. Empty when there are none. */
export function messagesFor(errors: FieldErrors | undefined, field: string): string[] {
  const value = errors?.[field];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as string[])
    : [];
}

/** One field's messages as the single line a Field shows, or undefined when it's fine. */
export function fieldError(errors: FieldErrors | undefined, field: string): string | undefined {
  return messagesFor(errors, field).join(" ") || undefined;
}

function csrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Have Django set the CSRF cookie if the browser doesn't hold it yet. Writes do this by
 * themselves; a page calls it early (e.g. when a form is first focused) so the fetch
 * happens while the visitor types rather than when they press send.
 */
export async function ensureCsrf(): Promise<void> {
  if (csrfToken() === null) {
    await request<void>("GET", "/auth/csrf/");
  }
}

/** Call `/api{path}`. Resolves with the JSON body (undefined for a 204), throws ApiError. */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (method !== "GET") {
    // Asking only when the cookie is missing costs one request per browser session.
    await ensureCsrf();
    headers["X-CSRFToken"] = csrfToken() ?? "";
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data);
  }
  return data as T;
}
