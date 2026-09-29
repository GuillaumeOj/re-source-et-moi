"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/editor/api";
import { useLoad } from "./useLoad";

/**
 * useLoad for a paginated DRF list: the current page, the page count, and a step back
 * when the page asked for no longer exists.
 *
 * - `fetchPage` must be memoised on everything but the page (e.g. the list's filter).
 * - `pageSize` must be the size `fetchPage` asks the backend for, so the count is right.
 */
export function usePagedLoad<T extends { count: number }>(
  fetchPage: (page: number) => Promise<T>,
  pageSize: number,
  trigger: unknown = null,
) {
  const [page, setPage] = useState(1);
  const fetcher = useCallback(() => fetchPage(page), [fetchPage, page]);
  const load = useLoad(fetcher, trigger, (error) => {
    // DRF answers 404 for a page past the end, e.g. once a deletion emptied the last
    // page. Step back rather than fail.
    if (error instanceof ApiError && error.status === 404 && page > 1) {
      setPage(page - 1);
      return true;
    }
    return false;
  });
  const pageCount = load.data ? Math.max(1, Math.ceil(load.data.count / pageSize)) : 1;
  return { ...load, page, setPage, pageCount };
}
