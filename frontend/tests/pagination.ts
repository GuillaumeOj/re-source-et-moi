/** A DRF page of `results`, as the paginated lists return it. */
export function page<T>(
  results: T[],
  { count = results.length, next = null }: { count?: number; next?: string | null } = {},
) {
  return { count, next, previous: null, results };
}
