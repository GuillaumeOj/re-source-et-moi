import { ApiError, type FieldErrors, request as send } from "@/lib/api/browser";
import { REVALIDATE_SECONDS } from "@/lib/api/cache";
import type { components } from "@/lib/api/generated";

export { ApiError, type FieldErrors, fieldError, messagesFor } from "@/lib/api/browser";

/**
 * The editor's calls to the Django API, made from Cécile's browser with her Django session
 * cookie, through `lib/api/browser.ts` (same-origin paths, CSRF handled there).
 *
 * One concern lives here so that no page has to think about it: a 401 (the session is
 * gone) is reported to whoever listens: the editor's shell, which shows the login form
 * again.
 */

type Schemas = components["schemas"];
export type Session = Schemas["Session"];
export type LoginRequest = Schemas["LoginRequest"];
export type AccountInput = Schemas["AccountRequest"];
export type PasswordChangeInput = Schemas["PasswordChangeRequest"];
export type PasswordResetConfirmInput = Schemas["PasswordResetConfirmRequest"];
export type ManagedEvent = Schemas["EventManage"];
export type EventPage = Schemas["PaginatedEventManageList"];
export type EventInput = Schemas["EventManageRequest"];
export type EventPatch = Schemas["PatchedEventManageRequest"];
export type ManagedAddress = Schemas["AddressManage"];
export type AddressInput = Schemas["AddressManageRequest"];
export type ManagedPricingType = Schemas["PricingTypeManage"];
export type PricingTypeInput = Schemas["PricingTypeManageRequest"];
export type ManagedReview = Schemas["ReviewManage"];
export type ReviewInput = Schemas["ReviewManageRequest"];
export type ReviewPatch = Schemas["PatchedReviewManageRequest"];

/** The list's query: a period tab and a page, or the calendar's date range. */
export type EventQuery = {
  period?: "upcoming" | "past";
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
};

/** Page size of the list view. Sent explicitly, so the page count is computed here. */
export const EVENTS_PAGE_SIZE = 20;

/** The error object for line `index` of a nested list field, e.g. `prices`. */
export function nestedErrors(
  errors: FieldErrors | undefined,
  field: string,
  index: number,
): FieldErrors | undefined {
  const value = errors?.[field];
  if (!Array.isArray(value)) {
    return undefined;
  }
  const item = value[index];
  return item !== null && typeof item === "object" ? item : undefined;
}

export const SAVED_LIVE = "Enregistré. Le site est à jour.";
export const SAVED_SOON = `Enregistré. Le site sera à jour d'ici ${REVALIDATE_SECONDS / 60} minutes.`;
export const SAVE_FAILED =
  "L'enregistrement a échoué. Vérifiez votre connexion internet, puis réessayez.";
export const FIX_FIELDS = "Certains champs sont à corriger, voir ci-dessous.";
export const SESSION_ENDED = "Votre session a expiré. Reconnectez-vous pour continuer.";
export const TOO_MANY = "Trop de tentatives. Patientez avant de réessayer.";
export const UNREACHABLE = "Connexion impossible pour le moment. Réessayez dans un instant.";

/** The sentence to show for a failed call inside the editor. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return FIX_FIELDS;
    if (error.status === 401) return SESSION_ENDED;
    if (error.status === 429) return TOO_MANY;
  }
  return SAVE_FAILED;
}

/**
 * The sentence for a failed call on a logged-out page (login, reset). A 400 there has a
 * message of its own, which `on400` picks from the body.
 */
export function describeAuthError(error: unknown, on400: (error: ApiError) => string): string {
  if (error instanceof ApiError && error.status === 429) return TOO_MANY;
  if (error instanceof ApiError && error.status === 400) return on400(error);
  return UNREACHABLE;
}

const sessionLostListeners = new Set<() => void>();

/** Be told whenever a call finds the session gone. Returns the unsubscribe function. */
export function onSessionLost(listener: () => void): () => void {
  sessionLostListeners.add(listener);
  return () => sessionLostListeners.delete(listener);
}

type RequestOptions = {
  /** A 401 here is an answer, not a lost session: the startup session check. */
  expectLoggedOut?: boolean;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  { expectLoggedOut = false }: RequestOptions = {},
): Promise<T> {
  try {
    return await send<T>(method, path, body);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !expectLoggedOut) {
      for (const listener of sessionLostListeners) {
        listener();
      }
    }
    throw error;
  }
}

export const editorApi = {
  session: () => request<Session>("GET", "/auth/session/", undefined, { expectLoggedOut: true }),
  login: (credentials: LoginRequest) =>
    request<Session>("POST", "/auth/login/", credentials, { expectLoggedOut: true }),
  logout: () => request<void>("POST", "/auth/logout/"),
  updateAccount: (input: AccountInput) => request<Session>("PUT", "/auth/account/", input),
  changePassword: (input: PasswordChangeInput) => request<void>("POST", "/auth/password/", input),
  passwordRules: () => request<{ rules: string[] }>("GET", "/auth/password-rules/"),
  requestPasswordReset: (email: string) =>
    request<void>("POST", "/auth/password-reset/", { email }),
  confirmPasswordReset: (input: PasswordResetConfirmInput) =>
    request<void>("POST", "/auth/password-reset/confirm/", input),

  listEvents: (query: EventQuery) => {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return request<EventPage>("GET", `/manage/events/?${params}`);
  },
  /**
   * Every event in a date range, following the pages. The calendar needs the whole range
   * at once, and pages of 200 mean that is one request in practice.
   */
  listAllEvents: async (date_from: string, date_to: string): Promise<ManagedEvent[]> => {
    const events: ManagedEvent[] = [];
    for (let page = 1; ; page += 1) {
      const batch = await editorApi.listEvents({ date_from, date_to, page, page_size: 200 });
      events.push(...batch.results);
      if (!batch.next) {
        return events;
      }
    }
  },
  createEvent: (input: EventInput) => request<ManagedEvent>("POST", "/manage/events/", input),
  updateEvent: (id: string, input: EventInput) =>
    request<ManagedEvent>("PUT", `/manage/events/${id}/`, input),
  patchEvent: (id: string, patch: EventPatch) =>
    request<ManagedEvent>("PATCH", `/manage/events/${id}/`, patch),
  deleteEvent: (id: string) => request<void>("DELETE", `/manage/events/${id}/`),

  /** Every saved address, by name. A short list, which the event form's picker loads whole. */
  listAddresses: () => request<ManagedAddress[]>("GET", "/manage/addresses/"),
  createAddress: (input: AddressInput) =>
    request<ManagedAddress>("POST", "/manage/addresses/", input),
  updateAddress: (id: string, input: AddressInput) =>
    request<ManagedAddress>("PUT", `/manage/addresses/${id}/`, input),
  /** Refused (400, with a message) while a workshop still uses the address. */
  deleteAddress: (id: string) => request<void>("DELETE", `/manage/addresses/${id}/`),

  listPricingTypes: () => request<ManagedPricingType[]>("GET", "/manage/pricing-types/"),
  createPricingType: (input: PricingTypeInput) =>
    request<ManagedPricingType>("POST", "/manage/pricing-types/", input),
  updatePricingType: (id: string, input: PricingTypeInput) =>
    request<ManagedPricingType>("PUT", `/manage/pricing-types/${id}/`, input),
  deletePricingType: (id: string) => request<void>("DELETE", `/manage/pricing-types/${id}/`),
  /** Set the order of every group in one all-or-nothing request. */
  reorderPricingTypes: (ids: string[]) =>
    request<void>("POST", "/manage/pricing-types/reorder/", { ids }),

  /** Every review, hidden ones included, newest first. */
  listReviews: () => request<ManagedReview[]>("GET", "/manage/reviews/"),
  createReview: (input: ReviewInput) => request<ManagedReview>("POST", "/manage/reviews/", input),
  updateReview: (id: string, input: ReviewInput) =>
    request<ManagedReview>("PUT", `/manage/reviews/${id}/`, input),
  patchReview: (id: string, patch: ReviewPatch) =>
    request<ManagedReview>("PATCH", `/manage/reviews/${id}/`, patch),
  deleteReview: (id: string) => request<void>("DELETE", `/manage/reviews/${id}/`),
};
