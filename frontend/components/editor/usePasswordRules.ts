"use client";

import { useEffect, useState } from "react";
import { editorApi } from "@/lib/editor/api";

// One request per page load: the rules only change with a deploy.
let rules: Promise<string> | null = null;

/**
 * The password rules as one hint sentence, from Django's AUTH_PASSWORD_VALIDATORS, so
 * the hint under a new-password field always matches what the backend enforces.
 * Undefined until loaded (or if the request fails, in which case the field has no hint
 * and a weak password still gets the backend's own message).
 */
export function usePasswordRules(): string | undefined {
  const [text, setText] = useState<string>();
  useEffect(() => {
    rules ??= editorApi
      .passwordRules()
      .then((response) => response.rules.join(" "))
      .catch(() => {
        rules = null;
        return "";
      });
    rules.then((value) => setText(value || undefined));
  }, []);
  return text;
}
