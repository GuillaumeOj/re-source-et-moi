"use client";

import { useState } from "react";
import {
  ApiError,
  describeError,
  type FieldErrors,
  fieldError,
  messagesFor,
} from "@/lib/editor/api";
import type { Status } from "./StatusMessage";

/**
 * The state every editor form keeps around a save: pending, the status line, and the
 * field errors from the last attempt.
 *
 * `submit(action)` runs the save. On failure it keeps the backend's field errors, to show
 * under the fields, and sets the status line from the error. On success it clears the
 * errors. The action sets any success status itself, since only it knows what to say.
 */
export function useSubmit() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function submit(action: () => Promise<void>) {
    setPending(true);
    setStatus(null);
    try {
      await action();
      setErrors({});
    } catch (caught) {
      setErrors(caught instanceof ApiError ? caught.fieldErrors : {});
      // A lost session (401) is the shell's to report: it shows the login form. Saying it
      // here too would leave "session expired" on this form after she logs back in.
      if (!(caught instanceof ApiError && caught.status === 401)) {
        setStatus({ tone: "error", text: describeError(caught) });
      }
    } finally {
      setPending(false);
    }
  }

  return {
    pending,
    status,
    setStatus,
    errors,
    /** The line to show under one field, or undefined. */
    errorFor: (field: string) => fieldError(errors, field),
    /** Errors about the form as a whole, not one field. */
    formErrors: messagesFor(errors, "non_field_errors"),
    submit,
  };
}
