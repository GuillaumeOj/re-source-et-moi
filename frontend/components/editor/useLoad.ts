"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Load one thing for an editor view, and keep it right while the view changes.
 *
 * - `fetcher` must be memoised (useCallback) on what it asks for. A new fetcher is a new
 *   request.
 * - `trigger` asks again for the same thing, e.g. after a save elsewhere changed it.
 * - Only the latest request may land. Switching tab, page or month faster than the
 *   answers arrive would otherwise let an earlier answer overwrite a newer one.
 * - `onError` may handle a failure itself (return true), e.g. the list stepping back from
 *   a page that no longer exists. Anything else shows `failed` and a retry. A lost session
 *   needs nothing here: the fetch layer reports it to the shell.
 */
export function useLoad<T>(
  fetcher: () => Promise<T>,
  trigger: unknown = null,
  onError?: (error: unknown) => boolean,
) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const [retries, setRetries] = useState(0);
  const latest = useRef(0);
  const handleError = useRef(onError);
  handleError.current = onError;

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger and retries are the triggers themselves
  useEffect(() => {
    const request = ++latest.current;
    setFailed(false);
    fetcher()
      .then((result) => {
        if (request === latest.current) {
          setData(result);
        }
      })
      .catch((error: unknown) => {
        if (request === latest.current && !handleError.current?.(error)) {
          setFailed(true);
        }
      });
  }, [fetcher, trigger, retries]);

  const reload = useCallback(() => setRetries((count) => count + 1), []);
  return { data, setData, failed, reload };
}
